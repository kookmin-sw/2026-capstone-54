const mockFetchSettings = jest.fn();
const mockUploadAvatar = jest.fn();
const mockUpdateProfile = jest.fn();
const mockUpdateNotifications = jest.fn();
const mockProfileApiGetJobs = jest.fn();
const mockPostConsents = jest.fn();

const mockSetUser = jest.fn();
const mockAuthGetState = jest.fn(() => ({
  user: { id: "u1", name: "홍", email: "h@x", initial: "홍", avatarUrl: null },
  setUser: mockSetUser,
}));

jest.mock("../../api/settingsApi", () => ({
  fetchSettingsApi: (...a: unknown[]) => mockFetchSettings(...a),
  uploadAvatarApi: (...a: unknown[]) => mockUploadAvatar(...a),
  updateProfileApi: (...a: unknown[]) => mockUpdateProfile(...a),
  changePasswordApi: jest.fn(),
  updateNotificationsApi: (...a: unknown[]) => mockUpdateNotifications(...a),
  deleteInterviewDataApi: jest.fn(),
  deleteAccountApi: jest.fn(),
}));

jest.mock("@/shared/api/profileApi", () => ({
  profileApi: {
    getJobCategories: jest.fn(),
    getJobsByCategory: (...a: unknown[]) => mockProfileApiGetJobs(...a),
  },
}));

jest.mock("@/features/auth", () => ({
  useAuthStore: { getState: () => mockAuthGetState() },
}));

jest.mock("@/features/auth/api/termsApi", () => ({
  postTermsConsentsApi: (...a: unknown[]) => mockPostConsents(...a),
}));

jest.mock("@/shared/lib/validatePassword", () => ({
  validatePassword: jest.fn(() => null),
}));

import { useSettingsStore } from "../store";
import type { SettingsData, SettingsNotifications } from "../../api/settingsApi";

function makeSettingsData(overrides?: Partial<SettingsData>): SettingsData {
  return {
    profile: {
      name: "홍길동",
      email: "h@x.com",
      avatarInitial: "홍",
      avatarUrl: null,
      jobCategoryId: 1,
      jobCategory: { id: 1, name: "IT/개발", emoji: "💻" },
      jobIds: [1],
      jobs: [{ id: 1, name: "Backend" }],
      careerStage: "junior",
    },
    notifications: {
      streakReminder: true,
      streakExpire: true,
      reportReady: true,
      serviceNotice: true,
      marketing: false,
    },
    subscription: { plan: "free", resumeUsed: 1, resumeMax: 3, nextBillingDate: null },
    consents: {
      myConsents: [
        { id: 1, termsDocument: { id: 1, termsType: "tos", version: 1, title: "이용약관", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: true, createdAt: "" },
        { id: 2, termsDocument: { id: 2, termsType: "privacy", version: 1, title: "개인정보", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: false, createdAt: "" },
      ],
      consentsByType: { tos: true, privacy: false },
      allTerms: [
        { id: 1, termsType: "tos", version: 1, title: "이용약관", isRequired: true, effectiveAt: null, createdAt: "" },
        { id: 2, termsType: "privacy", version: 1, title: "개인정보", isRequired: true, effectiveAt: null, createdAt: "" },
      ],
    },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({
    data: null,
    loading: false,
    saving: false,
    pendingNotificationRequests: 0,
    passwordSaving: false,
    error: null,
    saveMessage: null,
    passwordError: null,
    passwordSaveMessage: null,
    activePanel: "account",
    consentBadge: true,
    jobCategories: [],
    jobCategoriesLoading: false,
    availableJobs: [],
    availableJobsLoading: false,
    profileDraft: { name: "", jobCategoryId: null, jobIds: [], careerStage: "" },
    passwordDraft: { currentPassword: "", newPassword: "", confirmPassword: "" },
    aiDataDraft: null,
    consentDrafts: {},
  });
});

describe("fetchSettings", () => {
  it("성공 → data 설정 + profileDraft 매핑 + consentDrafts 채워짐", async () => {
    mockFetchSettings.mockResolvedValue({ success: true, data: makeSettingsData() });
    mockProfileApiGetJobs.mockResolvedValue({ results: [] });

    await useSettingsStore.getState().fetchSettings();

    const s = useSettingsStore.getState();
    expect(s.data?.profile.name).toBe("홍길동");
    expect(s.profileDraft.name).toBe("홍길동");
    expect(s.profileDraft.jobCategoryId).toBe(1);
    expect(s.consentDrafts).toEqual({ 1: true, 2: false });
  });

  it("성공 + profile.jobCategoryId 있음 → loadJobsByCategory 자동 호출", async () => {
    mockFetchSettings.mockResolvedValue({ success: true, data: makeSettingsData() });
    mockProfileApiGetJobs.mockResolvedValue({ results: [{ id: 1, name: "x" }] });

    await useSettingsStore.getState().fetchSettings();

    expect(mockProfileApiGetJobs).toHaveBeenCalledWith(1);
  });

  it("실패 → error 설정 + loading false", async () => {
    mockFetchSettings.mockResolvedValue({ success: false, error: "설정 fetch 실패" });
    await useSettingsStore.getState().fetchSettings();

    expect(useSettingsStore.getState().error).toBe("설정 fetch 실패");
    expect(useSettingsStore.getState().loading).toBe(false);
  });
});

describe("loadJobsByCategory", () => {
  it("성공 → availableJobs 설정", async () => {
    mockProfileApiGetJobs.mockResolvedValue({ results: [{ id: 1, name: "Backend" }] });
    await useSettingsStore.getState().loadJobsByCategory(1);
    expect(useSettingsStore.getState().availableJobs).toEqual([{ id: 1, name: "Backend" }]);
  });

  it("실패 → loading false 로 복귀", async () => {
    mockProfileApiGetJobs.mockRejectedValue(new Error("fail"));
    await useSettingsStore.getState().loadJobsByCategory(1);
    expect(useSettingsStore.getState().availableJobsLoading).toBe(false);
  });
});

describe("uploadAvatar", () => {
  it("성공 → data.profile.avatarUrl 업데이트 + authStore.setUser 동기화", async () => {
    useSettingsStore.setState({ data: makeSettingsData() });
    mockUploadAvatar.mockResolvedValue({ success: true, avatarUrl: "https://x/new.png", message: "변경됨" });

    await useSettingsStore.getState().uploadAvatar(new File([], "a.png"));

    expect(useSettingsStore.getState().data?.profile.avatarUrl).toBe("https://x/new.png");
    expect(useSettingsStore.getState().saveMessage).toBe("변경됨");
    expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: "https://x/new.png" }));
  });

  it("실패 → error 설정 + setUser 미호출", async () => {
    mockUploadAvatar.mockResolvedValue({ success: false, message: "용량 초과" });

    await useSettingsStore.getState().uploadAvatar(new File([], "a.png"));

    expect(useSettingsStore.getState().error).toBe("용량 초과");
    expect(mockSetUser).not.toHaveBeenCalled();
  });
});

describe("saveProfile", () => {
  it("jobCategoryId=null → error '직군 선택' + return", async () => {
    useSettingsStore.setState({
      profileDraft: { name: "x", jobCategoryId: null, jobIds: [], careerStage: "" },
    });

    await useSettingsStore.getState().saveProfile();

    expect(useSettingsStore.getState().error).toContain("직군");
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("성공 → authStore user.name 업데이트 + data 로컬 업데이트 + saveMessage", async () => {
    useSettingsStore.setState({
      data: makeSettingsData(),
      jobCategories: [{ id: 1, name: "IT/개발", emoji: "💻" }],
      availableJobs: [{ id: 1, name: "Backend" }, { id: 2, name: "Frontend" }],
      profileDraft: { name: "변경된이름", jobCategoryId: 1, jobIds: [1, 2], careerStage: "senior" },
    });
    mockUpdateProfile.mockResolvedValue({ success: true, message: "저장됨" });

    await useSettingsStore.getState().saveProfile();

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      name: "변경된이름",
      jobCategoryId: 1,
      jobIds: [1, 2],
      careerStage: "senior",
    });
    expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ name: "변경된이름" }));
    expect(useSettingsStore.getState().data?.profile.name).toBe("변경된이름");
    expect(useSettingsStore.getState().data?.profile.avatarInitial).toBe("변");
    expect(useSettingsStore.getState().data?.profile.jobs).toEqual([
      { id: 1, name: "Backend" },
      { id: 2, name: "Frontend" },
    ]);
  });

  it("실패 → error 설정", async () => {
    useSettingsStore.setState({
      profileDraft: { name: "x", jobCategoryId: 1, jobIds: [], careerStage: "" },
    });
    mockUpdateProfile.mockResolvedValue({ success: false, message: "서버 오류" });

    await useSettingsStore.getState().saveProfile();
    expect(useSettingsStore.getState().error).toBe("서버 오류");
  });
});

describe("resetProfileDraft", () => {
  it("data 있을 때 → profileDraft 를 data.profile 로 복원", () => {
    useSettingsStore.setState({
      data: makeSettingsData(),
      profileDraft: { name: "수정중", jobCategoryId: 99, jobIds: [99], careerStage: "x" },
    });

    useSettingsStore.getState().resetProfileDraft();

    const draft = useSettingsStore.getState().profileDraft;
    expect(draft.name).toBe("홍길동");
    expect(draft.jobCategoryId).toBe(1);
    expect(draft.jobIds).toEqual([1]);
  });

  it("data=null → no-op (draft 유지)", () => {
    useSettingsStore.setState({
      data: null,
      profileDraft: { name: "x", jobCategoryId: 5, jobIds: [], careerStage: "" },
    });
    useSettingsStore.getState().resetProfileDraft();
    expect(useSettingsStore.getState().profileDraft.name).toBe("x");
  });
});

describe("setPasswordDraft / resetPasswordDraft", () => {
  it("setPasswordDraft → 해당 필드만 갱신", () => {
    useSettingsStore.getState().setPasswordDraft("newPassword", "Pwd1!");
    expect(useSettingsStore.getState().passwordDraft.newPassword).toBe("Pwd1!");
    expect(useSettingsStore.getState().passwordDraft.currentPassword).toBe("");
  });

  it("resetPasswordDraft → 모든 필드 빈 문자열로 + 메시지 클리어", () => {
    useSettingsStore.setState({
      passwordDraft: { currentPassword: "a", newPassword: "b", confirmPassword: "c" },
      passwordError: "err",
      passwordSaveMessage: "msg",
    });

    useSettingsStore.getState().resetPasswordDraft();
    const s = useSettingsStore.getState();
    expect(s.passwordDraft).toEqual({ currentPassword: "", newPassword: "", confirmPassword: "" });
    expect(s.passwordError).toBeNull();
    expect(s.passwordSaveMessage).toBeNull();
  });
});

describe("toggleNotification — optimistic update + 동시 카운터", () => {
  beforeEach(() => {
    useSettingsStore.setState({ data: makeSettingsData() });
  });

  it("성공 → 즉시 optimistic 갱신 + 응답으로 정정 + counter 감소", async () => {
    mockUpdateNotifications.mockResolvedValue({
      success: true,
      data: { streakReminder: false, streakExpire: true, reportReady: true, serviceNotice: true, marketing: false } as SettingsNotifications,
      message: "저장됨",
    });

    await useSettingsStore.getState().toggleNotification("streakReminder");

    expect(useSettingsStore.getState().data?.notifications.streakReminder).toBe(false);
    expect(useSettingsStore.getState().saveMessage).toBe("저장됨");
    expect(useSettingsStore.getState().pendingNotificationRequests).toBe(0);
    expect(useSettingsStore.getState().saving).toBe(false);
  });

  it("실패 → optimistic 변경 rollback (previous value 복원) + error", async () => {
    mockUpdateNotifications.mockResolvedValue({ success: false, message: "실패" });

    await useSettingsStore.getState().toggleNotification("marketing");

    expect(useSettingsStore.getState().data?.notifications.marketing).toBe(false);
    expect(useSettingsStore.getState().error).toBe("실패");
  });

  it("data=null → no-op (가드)", async () => {
    useSettingsStore.setState({ data: null });
    await useSettingsStore.getState().toggleNotification("marketing");
    expect(mockUpdateNotifications).not.toHaveBeenCalled();
  });
});

describe("toggleConsent — optimistic + rollback", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      data: makeSettingsData(),
      consentDrafts: { 1: true, 2: false },
    });
  });

  it("성공 → API 응답으로 consents 정정 + saveMessage", async () => {
    const updated = [
      { id: 1, termsDocument: { id: 1, termsType: "tos", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: true, createdAt: "" },
      { id: 2, termsDocument: { id: 2, termsType: "privacy", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: true, createdAt: "" },
    ];
    mockPostConsents.mockResolvedValue(updated);

    await useSettingsStore.getState().toggleConsent(2, true);

    expect(useSettingsStore.getState().saveMessage).toContain("동의 설정이 저장");
    expect(useSettingsStore.getState().data?.consents.consentsByType.privacy).toBe(true);
  });

  it("실패 → previous data + previousDrafts 로 rollback", async () => {
    mockPostConsents.mockRejectedValue(new Error("server"));

    await useSettingsStore.getState().toggleConsent(2, true);

    expect(useSettingsStore.getState().error).toContain("저장에 실패");
    expect(useSettingsStore.getState().consentDrafts).toEqual({ 1: true, 2: false });
  });

  it("data=null → no-op", async () => {
    useSettingsStore.setState({ data: null });
    await useSettingsStore.getState().toggleConsent(1, true);
    expect(mockPostConsents).not.toHaveBeenCalled();
  });
});

describe("setConsentDrafts", () => {
  it("객체 직접 전달 → 그대로 설정", () => {
    useSettingsStore.getState().setConsentDrafts({ 1: true, 5: false });
    expect(useSettingsStore.getState().consentDrafts).toEqual({ 1: true, 5: false });
  });

  it("함수 전달 → 이전 값 기반 업데이트", () => {
    useSettingsStore.setState({ consentDrafts: { 1: true } });
    useSettingsStore.getState().setConsentDrafts((prev) => ({ ...prev, 2: false }));
    expect(useSettingsStore.getState().consentDrafts).toEqual({ 1: true, 2: false });
  });
});
