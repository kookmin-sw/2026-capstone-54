import { act } from "@testing-library/react";

const mockGetMeApi = jest.fn();
const mockGetAccessToken = jest.fn(() => null as string | null);
const mockRefreshAccessToken = jest.fn().mockResolvedValue(false);
const mockGetAvatar = jest.fn().mockResolvedValue(null);

jest.mock("../../api/authApi", () => ({
  signUpApi: jest.fn(),
  loginApi: jest.fn(),
  signOutApi: jest.fn(),
  verifyEmailApi: jest.fn(),
  resendVerifyEmailApi: jest.fn(),
  getMeApi: (...args: unknown[]) => mockGetMeApi(...args),
}));

jest.mock("@/shared/api/client", () => ({
  getAccessToken: () => mockGetAccessToken(),
  refreshAccessToken: () => mockRefreshAccessToken(),
}));

jest.mock("@/shared/api/profileApi", () => ({
  profileApi: {
    getAvatar: () => mockGetAvatar(),
  },
}));

import { useAuthStore } from "../store";

const FAKE_USER = {
  id: 1,
  email: "test@example.com",
  name: "테스트",
  isEmailConfirmed: true,
  isProfileCompleted: true,
};

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function resetStore() {
  act(() => {
    useAuthStore.setState({
      user: null,
      authReady: false,
      isLoading: false,
      isVerifying: false,
      isResending: false,
      error: null,
      pendingEmail: null,
    });
  });
}

describe("useAuthStore — initAuth", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    mockGetAccessToken.mockReturnValue(null);
    mockRefreshAccessToken.mockResolvedValue(false);
    mockGetMeApi.mockResolvedValue(null);
    mockGetAvatar.mockResolvedValue(null);
  });

  it("access token 없음 + refresh 실패 → authReady=true, user=null", async () => {
    mockGetAccessToken.mockReturnValue(null);
    mockRefreshAccessToken.mockResolvedValue(false);

    await act(async () => useAuthStore.getState().initAuth());

    expect(mockRefreshAccessToken).toHaveBeenCalled();
    expect(mockGetMeApi).not.toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.authReady).toBe(true);
    expect(state.user).toBeNull();
  });

  it("access token 없음 + refresh 성공이지만 여전히 token 없음 → authReady=true (방어 로직)", async () => {
    let callCount = 0;
    mockGetAccessToken.mockImplementation(() => {
      callCount++;
      return null;
    });
    mockRefreshAccessToken.mockResolvedValue(true);

    await act(async () => useAuthStore.getState().initAuth());

    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(mockGetMeApi).not.toHaveBeenCalled();
    expect(useAuthStore.getState().authReady).toBe(true);
  });

  it("초기에 access token 있음 → refresh 호출 안 함, getMe 직접 호출", async () => {
    mockGetAccessToken.mockReturnValue("existing-token");
    mockGetMeApi.mockResolvedValue(FAKE_USER);

    await act(async () => useAuthStore.getState().initAuth());

    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    expect(mockGetMeApi).toHaveBeenCalledWith({ noRetry: true });
    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
    expect(useAuthStore.getState().authReady).toBe(true);
  });

  it("refresh 성공 + getMe 성공 → user 저장 + authReady=true", async () => {
    let callCount = 0;
    mockGetAccessToken.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? null : "refreshed-token";
    });
    mockRefreshAccessToken.mockResolvedValue(true);
    mockGetMeApi.mockResolvedValue(FAKE_USER);

    await act(async () => useAuthStore.getState().initAuth());

    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
    expect(useAuthStore.getState().authReady).toBe(true);
  });

  it("getMe 가 null 반환하면 user=null + authReady=true", async () => {
    mockGetAccessToken.mockReturnValue("token");
    mockGetMeApi.mockResolvedValue(null);

    await act(async () => useAuthStore.getState().initAuth());

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().authReady).toBe(true);
  });

  it("getMe 성공 시 fetchAndSetAvatar 부수 효과 — avatarUrl 있으면 user.avatarUrl 업데이트", async () => {
    mockGetAccessToken.mockReturnValue("token");
    mockGetMeApi.mockResolvedValue(FAKE_USER);
    mockGetAvatar.mockResolvedValue({ avatarUrl: "https://cdn.mefit.kr/avatar.png" });

    await act(async () => useAuthStore.getState().initAuth());
    await flushMicrotasks();

    expect(mockGetAvatar).toHaveBeenCalled();
    const user = useAuthStore.getState().user as typeof FAKE_USER & { avatarUrl?: string };
    expect(user.avatarUrl).toBe("https://cdn.mefit.kr/avatar.png");
  });

  it("avatarUrl 없는 응답은 user 변경 없음", async () => {
    mockGetAccessToken.mockReturnValue("token");
    mockGetMeApi.mockResolvedValue(FAKE_USER);
    mockGetAvatar.mockResolvedValue(null);

    await act(async () => useAuthStore.getState().initAuth());
    await flushMicrotasks();

    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
  });

  it("getAvatar API 에러는 silent ignore (user/authReady 영향 없음)", async () => {
    mockGetAccessToken.mockReturnValue("token");
    mockGetMeApi.mockResolvedValue(FAKE_USER);
    mockGetAvatar.mockRejectedValue(new Error("network"));

    await act(async () => useAuthStore.getState().initAuth());
    await flushMicrotasks();

    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
    expect(useAuthStore.getState().authReady).toBe(true);
  });

  it("user=null 인 상태에서 avatar 응답 도착해도 user 미생성", async () => {
    mockGetAccessToken.mockReturnValue("token");
    mockGetMeApi.mockResolvedValue(null);
    mockGetAvatar.mockResolvedValue({ avatarUrl: "x" });

    await act(async () => useAuthStore.getState().initAuth());
    await flushMicrotasks();

    expect(useAuthStore.getState().user).toBeNull();
  });
});
