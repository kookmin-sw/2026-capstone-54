const mockApiRequest = jest.fn();
const mockProfileApi = {
  getMyProfile: jest.fn(),
  getAvatar: jest.fn(),
  uploadAvatar: jest.fn(),
  saveMyProfile: jest.fn(),
};
const mockGetMe = jest.fn();
const mockGetMyConsents = jest.fn();
const mockGetTermsDocuments = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

jest.mock("@/shared/api/profileApi", () => ({
  profileApi: mockProfileApi,
}));

jest.mock("@/features/auth/api/authApi", () => ({
  getMeApi: (...args: unknown[]) => mockGetMe(...args),
}));

jest.mock("@/features/auth/api/termsApi", () => ({
  getMyConsentsApi: (...args: unknown[]) => mockGetMyConsents(...args),
  getTermsDocumentsApi: (...args: unknown[]) => mockGetTermsDocuments(...args),
}));

import {
  fetchSettingsApi,
  fetchEmailNotificationsApi,
  uploadAvatarApi,
  updateNameApi,
  updateProfileApi,
  changePasswordApi,
  updateNotificationsApi,
  updateConsentsApi,
  deleteInterviewDataApi,
  deleteAccountApi,
} from "../settingsApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchSettingsApi — 통합", () => {
  it("모든 API 성공 → profile/notifications/consents 매핑된 SettingsData 반환", async () => {
    mockGetMe.mockResolvedValue({ name: "홍길동", email: "h@x.com" });
    mockProfileApi.getMyProfile.mockResolvedValue({
      jobCategory: { id: 1, name: "IT/개발", emoji: "💻" },
      jobs: [{ id: 1, name: "Backend" }],
      careerStage: "junior",
    });
    mockGetMyConsents.mockResolvedValue([
      { id: 1, termsDocument: { id: 1, termsType: "tos", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: true, createdAt: "" },
      { id: 2, termsDocument: { id: 2, termsType: "privacy", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: false, createdAt: "" },
    ]);
    mockProfileApi.getAvatar.mockResolvedValue({ avatarUrl: "https://x.com/a.png" });
    mockApiRequest.mockResolvedValue({
      streakReminder: false, streakExpire: true, reportReady: true, serviceNotice: true, marketing: false,
    });
    mockGetTermsDocuments.mockResolvedValue([{ id: 1, termsType: "tos", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" }]);

    const result = await fetchSettingsApi();

    expect(result.success).toBe(true);
    expect(result.data?.profile.name).toBe("홍길동");
    expect(result.data?.profile.avatarInitial).toBe("홍");
    expect(result.data?.profile.avatarUrl).toBe("https://x.com/a.png");
    expect(result.data?.profile.jobCategoryId).toBe(1);
    expect(result.data?.profile.jobIds).toEqual([1]);
    expect(result.data?.profile.careerStage).toBe("junior");
    expect(result.data?.notifications.streakReminder).toBe(false);
    expect(result.data?.consents.consentsByType).toEqual({ tos: true, privacy: false });
  });

  it("getMeApi=null → name='', avatarInitial='?', email=''", async () => {
    mockGetMe.mockResolvedValue(null);
    mockProfileApi.getMyProfile.mockResolvedValue(null);
    mockGetMyConsents.mockResolvedValue([]);
    mockProfileApi.getAvatar.mockResolvedValue(null);
    mockApiRequest.mockRejectedValue(new Error("noti fail"));
    mockGetTermsDocuments.mockResolvedValue([]);

    const result = await fetchSettingsApi();

    expect(result.success).toBe(true);
    expect(result.data?.profile.name).toBe("");
    expect(result.data?.profile.avatarInitial).toBe("?");
    expect(result.data?.profile.jobIds).toEqual([]);
  });

  it("notifications API 실패 → FALLBACK_NOTIFICATIONS 사용 (모두 true)", async () => {
    mockGetMe.mockResolvedValue(null);
    mockProfileApi.getMyProfile.mockResolvedValue(null);
    mockGetMyConsents.mockResolvedValue([]);
    mockProfileApi.getAvatar.mockResolvedValue(null);
    mockApiRequest.mockRejectedValue(new Error("noti fail"));
    mockGetTermsDocuments.mockResolvedValue([]);

    const result = await fetchSettingsApi();

    expect(result.data?.notifications).toEqual({
      streakReminder: true,
      streakExpire: true,
      reportReady: true,
      serviceNotice: true,
      marketing: true,
    });
  });

  it("subscription 은 MOCK_SUBSCRIPTION 반환 (free / 1·3 / nextBillingDate=null)", async () => {
    mockGetMe.mockResolvedValue(null);
    mockProfileApi.getMyProfile.mockResolvedValue(null);
    mockGetMyConsents.mockResolvedValue([]);
    mockProfileApi.getAvatar.mockResolvedValue(null);
    mockApiRequest.mockResolvedValue({});
    mockGetTermsDocuments.mockResolvedValue([]);

    const result = await fetchSettingsApi();

    expect(result.data?.subscription).toEqual({
      plan: "free",
      resumeUsed: 1,
      resumeMax: 3,
      nextBillingDate: null,
    });
  });
});

describe("fetchEmailNotificationsApi", () => {
  it("성공 → data 반환", async () => {
    const noti = { streakReminder: false, streakExpire: false, reportReady: true, serviceNotice: true, marketing: false };
    mockApiRequest.mockResolvedValue(noti);

    const result = await fetchEmailNotificationsApi();
    expect(result.success).toBe(true);
    expect(result.data).toEqual(noti);
  });

  it("실패 → success=false + 한국어 메시지", async () => {
    mockApiRequest.mockRejectedValue(new Error());
    const result = await fetchEmailNotificationsApi();
    expect(result.success).toBe(false);
    expect(result.message).toContain("알림 설정");
  });
});

describe("uploadAvatarApi", () => {
  it("성공 → success=true + avatarUrl 매핑", async () => {
    mockProfileApi.uploadAvatar.mockResolvedValue({ avatarUrl: "https://x.com/new.png" });

    const result = await uploadAvatarApi(new File([], "a.png"));

    expect(result.success).toBe(true);
    expect(result.avatarUrl).toBe("https://x.com/new.png");
  });

  it("실패 → success=false + 메시지", async () => {
    mockProfileApi.uploadAvatar.mockRejectedValue(new Error("size"));
    const result = await uploadAvatarApi(new File([], "a.png"));
    expect(result.success).toBe(false);
    expect(result.message).toContain("실패");
  });
});

describe("updateNameApi", () => {
  it("성공 → form-urlencoded body + PATCH", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    await updateNameApi("새이름");

    const [, opts] = mockApiRequest.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }];
    expect(opts.method).toBe("PATCH");
    expect(opts.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(opts.body).toBe("name=%EC%83%88%EC%9D%B4%EB%A6%84");
  });

  it("실패 → message fallback", async () => {
    mockApiRequest.mockRejectedValue(new Error());
    const result = await updateNameApi("x");
    expect(result.success).toBe(false);
    expect(result.message).toContain("실패");
  });
});

describe("updateProfileApi", () => {
  it("성공 → updateName + saveMyProfile 둘 다 호출", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    mockProfileApi.saveMyProfile.mockResolvedValue(undefined);

    const result = await updateProfileApi({
      name: "홍",
      jobCategoryId: 1,
      jobIds: [1, 2],
      careerStage: "senior",
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(mockProfileApi.saveMyProfile).toHaveBeenCalledWith({
      jobCategoryId: 1,
      jobIds: [1, 2],
      careerStage: "senior",
    });
    expect(result.success).toBe(true);
  });

  it("updateName 실패 → 그 에러 메시지 반환 (saveMyProfile 결과 무시)", async () => {
    mockApiRequest.mockRejectedValue(new Error());
    mockProfileApi.saveMyProfile.mockResolvedValue(undefined);

    const result = await updateProfileApi({ name: "x", jobCategoryId: 1, jobIds: [] });

    expect(result.success).toBe(false);
    expect(result.message).toContain("이름 저장");
  });
});

describe("changePasswordApi (settings 버전)", () => {
  it("성공 → snake_case body 전송", async () => {
    mockApiRequest.mockResolvedValue(undefined);

    await changePasswordApi({ currentPassword: "old", newPassword: "new" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ current_password: "old", new_password: "new" });
  });

  it("실패 → success=false", async () => {
    mockApiRequest.mockRejectedValue(new Error());
    const result = await changePasswordApi({ currentPassword: "x", newPassword: "y" });
    expect(result.success).toBe(false);
  });
});

describe("updateNotificationsApi", () => {
  it("성공 → PUT + data 반환", async () => {
    const updated = { streakReminder: false, streakExpire: true, reportReady: true, serviceNotice: true, marketing: false };
    mockApiRequest.mockResolvedValue(updated);

    const result = await updateNotificationsApi({ streakReminder: false });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/email-notifications/",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });

  it("실패 (detail 필드) → detail 메시지 사용", async () => {
    mockApiRequest.mockRejectedValue({ detail: "권한 없음" });
    const result = await updateNotificationsApi({ marketing: true });
    expect(result.message).toBe("권한 없음");
  });

  it("실패 (message 필드만) → message 사용", async () => {
    mockApiRequest.mockRejectedValue({ message: "서버 오류" });
    const result = await updateNotificationsApi({ marketing: true });
    expect(result.message).toBe("서버 오류");
  });

  it("실패 (필드 둘 다 없음) → 기본 메시지", async () => {
    mockApiRequest.mockRejectedValue({});
    const result = await updateNotificationsApi({ marketing: true });
    expect(result.message).toContain("저장에 실패");
  });
});

describe("updateConsentsApi / deleteInterviewData / deleteAccount", () => {
  it("updateConsentsApi 성공 → PUT 호출 + snake_case body", async () => {
    mockApiRequest.mockResolvedValue(undefined);

    await updateConsentsApi({ aiDataAgreed: true });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ ai_data_agreed: true });
  });

  it("deleteInterviewDataApi 성공 → DELETE 호출", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await deleteInterviewDataApi();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/interview-data/",
      expect.objectContaining({ method: "DELETE", auth: true }),
    );
    expect(result.success).toBe(true);
  });

  it("deleteAccountApi 성공 → unregister DELETE", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const result = await deleteAccountApi();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/unregister/",
      expect.objectContaining({ method: "DELETE", auth: true }),
    );
    expect(result.success).toBe(true);
  });

  it("deleteAccountApi 실패 → success=false + 한국어 메시지", async () => {
    mockApiRequest.mockRejectedValue(new Error());
    const result = await deleteAccountApi();
    expect(result.success).toBe(false);
    expect(result.message).toContain("탈퇴 처리");
  });
});
