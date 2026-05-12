const mockFetchSettings = jest.fn();
const mockUploadAvatar = jest.fn();
const mockUpdateProfile = jest.fn();
const mockChangePassword = jest.fn();
const mockUpdateNotifications = jest.fn();
const mockDeleteInterviewData = jest.fn();
const mockDeleteAccount = jest.fn();
const mockProfileApiGetCategories = jest.fn();
const mockProfileApiGetJobs = jest.fn();
const mockPostConsents = jest.fn();
const mockValidatePassword = jest.fn();

const mockSetUser = jest.fn();
const mockAuthGetState = jest.fn(() => ({
  user: { id: "u1", name: "홍", email: "h@x", initial: "홍" },
  setUser: mockSetUser,
}));

jest.mock("../../api/settingsApi", () => ({
  fetchSettingsApi: (...a: unknown[]) => mockFetchSettings(...a),
  uploadAvatarApi: (...a: unknown[]) => mockUploadAvatar(...a),
  updateProfileApi: (...a: unknown[]) => mockUpdateProfile(...a),
  changePasswordApi: (...a: unknown[]) => mockChangePassword(...a),
  updateNotificationsApi: (...a: unknown[]) => mockUpdateNotifications(...a),
  deleteInterviewDataApi: (...a: unknown[]) => mockDeleteInterviewData(...a),
  deleteAccountApi: (...a: unknown[]) => mockDeleteAccount(...a),
}));

jest.mock("@/shared/api/profileApi", () => ({
  profileApi: {
    getJobCategories: (...a: unknown[]) => mockProfileApiGetCategories(...a),
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
  validatePassword: (pw: string) => mockValidatePassword(pw),
}));

import { useSettingsStore } from "../store";

beforeEach(() => {
  jest.clearAllMocks();
  mockValidatePassword.mockReturnValue(null);
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

describe("setActivePanel / clearMessage", () => {
  it("setActivePanel → activePanel 변경 + saveMessage/error 클리어", () => {
    useSettingsStore.setState({ saveMessage: "x", error: "y" });
    useSettingsStore.getState().setActivePanel("notifications");
    const s = useSettingsStore.getState();
    expect(s.activePanel).toBe("notifications");
    expect(s.saveMessage).toBeNull();
    expect(s.error).toBeNull();
  });

  it("setActivePanel='consent' → consentBadge=false", () => {
    useSettingsStore.getState().setActivePanel("consent");
    expect(useSettingsStore.getState().consentBadge).toBe(false);
  });

  it("clearMessage → saveMessage/error 모두 null", () => {
    useSettingsStore.setState({ saveMessage: "x", error: "y" });
    useSettingsStore.getState().clearMessage();
    const s = useSettingsStore.getState();
    expect(s.saveMessage).toBeNull();
    expect(s.error).toBeNull();
  });

  it("clearPasswordMessage → password 관련 null", () => {
    useSettingsStore.setState({ passwordError: "x", passwordSaveMessage: "y" });
    useSettingsStore.getState().clearPasswordMessage();
    const s = useSettingsStore.getState();
    expect(s.passwordError).toBeNull();
    expect(s.passwordSaveMessage).toBeNull();
  });
});

describe("loadJobCategories", () => {
  it("초기 → API 호출 + categories 설정", async () => {
    mockProfileApiGetCategories.mockResolvedValue({ results: [{ id: 1, name: "IT", emoji: "💻" }] });
    await useSettingsStore.getState().loadJobCategories();
    expect(useSettingsStore.getState().jobCategories).toHaveLength(1);
  });

  it("이미 있으면 fetch 안 함 (캐시)", async () => {
    useSettingsStore.setState({ jobCategories: [{ id: 1, name: "x", emoji: "x" }] });
    await useSettingsStore.getState().loadJobCategories();
    expect(mockProfileApiGetCategories).not.toHaveBeenCalled();
  });

  it("실패 → loading false 로 복귀", async () => {
    mockProfileApiGetCategories.mockRejectedValue(new Error("fail"));
    await useSettingsStore.getState().loadJobCategories();
    expect(useSettingsStore.getState().jobCategoriesLoading).toBe(false);
  });
});

describe("setProfileDraftField / toggleJobId", () => {
  it("name 필드 변경", () => {
    useSettingsStore.getState().setProfileDraftField("name", "변경");
    expect(useSettingsStore.getState().profileDraft.name).toBe("변경");
  });

  it("jobCategoryId 변경 → jobIds 초기화 + loadJobsByCategory 호출", async () => {
    useSettingsStore.setState({
      profileDraft: { name: "x", jobCategoryId: 1, jobIds: [1, 2], careerStage: "" },
    });
    mockProfileApiGetJobs.mockResolvedValue({ results: [{ id: 5, name: "X" }] });

    useSettingsStore.getState().setProfileDraftField("jobCategoryId", 2);
    expect(useSettingsStore.getState().profileDraft.jobIds).toEqual([]);
    expect(useSettingsStore.getState().profileDraft.jobCategoryId).toBe(2);
  });

  it("toggleJobId: 새 ID 추가 / 기존 ID 제거 / 3개 초과 무시", () => {
    useSettingsStore.getState().toggleJobId(1);
    expect(useSettingsStore.getState().profileDraft.jobIds).toEqual([1]);

    useSettingsStore.getState().toggleJobId(1);
    expect(useSettingsStore.getState().profileDraft.jobIds).toEqual([]);

    [1, 2, 3, 4].forEach((id) => useSettingsStore.getState().toggleJobId(id));
    expect(useSettingsStore.getState().profileDraft.jobIds).toEqual([1, 2, 3]);
  });
});

describe("savePassword validation", () => {
  it("newPassword validation 실패 → passwordError 설정 + return", async () => {
    mockValidatePassword.mockReturnValue("8자 이상이어야 합니다.");
    useSettingsStore.setState({
      passwordDraft: { currentPassword: "x", newPassword: "short", confirmPassword: "short" },
    });

    await useSettingsStore.getState().savePassword();
    expect(useSettingsStore.getState().passwordError).toBe("8자 이상이어야 합니다.");
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("새 비밀번호 != 확인 → 불일치 메시지", async () => {
    mockValidatePassword.mockReturnValue(null);
    useSettingsStore.setState({
      passwordDraft: { currentPassword: "x", newPassword: "Pwd1!", confirmPassword: "Diff1!" },
    });

    await useSettingsStore.getState().savePassword();
    expect(useSettingsStore.getState().passwordError).toContain("일치하지 않");
  });

  it("성공 → passwordDraft 비움 + saveMessage 설정", async () => {
    mockValidatePassword.mockReturnValue(null);
    mockChangePassword.mockResolvedValue({ success: true, message: "변경됨" });
    useSettingsStore.setState({
      passwordDraft: { currentPassword: "x", newPassword: "Pwd1!", confirmPassword: "Pwd1!" },
    });

    await useSettingsStore.getState().savePassword();
    const s = useSettingsStore.getState();
    expect(s.passwordSaveMessage).toBe("변경됨");
    expect(s.passwordDraft).toEqual({ currentPassword: "", newPassword: "", confirmPassword: "" });
  });

  it("API 실패 → passwordError 설정", async () => {
    mockValidatePassword.mockReturnValue(null);
    mockChangePassword.mockResolvedValue({ success: false, message: "기존 비밀번호 틀림" });
    useSettingsStore.setState({
      passwordDraft: { currentPassword: "x", newPassword: "Pwd1!", confirmPassword: "Pwd1!" },
    });

    await useSettingsStore.getState().savePassword();
    expect(useSettingsStore.getState().passwordError).toBe("기존 비밀번호 틀림");
  });
});

describe("deleteInterviewData / deleteAccount", () => {
  it("deleteInterviewData 성공 → saveMessage 설정", async () => {
    mockDeleteInterviewData.mockResolvedValue({ success: true, message: "삭제 완료" });
    await useSettingsStore.getState().deleteInterviewData();
    expect(useSettingsStore.getState().saveMessage).toBe("삭제 완료");
  });

  it("deleteAccount 실패 → error 설정", async () => {
    mockDeleteAccount.mockResolvedValue({ success: false, message: "권한 없음" });
    await useSettingsStore.getState().deleteAccount();
    expect(useSettingsStore.getState().error).toBe("권한 없음");
  });
});
