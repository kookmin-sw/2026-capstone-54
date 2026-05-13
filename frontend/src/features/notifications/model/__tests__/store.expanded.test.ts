import { act } from "@testing-library/react";

const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn();
let capturedOnMessage: ((msg: unknown) => void) | null = null;
let capturedOnClose: (() => void) | null = null;

jest.mock("@/shared/api/realtimeApi", () => ({
  RealtimeClient: jest.fn().mockImplementation((opts: { onMessage: (m: unknown) => void; onClose: () => void }) => {
    capturedOnMessage = opts.onMessage;
    capturedOnClose = opts.onClose;
    return { connect: mockConnect, disconnect: mockDisconnect };
  }),
}));

jest.mock("../../api/notificationsApi", () => ({
  fetchNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearAllNotifications: jest.fn(),
}));

import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
  clearAllNotifications,
} from "../../api/notificationsApi";
import { useNotificationStore } from "../store";

const mockFetchNotifications = fetchNotifications as jest.Mock;
const mockMarkRead = markNotificationRead as jest.Mock;
const mockMarkAllRead = markAllNotificationsRead as jest.Mock;
const mockDelete = apiDeleteNotification as jest.Mock;
const mockClearAll = clearAllNotifications as jest.Mock;

const NOTI_A = {
  id: 1,
  message: "이력서 분석 완료",
  time: "방금 전",
  isRead: false,
  category: "resume" as const,
  notifiableType: "Resume",
  notifiableId: "r-1",
};
const NOTI_B = {
  id: 2,
  message: "면접 리포트 준비됨",
  time: "1분 전",
  isRead: false,
  category: "interview" as const,
  notifiableType: "InterviewAnalysisReport",
  notifiableId: "ar-1",
};

function resetStore() {
  act(() => {
    useNotificationStore.getState().disconnectWs();
    useNotificationStore.setState({ notifications: [], connected: false });
  });
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useNotificationStore — fetchInitial", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 notifications 저장", async () => {
    mockFetchNotifications.mockResolvedValue([NOTI_A, NOTI_B]);

    await act(async () => useNotificationStore.getState().fetchInitial());

    expect(useNotificationStore.getState().notifications).toEqual([NOTI_A, NOTI_B]);
  });
});

describe("useNotificationStore — markRead / markAllRead", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    act(() => useNotificationStore.setState({ notifications: [NOTI_A, NOTI_B] }));
  });

  it("markRead(id) 가 해당 알림 isRead=true (다른 알림 영향 없음)", async () => {
    mockMarkRead.mockResolvedValue(undefined);

    await act(async () => useNotificationStore.getState().markRead(1));

    const list = useNotificationStore.getState().notifications;
    expect(list[0].isRead).toBe(true);
    expect(list[1].isRead).toBe(false);
    expect(mockMarkRead).toHaveBeenCalledWith(1);
  });

  it("markAllRead 가 모든 알림 isRead=true", async () => {
    mockMarkAllRead.mockResolvedValue(undefined);

    await act(async () => useNotificationStore.getState().markAllRead());

    const list = useNotificationStore.getState().notifications;
    expect(list.every((n) => n.isRead)).toBe(true);
    expect(mockMarkAllRead).toHaveBeenCalled();
  });
});

describe("useNotificationStore — deleteNotification / deleteAll", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    act(() => useNotificationStore.setState({ notifications: [NOTI_A, NOTI_B] }));
  });

  it("deleteNotification(id) 가 해당 알림 제거", async () => {
    mockDelete.mockResolvedValue(undefined);

    await act(async () => useNotificationStore.getState().deleteNotification(1));

    const list = useNotificationStore.getState().notifications;
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(2);
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it("deleteAll 이 모든 알림 제거", async () => {
    mockClearAll.mockResolvedValue(undefined);

    await act(async () => useNotificationStore.getState().deleteAll());

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(mockClearAll).toHaveBeenCalled();
  });
});

describe("useNotificationStore — connectWs / disconnectWs / WS message", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    capturedOnMessage = null;
    capturedOnClose = null;
    mockConnect.mockResolvedValue(undefined);
  });

  it("connectWs 호출 시 RealtimeClient.connect + 성공 후 connected=true + fetchInitial 호출", async () => {
    mockFetchNotifications.mockResolvedValue([NOTI_A]);

    act(() => useNotificationStore.getState().connectWs());
    await flushMicrotasks();

    expect(mockConnect).toHaveBeenCalled();
    expect(useNotificationStore.getState().connected).toBe(true);
    expect(mockFetchNotifications).toHaveBeenCalled();
  });

  it("connectWs 중복 호출 시 client 재생성 안 함", () => {
    act(() => useNotificationStore.getState().connectWs());
    act(() => useNotificationStore.getState().connectWs());
    act(() => useNotificationStore.getState().connectWs());
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("WS message 수신 시 notifications 맨 앞에 추가", async () => {
    mockFetchNotifications.mockResolvedValue([]);
    act(() => useNotificationStore.getState().connectWs());
    await flushMicrotasks();

    act(() => {
      capturedOnMessage!({
        id: 99,
        message: "새 알림",
        createdAt: new Date().toISOString(),
        category: "interview",
        notifiableType: "InterviewSession",
        notifiableId: "s-1",
      });
    });

    const list = useNotificationStore.getState().notifications;
    expect(list[0].id).toBe(99);
    expect(list[0].message).toBe("새 알림");
    expect(list[0].isRead).toBe(false);
    expect(list[0].time).toBe("방금 전");
  });

  it("WS onClose 콜백 시 connected=false", async () => {
    act(() => useNotificationStore.getState().connectWs());
    await flushMicrotasks();

    act(() => capturedOnClose!());

    expect(useNotificationStore.getState().connected).toBe(false);
  });

  it("disconnectWs 호출 시 client.disconnect + connected=false", async () => {
    act(() => useNotificationStore.getState().connectWs());
    await flushMicrotasks();

    act(() => useNotificationStore.getState().disconnectWs());

    expect(mockDisconnect).toHaveBeenCalled();
    expect(useNotificationStore.getState().connected).toBe(false);
  });

  it("disconnect 후 connectWs 다시 호출하면 새 client 생성", async () => {
    act(() => useNotificationStore.getState().connectWs());
    await flushMicrotasks();
    act(() => useNotificationStore.getState().disconnectWs());

    act(() => useNotificationStore.getState().connectWs());
    await flushMicrotasks();

    expect(mockConnect).toHaveBeenCalledTimes(2);
  });
});
