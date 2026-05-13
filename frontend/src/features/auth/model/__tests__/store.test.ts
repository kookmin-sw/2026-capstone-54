import { act } from "@testing-library/react";

jest.mock("../../api/authApi", () => ({
  signUpApi: jest.fn(),
  loginApi: jest.fn(),
  signOutApi: jest.fn(),
  verifyEmailApi: jest.fn(),
  resendVerifyEmailApi: jest.fn(),
  getMeApi: jest.fn(),
}));

jest.mock("@/shared/api/client", () => ({
  getAccessToken: jest.fn(() => null),
  refreshAccessToken: jest.fn().mockResolvedValue(false),
}));

jest.mock("@/shared/api/profileApi", () => ({
  profileApi: {
    getAvatar: jest.fn().mockResolvedValue(null),
  },
}));

import {
  signUpApi,
  loginApi,
  signOutApi,
  verifyEmailApi,
  resendVerifyEmailApi,
  getMeApi,
} from "../../api/authApi";
import { useAuthStore } from "../store";

const mockSignUp = signUpApi as jest.Mock;
const mockLogin = loginApi as jest.Mock;
const mockSignOut = signOutApi as jest.Mock;
const mockVerifyEmail = verifyEmailApi as jest.Mock;
const mockResendVerify = resendVerifyEmailApi as jest.Mock;
const mockGetMe = getMeApi as jest.Mock;

const FAKE_USER = {
  id: 1,
  email: "test@example.com",
  name: "테스트 사용자",
  isEmailConfirmed: true,
  isProfileCompleted: true,
};

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

describe("useAuthStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("user=null, authReady=false, 모든 loading flag=false, error/pendingEmail=null", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.authReady).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.isVerifying).toBe(false);
    expect(state.isResending).toBe(false);
    expect(state.error).toBeNull();
    expect(state.pendingEmail).toBeNull();
  });
});

describe("useAuthStore — setPendingEmail / clearError / setUser (sync setters)", () => {
  beforeEach(resetStore);

  it("setPendingEmail 이 email 을 저장", () => {
    act(() => useAuthStore.getState().setPendingEmail("user@example.com"));
    expect(useAuthStore.getState().pendingEmail).toBe("user@example.com");
  });

  it("clearError 가 error 를 null 로 만듦", () => {
    act(() => useAuthStore.setState({ error: "이전 에러" }));
    expect(useAuthStore.getState().error).toBe("이전 에러");

    act(() => useAuthStore.getState().clearError());
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("setUser 가 user 객체를 저장", () => {
    act(() => useAuthStore.getState().setUser(FAKE_USER));
    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
  });

  it("setUser(null) 로 로그아웃 시뮬레이션 가능", () => {
    act(() => useAuthStore.getState().setUser(FAKE_USER));
    act(() => useAuthStore.getState().setUser(null));
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe("useAuthStore — signUp", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 user 저장 + pendingEmail 설정 + isLoading=false + true 반환", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockGetMe.mockResolvedValue(FAKE_USER);

    let result: boolean | undefined;
    await act(async () => {
      result = await useAuthStore.getState().signUp({
        name: "테스터",
        email: "test@example.com",
        password: "Password1!",
      });
    });

    expect(result).toBe(true);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(FAKE_USER);
    expect(state.pendingEmail).toBe("test@example.com");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("실패 시 error 설정 + isLoading=false + false 반환", async () => {
    mockSignUp.mockResolvedValue({ success: false, message: "이메일 중복" });

    let result: boolean | undefined;
    await act(async () => {
      result = await useAuthStore.getState().signUp({
        name: "테스터",
        email: "dup@example.com",
        password: "P!",
      });
    });

    expect(result).toBe(false);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.error).toBe("이메일 중복");
    expect(state.isLoading).toBe(false);
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it("getMeApi 실패 시 error 설정 + false 반환", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockGetMe.mockResolvedValue(null);

    let result: boolean | undefined;
    await act(async () => {
      result = await useAuthStore.getState().signUp({
        name: "T",
        email: "t@e.com",
        password: "P",
      });
    });

    expect(result).toBe(false);
    expect(useAuthStore.getState().error).toBe("사용자 정보를 불러오는데 실패했습니다.");
  });
});

describe("useAuthStore — login", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 user 저장 + LoginResult 반환 (success/isEmailConfirmed/isProfileCompleted)", async () => {
    mockLogin.mockResolvedValue({ success: true, isEmailConfirmed: true });
    mockGetMe.mockResolvedValue(FAKE_USER);

    let result: { success: boolean; isEmailConfirmed?: boolean; isProfileCompleted?: boolean } | undefined;
    await act(async () => {
      result = await useAuthStore.getState().login("test@example.com", "Password1!");
    });

    expect(result?.success).toBe(true);
    expect(result?.isEmailConfirmed).toBe(true);
    expect(result?.isProfileCompleted).toBe(true);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(FAKE_USER);
    expect(state.pendingEmail).toBe("test@example.com");
  });

  it("실패 시 success=false + error 설정", async () => {
    mockLogin.mockResolvedValue({ success: false, message: "비밀번호 불일치" });

    let result: { success: boolean } | undefined;
    await act(async () => {
      result = await useAuthStore.getState().login("test@example.com", "wrong");
    });

    expect(result?.success).toBe(false);
    expect(useAuthStore.getState().error).toBe("비밀번호 불일치");
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it("getMe null 반환 시 res 값으로 fallback", async () => {
    mockLogin.mockResolvedValue({ success: true, isEmailConfirmed: false });
    mockGetMe.mockResolvedValue(null);

    let result: { success: boolean; isEmailConfirmed?: boolean; isProfileCompleted?: boolean } | undefined;
    await act(async () => {
      result = await useAuthStore.getState().login("u@e.com", "p");
    });

    expect(result?.success).toBe(true);
    expect(result?.isEmailConfirmed).toBe(false);
    expect(result?.isProfileCompleted).toBe(false);
  });
});

describe("useAuthStore — logout", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("logout 호출 시 signOutApi 호출 + user/pendingEmail 초기화 + authReady=true", async () => {
    mockSignOut.mockResolvedValue(undefined);
    act(() => useAuthStore.setState({ user: FAKE_USER, pendingEmail: "x@x.com" }));

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.pendingEmail).toBeNull();
    expect(state.authReady).toBe(true);
    expect(state.error).toBeNull();
  });
});

describe("useAuthStore — verifyCode", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 user 업데이트 + isVerifying=false + true 반환", async () => {
    mockVerifyEmail.mockResolvedValue({ success: true });
    mockGetMe.mockResolvedValue({ ...FAKE_USER, isEmailConfirmed: true });

    let result: boolean | undefined;
    await act(async () => {
      result = await useAuthStore.getState().verifyCode("A1B2C3");
    });

    expect(result).toBe(true);
    expect(useAuthStore.getState().user?.isEmailConfirmed).toBe(true);
    expect(useAuthStore.getState().isVerifying).toBe(false);
  });

  it("실패 시 error 설정 + false 반환", async () => {
    mockVerifyEmail.mockResolvedValue({ success: false, message: "코드 만료" });

    let result: boolean | undefined;
    await act(async () => {
      result = await useAuthStore.getState().verifyCode("XXXXXX");
    });

    expect(result).toBe(false);
    expect(useAuthStore.getState().error).toBe("코드 만료");
    expect(useAuthStore.getState().isVerifying).toBe(false);
  });
});

describe("useAuthStore — resendVerification", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 isResending=false + true 반환", async () => {
    mockResendVerify.mockResolvedValue({ success: true });

    let result: boolean | undefined;
    await act(async () => {
      result = await useAuthStore.getState().resendVerification();
    });

    expect(result).toBe(true);
    expect(useAuthStore.getState().isResending).toBe(false);
  });

  it("실패 시 error 설정 + false 반환", async () => {
    mockResendVerify.mockResolvedValue({ success: false, message: "rate limit" });

    let result: boolean | undefined;
    await act(async () => {
      result = await useAuthStore.getState().resendVerification();
    });

    expect(result).toBe(false);
    expect(useAuthStore.getState().error).toBe("rate limit");
  });
});

describe("useAuthStore — fetchMe", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("getMeApi 가 user 반환 시 store.user 업데이트", async () => {
    mockGetMe.mockResolvedValue(FAKE_USER);
    await act(async () => useAuthStore.getState().fetchMe());
    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
  });

  it("getMeApi 가 null 반환 시 user 미변경", async () => {
    act(() => useAuthStore.setState({ user: FAKE_USER }));
    mockGetMe.mockResolvedValue(null);
    await act(async () => useAuthStore.getState().fetchMe());
    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
  });
});
