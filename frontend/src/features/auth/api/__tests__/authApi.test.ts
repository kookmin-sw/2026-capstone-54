const mockApiRequest = jest.fn();
const mockSetTokens = jest.fn();
const mockClearTokens = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  setTokens: (...args: unknown[]) => mockSetTokens(...args),
  clearTokens: () => mockClearTokens(),
}));

import {
  signUpApi,
  loginApi,
  signOutApi,
  verifyEmailApi,
  resendVerifyEmailApi,
  getMeApi,
  changePasswordApi,
  requestPasswordResetApi,
  confirmPasswordResetApi,
  unregisterApi,
} from "../authApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("signUpApi", () => {
  it("성공 → setTokens(access) + success=true + isEmailConfirmed", async () => {
    mockApiRequest.mockResolvedValue({ access: "tok-1", isEmailConfirmed: false });

    const result = await signUpApi({
      name: "홍길동",
      email: "h@x.com",
      password: "Pwd1234!",
      termsDocumentIds: [1, 2],
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/sign-up/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "홍길동",
          email: "h@x.com",
          password1: "Pwd1234!",
          password2: "Pwd1234!",
          terms_document_ids: [1, 2],
        }),
      }),
    );
    expect(mockSetTokens).toHaveBeenCalledWith("tok-1", "");
    expect(result.success).toBe(true);
    expect(result.isEmailConfirmed).toBe(false);
  });

  it("실패 (fieldErrors) → 첫 번째 필드 에러 메시지 추출", async () => {
    mockApiRequest.mockRejectedValue({
      fieldErrors: { email: ["이미 사용중인 이메일입니다."] },
    });

    const result = await signUpApi({
      name: "x",
      email: "x@x.com",
      password: "p",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("이미 사용중인 이메일입니다.");
    expect(mockSetTokens).not.toHaveBeenCalled();
  });

  it("실패 (message 만) → message 사용", async () => {
    mockApiRequest.mockRejectedValue({ message: "서버 오류" });
    const result = await signUpApi({ name: "x", email: "x", password: "x" });
    expect(result.message).toBe("서버 오류");
  });

  it("termsDocumentIds 미지정 → 빈 배열로 전송", async () => {
    mockApiRequest.mockResolvedValue({ access: "t" });
    await signUpApi({ name: "x", email: "x@x.com", password: "p" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body.terms_document_ids).toEqual([]);
  });
});

describe("loginApi", () => {
  it("성공 → setTokens + success=true + isEmailConfirmed (기본 true)", async () => {
    mockApiRequest.mockResolvedValue({ access: "tok-9" });

    const result = await loginApi({ email: "x@x.com", password: "p" });

    expect(mockSetTokens).toHaveBeenCalledWith("tok-9", "");
    expect(result.success).toBe(true);
    expect(result.isEmailConfirmed).toBe(true);
  });

  it("실패 → 에러 메시지 fallback (기본: '이메일 또는 비밀번호...')", async () => {
    mockApiRequest.mockRejectedValue({ status: 401 });
    const result = await loginApi({ email: "x", password: "p" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("이메일 또는 비밀번호");
  });
});

describe("signOutApi", () => {
  it("성공 → POST sign-out + clearTokens", async () => {
    mockApiRequest.mockResolvedValue(undefined);

    await signOutApi();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/sign-out/",
      expect.objectContaining({ method: "POST", auth: true, noRetry: true }),
    );
    expect(mockClearTokens).toHaveBeenCalledTimes(1);
  });

  it("API throw 해도 finally 에서 clearTokens 호출 (외부 전파)", async () => {
    mockApiRequest.mockRejectedValue(new Error("network"));

    await expect(signOutApi()).rejects.toThrow("network");
    expect(mockClearTokens).toHaveBeenCalledTimes(1);
  });
});

describe("verifyEmailApi / resendVerifyEmailApi", () => {
  it("verifyEmail 성공 → success=true", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await verifyEmailApi("123456");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/verify-email/",
      expect.objectContaining({ body: JSON.stringify({ code: "123456" }) }),
    );
    expect(result.success).toBe(true);
  });

  it("verifyEmail 실패 → fieldErrors 우선 메시지", async () => {
    mockApiRequest.mockRejectedValue({ fieldErrors: { code: ["코드 만료"] } });
    const result = await verifyEmailApi("000");
    expect(result.success).toBe(false);
    expect(result.message).toBe("코드 만료");
  });

  it("resendVerify 성공 → success=true", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await resendVerifyEmailApi();
    expect(result.success).toBe(true);
  });

  it("resendVerify 실패 → message fallback", async () => {
    mockApiRequest.mockRejectedValue({ message: "rate limited" });
    const result = await resendVerifyEmailApi();
    expect(result.message).toBe("rate limited");
  });
});

describe("getMeApi", () => {
  it("성공 → UserMe 반환", async () => {
    const user = { name: "x", email: "x@x.com", isEmailConfirmed: true, isProfileCompleted: false };
    mockApiRequest.mockResolvedValue(user);
    const result = await getMeApi();
    expect(result).toEqual(user);
  });

  it("실패 → null 반환 (안전 fallback)", async () => {
    mockApiRequest.mockRejectedValue(new Error("401"));
    const result = await getMeApi();
    expect(result).toBeNull();
  });

  it("noRetry 옵션 전달", async () => {
    mockApiRequest.mockResolvedValue({});
    await getMeApi({ noRetry: true });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/",
      expect.objectContaining({ auth: true, noRetry: true }),
    );
  });
});

describe("changePasswordApi", () => {
  it("성공 → success=true", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await changePasswordApi({ currentPassword: "old", newPassword: "newPwd1!" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({
      current_password: "old",
      new_password1: "newPwd1!",
      new_password2: "newPwd1!",
    });
    expect(result.success).toBe(true);
  });

  it("실패 → parseApiError 적용", async () => {
    mockApiRequest.mockRejectedValue({ message: "기존 비밀번호 불일치" });
    const result = await changePasswordApi({ currentPassword: "x", newPassword: "y" });
    expect(result.message).toBe("기존 비밀번호 불일치");
  });
});

describe("passwordReset / unregister", () => {
  it("requestPasswordReset 성공 → success=true", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await requestPasswordResetApi("x@x.com");
    expect(result.success).toBe(true);
  });

  it("confirmPasswordReset 성공 → token 전송", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await confirmPasswordResetApi({ token: "tk", newPassword: "newPwd1!" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ token: "tk", new_password: "newPwd1!" });
    expect(result.success).toBe(true);
  });

  it("unregister 성공 → clearTokens 호출 + success=true", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await unregisterApi();
    expect(mockClearTokens).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it("unregister 실패 → clearTokens 미호출", async () => {
    mockApiRequest.mockRejectedValue({ message: "권한 없음" });
    const result = await unregisterApi();
    expect(mockClearTokens).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toBe("권한 없음");
  });
});
