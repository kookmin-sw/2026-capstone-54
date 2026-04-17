import { apiRequest } from "@/shared/api/client";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  toStoreNotification,
} from "../notificationsApi";

jest.mock("@/shared/api/client", () => ({
  apiRequest: jest.fn(),
  BASE_URL: "http://test.local",
  getAccessToken: jest.fn(() => "test-token"),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

// A backend notification with created_at very close to now so formatTime returns "방금 전"
const makeBackend = (overrides = {}) => ({
  id: 1,
  message: "Test notification",
  category: "system" as const,
  is_read: false,
  notifiable_type_label: "resumes.resume" as string | null,
  notifiable_id: "abc-123" as string | null,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("toStoreNotification", () => {
  it("maps id, message, category unchanged", () => {
    const result = toStoreNotification(makeBackend());
    expect(result.id).toBe(1);
    expect(result.message).toBe("Test notification");
    expect(result.category).toBe("system");
  });

  it("maps is_read → read", () => {
    expect(toStoreNotification(makeBackend({ is_read: true })).read).toBe(true);
    expect(toStoreNotification(makeBackend({ is_read: false })).read).toBe(false);
  });

  it("maps notifiable_type_label → notifiableType", () => {
    expect(toStoreNotification(makeBackend()).notifiableType).toBe("resumes.resume");
    expect(toStoreNotification(makeBackend({ notifiable_type_label: null })).notifiableType).toBeNull();
  });

  it("maps notifiable_id → notifiableId", () => {
    expect(toStoreNotification(makeBackend()).notifiableId).toBe("abc-123");
    expect(toStoreNotification(makeBackend({ notifiable_id: null })).notifiableId).toBeNull();
  });

  it("formats a very recent created_at as '방금 전'", () => {
    const result = toStoreNotification(makeBackend({ created_at: new Date().toISOString() }));
    expect(result.time).toBe("방금 전");
  });

  it("formats a 2-minute-old timestamp as '2분 전'", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const result = toStoreNotification(makeBackend({ created_at: twoMinutesAgo }));
    expect(result.time).toBe("2분 전");
  });

  it("formats a 3-hour-old timestamp as '3시간 전'", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const result = toStoreNotification(makeBackend({ created_at: threeHoursAgo }));
    expect(result.time).toBe("3시간 전");
  });

  it("formats a 25-hour-old timestamp as '어제'", () => {
    const yesterday = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    const result = toStoreNotification(makeBackend({ created_at: yesterday }));
    expect(result.time).toBe("어제");
  });

  it("formats a 3-day-old timestamp as '3일 전'", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    const result = toStoreNotification(makeBackend({ created_at: threeDaysAgo }));
    expect(result.time).toBe("3일 전");
  });
});

describe("fetchNotifications", () => {
  beforeEach(() => mockApiRequest.mockClear());

  it("calls GET /api/v1/notifications/ with auth:true", async () => {
    mockApiRequest.mockResolvedValueOnce({
      results: [makeBackend()],
      count: 1,
      next: null,
      previous: null,
    });
    await fetchNotifications();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/notifications/", { auth: true });
  });

  it("returns mapped notifications from paginated response", async () => {
    mockApiRequest.mockResolvedValueOnce({
      results: [makeBackend()],
      count: 1,
      next: null,
      previous: null,
    });
    const result = await fetchNotifications();
    expect(result).toHaveLength(1);
    expect(result[0].read).toBe(false);
    expect(result[0].notifiableType).toBe("resumes.resume");
    expect(result[0].notifiableId).toBe("abc-123");
  });

  it("handles plain array response (non-paginated)", async () => {
    mockApiRequest.mockResolvedValueOnce([makeBackend({ id: 2 }), makeBackend({ id: 3 })]);
    const result = await fetchNotifications();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(3);
  });

  it("returns empty array when results is empty", async () => {
    mockApiRequest.mockResolvedValueOnce({ results: [], count: 0, next: null, previous: null });
    const result = await fetchNotifications();
    expect(result).toEqual([]);
  });
});

describe("markNotificationRead", () => {
  beforeEach(() => mockApiRequest.mockClear());

  it("calls PATCH /api/v1/notifications/{id}/read/ with auth:true", async () => {
    mockApiRequest.mockResolvedValueOnce(makeBackend({ is_read: true }));
    await markNotificationRead(42);
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/notifications/42/read/", {
      method: "PATCH",
      auth: true,
    });
  });

  it("returns the mapped notification with read:true", async () => {
    mockApiRequest.mockResolvedValueOnce(makeBackend({ is_read: true }));
    const result = await markNotificationRead(1);
    expect(result.read).toBe(true);
    expect(result.id).toBe(1);
  });
});

describe("markAllNotificationsRead", () => {
  beforeEach(() => mockApiRequest.mockClear());

  it("calls PATCH /api/v1/notifications/mark-all-read/ with auth:true", async () => {
    mockApiRequest.mockResolvedValueOnce({ updated: 5 });
    await markAllNotificationsRead();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/notifications/mark-all-read/", {
      method: "PATCH",
      auth: true,
    });
  });

  it("returns the updated count from the API", async () => {
    mockApiRequest.mockResolvedValueOnce({ updated: 3 });
    const result = await markAllNotificationsRead();
    expect(result).toEqual({ updated: 3 });
  });
});

describe("deleteNotification", () => {
  beforeEach(() => mockApiRequest.mockClear());

  it("calls DELETE /api/v1/notifications/{id}/ with auth:true", async () => {
    mockApiRequest.mockResolvedValueOnce(undefined);
    await deleteNotification(7);
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/notifications/7/", {
      method: "DELETE",
      auth: true,
    });
  });
});

describe("clearAllNotifications", () => {
  beforeEach(() => mockApiRequest.mockClear());

  it("calls DELETE /api/v1/notifications/clear/ with auth:true", async () => {
    mockApiRequest.mockResolvedValueOnce({ deleted: 10 });
    await clearAllNotifications();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/notifications/clear/", {
      method: "DELETE",
      auth: true,
    });
  });

  it("returns the deleted count from the API", async () => {
    mockApiRequest.mockResolvedValueOnce({ deleted: 4 });
    const result = await clearAllNotifications();
    expect(result).toEqual({ deleted: 4 });
  });
});
