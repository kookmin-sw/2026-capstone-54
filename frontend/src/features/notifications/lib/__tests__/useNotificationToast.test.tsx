const mockToast = jest.fn();
const mockNavigate = jest.fn();
const mockMarkRead = jest.fn();

interface MockNotification {
  id: number;
  message: string;
  category: string;
  isRead: boolean;
  notifiableType: string | null;
  notifiableId: string | null;
  time: string;
}

let currentNotifications: MockNotification[] = [];

jest.mock("sonner", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../../model/store", () => ({
  useNotificationStore: <T,>(selector: (s: { notifications: MockNotification[]; markRead: jest.Mock }) => T): T =>
    selector({ notifications: currentNotifications, markRead: mockMarkRead }),
}));

import { renderHook, act } from "@testing-library/react";
import { useNotificationToast } from "../useNotificationToast";

function notif(overrides?: Partial<MockNotification>): MockNotification {
  return {
    id: 1,
    message: "새 알림",
    category: "system",
    isRead: false,
    notifiableType: null,
    notifiableId: null,
    time: "방금 전",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  currentNotifications = [];
});

describe("useNotificationToast — 신규 알림 토스트", () => {
  it("초기 렌더 + 빈 목록 → 토스트 호출 안 됨", () => {
    renderHook(() => useNotificationToast());
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("isRead=true 인 알림 → 토스트 호출 안 됨 (초기 로드 시 기존 읽음 스킵)", () => {
    currentNotifications = [notif({ id: 1, isRead: true })];
    renderHook(() => useNotificationToast());
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("신규 isRead=false 알림 → toast 호출 (message + duration 5000)", () => {
    currentNotifications = [notif({ id: 1, message: "새 메시지", isRead: false })];
    renderHook(() => useNotificationToast());

    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith("새 메시지", expect.objectContaining({ duration: 5000 }));
  });

  it("notifiableType + ACTION_LABEL 매칭 → action 슬롯 포함 토스트", () => {
    currentNotifications = [
      notif({
        id: 1,
        category: "resume",
        notifiableType: "resumes.resume",
        notifiableId: "uuid-1",
      }),
    ];
    renderHook(() => useNotificationToast());

    const [, opts] = mockToast.mock.calls[0] as [string, { action?: { label: string; onClick: () => void } }];
    expect(opts.action).toBeDefined();
    expect(opts.action?.label).toBe("이력서 결과 보기");
  });

  it("action onClick → markRead + navigate 호출", () => {
    currentNotifications = [
      notif({
        id: 9,
        category: "interview",
        notifiableType: "interviews.interviewsession",
        notifiableId: "sess-1",
      }),
    ];
    renderHook(() => useNotificationToast());

    const [, opts] = mockToast.mock.calls[0] as [string, { action?: { onClick: () => void } }];
    opts.action!.onClick();

    expect(mockMarkRead).toHaveBeenCalledWith(9);
    expect(mockNavigate).toHaveBeenCalledWith("/interview/session/sess-1/report");
  });

  it("category 가 ACTION_LABEL 에 없음 → action 미포함", () => {
    currentNotifications = [
      notif({ category: "system", notifiableType: "resumes.resume", notifiableId: "x" }),
    ];
    renderHook(() => useNotificationToast());

    const [, opts] = mockToast.mock.calls[0] as [string, { action?: unknown }];
    expect(opts.action).toBeUndefined();
  });

  it("notifiableId=null → action 미포함", () => {
    currentNotifications = [
      notif({ category: "resume", notifiableType: "resumes.resume", notifiableId: null }),
    ];
    renderHook(() => useNotificationToast());

    const [, opts] = mockToast.mock.calls[0] as [string, { action?: unknown }];
    expect(opts.action).toBeUndefined();
  });

  it("이미 처리된 알림 (prevIds 에 있음) → 재호출 안 됨", () => {
    currentNotifications = [notif({ id: 1 })];
    const { rerender } = renderHook(() => useNotificationToast());

    expect(mockToast).toHaveBeenCalledTimes(1);

    act(() => {
      rerender();
    });
    expect(mockToast).toHaveBeenCalledTimes(1);
  });
});
