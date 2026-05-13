import { useNotificationStore } from "../store";
import * as notificationsApi from "../../api/notificationsApi";

jest.mock("../../api/notificationsApi", () => ({
  fetchNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearAllNotifications: jest.fn(),
}));

jest.mock("@/shared/api/realtimeApi", () => ({
  RealtimeClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  })),
}));

const mockFetch = notificationsApi.fetchNotifications as jest.MockedFunction<
  typeof notificationsApi.fetchNotifications
>;
const mockMarkRead = notificationsApi.markNotificationRead as jest.MockedFunction<
  typeof notificationsApi.markNotificationRead
>;
const mockMarkAll = notificationsApi.markAllNotificationsRead as jest.MockedFunction<
  typeof notificationsApi.markAllNotificationsRead
>;
const mockDelete = notificationsApi.deleteNotification as jest.MockedFunction<
  typeof notificationsApi.deleteNotification
>;
const mockClear = notificationsApi.clearAllNotifications as jest.MockedFunction<
  typeof notificationsApi.clearAllNotifications
>;

const makeNotification = (id: number, isRead = false) => ({
  id,
  message: `Notification ${id}`,
  time: "방금 전",
  isRead,
  category: "system" as const,
  notifiableType: null,
  notifiableId: null,
});

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], connected: false });
    jest.clearAllMocks();
  });

  describe("fetchInitial", () => {
    it("populates notifications from the API response", async () => {
      const notifications = [makeNotification(1), makeNotification(2)];
      mockFetch.mockResolvedValueOnce(notifications);

      await useNotificationStore.getState().fetchInitial();

      expect(useNotificationStore.getState().notifications).toEqual(notifications);
    });

    it("calls fetchNotifications once", async () => {
      mockFetch.mockResolvedValueOnce([]);
      await useNotificationStore.getState().fetchInitial();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("replaces existing notifications with fresh data", async () => {
      useNotificationStore.setState({ notifications: [makeNotification(99)] });
      mockFetch.mockResolvedValueOnce([makeNotification(1)]);

      await useNotificationStore.getState().fetchInitial();

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe(1);
    });
  });

  describe("markRead", () => {
    it("sets the target notification's read flag to true", async () => {
      useNotificationStore.setState({
        notifications: [makeNotification(1), makeNotification(2)],
      });
      mockMarkRead.mockResolvedValueOnce(makeNotification(1, true));

      await useNotificationStore.getState().markRead(1);

      const { notifications } = useNotificationStore.getState();
      expect(notifications.find((n) => n.id === 1)?.isRead).toBe(true);
    });

    it("does not affect other notifications", async () => {
      useNotificationStore.setState({
        notifications: [makeNotification(1), makeNotification(2)],
      });
      mockMarkRead.mockResolvedValueOnce(makeNotification(1, true));

      await useNotificationStore.getState().markRead(1);

      expect(useNotificationStore.getState().notifications.find((n) => n.id === 2)?.isRead).toBe(
        false
      );
    });

    it("calls markNotificationRead with the correct id", async () => {
      useNotificationStore.setState({ notifications: [makeNotification(5)] });
      mockMarkRead.mockResolvedValueOnce(makeNotification(5, true));

      await useNotificationStore.getState().markRead(5);

      expect(mockMarkRead).toHaveBeenCalledWith(5);
    });
  });

  describe("markAllRead", () => {
    it("sets all notifications to read", async () => {
      useNotificationStore.setState({
        notifications: [makeNotification(1), makeNotification(2), makeNotification(3)],
      });
      mockMarkAll.mockResolvedValueOnce({ updated: 3 });

      await useNotificationStore.getState().markAllRead();

      const { notifications } = useNotificationStore.getState();
      expect(notifications.every((n) => n.isRead)).toBe(true);
    });

    it("works correctly when notifications list is empty", async () => {
      mockMarkAll.mockResolvedValueOnce({ updated: 0 });

      await useNotificationStore.getState().markAllRead();

      expect(useNotificationStore.getState().notifications).toEqual([]);
    });
  });

  describe("deleteNotification", () => {
    it("removes the specified notification from the list", async () => {
      useNotificationStore.setState({
        notifications: [makeNotification(1), makeNotification(2), makeNotification(3)],
      });
      mockDelete.mockResolvedValueOnce(undefined);

      await useNotificationStore.getState().deleteNotification(2);

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(2);
      expect(notifications.find((n) => n.id === 2)).toBeUndefined();
    });

    it("leaves remaining notifications intact", async () => {
      useNotificationStore.setState({
        notifications: [makeNotification(1), makeNotification(2)],
      });
      mockDelete.mockResolvedValueOnce(undefined);

      await useNotificationStore.getState().deleteNotification(1);

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].id).toBe(2);
    });

    it("calls deleteNotification API with the correct id", async () => {
      useNotificationStore.setState({ notifications: [makeNotification(9)] });
      mockDelete.mockResolvedValueOnce(undefined);

      await useNotificationStore.getState().deleteNotification(9);

      expect(mockDelete).toHaveBeenCalledWith(9);
    });
  });

  describe("deleteAll", () => {
    it("clears all notifications from the store", async () => {
      useNotificationStore.setState({
        notifications: [makeNotification(1), makeNotification(2), makeNotification(3)],
      });
      mockClear.mockResolvedValueOnce({ deleted: 3 });

      await useNotificationStore.getState().deleteAll();

      expect(useNotificationStore.getState().notifications).toEqual([]);
    });

    it("calls clearAllNotifications API once", async () => {
      mockClear.mockResolvedValueOnce({ deleted: 0 });

      await useNotificationStore.getState().deleteAll();

      expect(mockClear).toHaveBeenCalledTimes(1);
    });
  });
});
