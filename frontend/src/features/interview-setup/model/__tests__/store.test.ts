import { act } from "@testing-library/react";

jest.mock("../../api/setupApi", () => ({
  fetchSetupJdListApi: jest.fn(),
  fetchSetupJdByUuidApi: jest.fn(),
}));

jest.mock("../../api/interviewSetupApi", () => ({
  interviewSetupApi: {
    fetchResumes: jest.fn(),
    createSession: jest.fn(),
  },
}));

jest.mock("@/shared/api/client", () => ({
  isApiError: (e: unknown): e is { message: string } =>
    typeof e === "object" && e !== null && "message" in e,
}));

jest.mock("../../lib/buildSummary", () => ({
  buildSummary: jest.fn(() => ({
    company: "TestCo",
    role: "Backend",
    stage: "신입",
    interviewModeLabel: "꼬리질문",
    practiceModeLabel: "연습",
    difficultyLabel: "보통",
  })),
}));

import { fetchSetupJdListApi, fetchSetupJdByUuidApi } from "../../api/setupApi";
import { interviewSetupApi } from "../../api/interviewSetupApi";
import { useInterviewSetupStore } from "../store";

const mockFetchList = fetchSetupJdListApi as jest.Mock;
const mockFetchByUuid = fetchSetupJdByUuidApi as jest.Mock;
const mockFetchResumes = interviewSetupApi.fetchResumes as jest.Mock;
const mockCreateSession = interviewSetupApi.createSession as jest.Mock;

const JD_A = { uuid: "jd-a", title: "A 회사", company: "A", disabled: false };
const JD_B = { uuid: "jd-b", title: "B 회사", company: "B", disabled: false };
const JD_DISABLED = { uuid: "jd-disabled", title: "수집중", company: "C", disabled: true };

const RESUME_PARSED = { uuid: "r-1", isParsed: true, analysisStatus: "completed" };
const RESUME_PENDING = { uuid: "r-2", isParsed: false, analysisStatus: "pending" };

function resetStore() {
  act(() => {
    useInterviewSetupStore.setState({
      jdList: [],
      jdListLoading: false,
      preferredJdNotice: null,
      selectedJdId: null,
      interviewMode: "tail",
      practiceMode: "practice",
      interviewDifficultyLevel: "normal",
      pendingResumeUuid: null,
      pendingUserJobDescriptionUuid: null,
      resumes: [],
      selectedResumeUuid: null,
      resumesLoading: false,
      resumesError: null,
      creatingSession: false,
      createError: null,
      createdSessionUuid: null,
    });
  });
}

describe("useInterviewSetupStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("모든 필드가 기본값으로 초기화 (tail/practice/normal)", () => {
    const state = useInterviewSetupStore.getState();
    expect(state.jdList).toEqual([]);
    expect(state.selectedJdId).toBeNull();
    expect(state.interviewMode).toBe("tail");
    expect(state.practiceMode).toBe("practice");
    expect(state.interviewDifficultyLevel).toBe("normal");
    expect(state.resumes).toEqual([]);
    expect(state.selectedResumeUuid).toBeNull();
    expect(state.creatingSession).toBe(false);
    expect(state.createdSessionUuid).toBeNull();
  });
});

describe("useInterviewSetupStore — 동기 setter", () => {
  beforeEach(resetStore);

  it("selectJd 가 selectedJdId 를 설정 + null 도 허용", () => {
    act(() => useInterviewSetupStore.getState().selectJd("jd-1"));
    expect(useInterviewSetupStore.getState().selectedJdId).toBe("jd-1");

    act(() => useInterviewSetupStore.getState().selectJd(null));
    expect(useInterviewSetupStore.getState().selectedJdId).toBeNull();
  });

  it("setInterviewMode (tail / full)", () => {
    act(() => useInterviewSetupStore.getState().setInterviewMode("full"));
    expect(useInterviewSetupStore.getState().interviewMode).toBe("full");
  });

  it("setPracticeMode (practice / real)", () => {
    act(() => useInterviewSetupStore.getState().setPracticeMode("real"));
    expect(useInterviewSetupStore.getState().practiceMode).toBe("real");
  });

  it("setInterviewDifficultyLevel (friendly / normal / pressure)", () => {
    act(() => useInterviewSetupStore.getState().setInterviewDifficultyLevel("pressure"));
    expect(useInterviewSetupStore.getState().interviewDifficultyLevel).toBe("pressure");
  });

  it("setPendingUuids 가 두 UUID 동시 설정", () => {
    act(() => useInterviewSetupStore.getState().setPendingUuids("r-uuid", "jd-uuid"));
    const state = useInterviewSetupStore.getState();
    expect(state.pendingResumeUuid).toBe("r-uuid");
    expect(state.pendingUserJobDescriptionUuid).toBe("jd-uuid");
  });

  it("selectResume 가 selectedResumeUuid 를 설정", () => {
    act(() => useInterviewSetupStore.getState().selectResume("r-99"));
    expect(useInterviewSetupStore.getState().selectedResumeUuid).toBe("r-99");
  });
});

describe("useInterviewSetupStore — getInterviewSessionType", () => {
  beforeEach(resetStore);

  it("interviewMode='tail' → 'followup' 반환", () => {
    act(() => useInterviewSetupStore.getState().setInterviewMode("tail"));
    expect(useInterviewSetupStore.getState().getInterviewSessionType()).toBe("followup");
  });

  it("interviewMode='full' → 'full_process' 반환", () => {
    act(() => useInterviewSetupStore.getState().setInterviewMode("full"));
    expect(useInterviewSetupStore.getState().getInterviewSessionType()).toBe("full_process");
  });
});

describe("useInterviewSetupStore — loadJdList", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("preferred 없이 호출 시 첫 enabled JD 자동 선택", async () => {
    mockFetchList.mockResolvedValue([JD_A, JD_B]);
    await act(async () => useInterviewSetupStore.getState().loadJdList());

    const state = useInterviewSetupStore.getState();
    expect(state.jdList).toEqual([JD_A, JD_B]);
    expect(state.selectedJdId).toBe("jd-a");
    expect(state.jdListLoading).toBe(false);
    expect(state.preferredJdNotice).toBeNull();
  });

  it("preferred JD 가 list 에 있고 enabled 면 그것 선택", async () => {
    mockFetchList.mockResolvedValue([JD_A, JD_B]);
    await act(async () => useInterviewSetupStore.getState().loadJdList("jd-b"));

    expect(useInterviewSetupStore.getState().selectedJdId).toBe("jd-b");
  });

  it("preferred JD 가 list 에 없으면 단건 조회로 보강", async () => {
    mockFetchList.mockResolvedValue([JD_A]);
    mockFetchByUuid.mockResolvedValue(JD_B);

    await act(async () => useInterviewSetupStore.getState().loadJdList("jd-b"));

    expect(mockFetchByUuid).toHaveBeenCalledWith("jd-b");
    const state = useInterviewSetupStore.getState();
    expect(state.jdList[0]).toEqual(JD_B);
    expect(state.selectedJdId).toBe("jd-b");
  });

  it("preferred JD 가 disabled 면 notice 설정 + 첫 enabled 자동 선택", async () => {
    mockFetchList.mockResolvedValue([JD_DISABLED, JD_A]);

    await act(async () => useInterviewSetupStore.getState().loadJdList("jd-disabled"));

    const state = useInterviewSetupStore.getState();
    expect(state.selectedJdId).toBe("jd-a");
    expect(state.preferredJdNotice).toMatch(/수집이 완료되지 않아/);
  });

  it("preferred JD 가 단건 조회도 실패하면 notice 설정", async () => {
    mockFetchList.mockResolvedValue([JD_A]);
    mockFetchByUuid.mockResolvedValue(null);

    await act(async () => useInterviewSetupStore.getState().loadJdList("not-exist"));

    const state = useInterviewSetupStore.getState();
    expect(state.preferredJdNotice).toMatch(/찾을 수 없어/);
    expect(state.selectedJdId).toBe("jd-a");
  });

  it("기존 selectedJdId 가 여전히 valid 면 유지", async () => {
    act(() => useInterviewSetupStore.setState({ selectedJdId: "jd-b" }));
    mockFetchList.mockResolvedValue([JD_A, JD_B]);

    await act(async () => useInterviewSetupStore.getState().loadJdList());

    expect(useInterviewSetupStore.getState().selectedJdId).toBe("jd-b");
  });

  it("API 실패 시 jdListLoading=false + notice 설정", async () => {
    mockFetchList.mockRejectedValue(new Error("network"));

    await act(async () => useInterviewSetupStore.getState().loadJdList());

    const state = useInterviewSetupStore.getState();
    expect(state.jdListLoading).toBe(false);
    expect(state.preferredJdNotice).toMatch(/불러오지 못했습니다/);
  });
});

describe("useInterviewSetupStore — fetchResumes", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 resumes 저장 + 첫 parsed/completed 이력서 자동 선택", async () => {
    mockFetchResumes.mockResolvedValue([RESUME_PENDING, RESUME_PARSED]);

    await act(async () => useInterviewSetupStore.getState().fetchResumes());

    const state = useInterviewSetupStore.getState();
    expect(state.resumes).toHaveLength(2);
    expect(state.selectedResumeUuid).toBe("r-1");
    expect(state.resumesLoading).toBe(false);
  });

  it("이미 selectedResumeUuid 있으면 유지 (auto-select 안 함)", async () => {
    act(() => useInterviewSetupStore.setState({ selectedResumeUuid: "existing-uuid" }));
    mockFetchResumes.mockResolvedValue([RESUME_PARSED]);

    await act(async () => useInterviewSetupStore.getState().fetchResumes());

    expect(useInterviewSetupStore.getState().selectedResumeUuid).toBe("existing-uuid");
  });

  it("API 에러 시 resumesError 설정", async () => {
    mockFetchResumes.mockRejectedValue({ message: "권한 없음" });

    await act(async () => useInterviewSetupStore.getState().fetchResumes());

    const state = useInterviewSetupStore.getState();
    expect(state.resumesError).toBe("권한 없음");
    expect(state.resumesLoading).toBe(false);
  });
});

describe("useInterviewSetupStore — createSession", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("이력서 미선택 시 createError 설정 + null 반환", async () => {
    let result: unknown;
    await act(async () => {
      result = await useInterviewSetupStore.getState().createSession();
    });
    expect(result).toBeNull();
    expect(useInterviewSetupStore.getState().createError).toMatch(/이력서를 선택/);
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("JD 미선택 시 createError 설정 + null 반환", async () => {
    act(() => useInterviewSetupStore.setState({ selectedResumeUuid: "r-1" }));

    let result: unknown;
    await act(async () => {
      result = await useInterviewSetupStore.getState().createSession();
    });
    expect(result).toBeNull();
    expect(useInterviewSetupStore.getState().createError).toMatch(/채용공고를 선택/);
  });

  it("성공 시 session 반환 + createdSessionUuid 설정 + pending UUID 동기화", async () => {
    act(() => useInterviewSetupStore.setState({
      selectedResumeUuid: "r-1",
      selectedJdId: "jd-1",
      interviewMode: "full",
      practiceMode: "real",
      interviewDifficultyLevel: "pressure",
    }));
    mockCreateSession.mockResolvedValue({ uuid: "session-uuid" });

    let result: { uuid: string } | null = null;
    await act(async () => {
      result = await useInterviewSetupStore.getState().createSession();
    });

    expect(result).not.toBeNull();
    expect(result!.uuid).toBe("session-uuid");
    expect(mockCreateSession).toHaveBeenCalledWith({
      resume_uuid: "r-1",
      user_job_description_uuid: "jd-1",
      interview_session_type: "full_process",
      interview_difficulty_level: "pressure",
      interview_practice_mode: "real",
    });

    const state = useInterviewSetupStore.getState();
    expect(state.createdSessionUuid).toBe("session-uuid");
    expect(state.pendingResumeUuid).toBe("r-1");
    expect(state.pendingUserJobDescriptionUuid).toBe("jd-1");
    expect(state.creatingSession).toBe(false);
  });

  it("interviewMode='tail' 일 때 session_type='followup' 로 전송", async () => {
    act(() => useInterviewSetupStore.setState({
      selectedResumeUuid: "r",
      selectedJdId: "j",
      interviewMode: "tail",
    }));
    mockCreateSession.mockResolvedValue({ uuid: "u" });

    await act(async () => useInterviewSetupStore.getState().createSession());

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ interview_session_type: "followup" })
    );
  });

  it("API 에러 시 createError 설정 + null 반환", async () => {
    act(() => useInterviewSetupStore.setState({
      selectedResumeUuid: "r",
      selectedJdId: "j",
    }));
    mockCreateSession.mockRejectedValue({ message: "티켓 부족" });

    let result: unknown;
    await act(async () => {
      result = await useInterviewSetupStore.getState().createSession();
    });

    expect(result).toBeNull();
    expect(useInterviewSetupStore.getState().createError).toBe("티켓 부족");
  });
});

describe("useInterviewSetupStore — resetSetup", () => {
  beforeEach(resetStore);

  it("creatingSession/createError/createdSessionUuid 만 초기화 (다른 필드는 유지)", () => {
    act(() => useInterviewSetupStore.setState({
      selectedJdId: "jd-keep",
      selectedResumeUuid: "r-keep",
      interviewMode: "full",
      creatingSession: true,
      createError: "err",
      createdSessionUuid: "old",
    }));

    act(() => useInterviewSetupStore.getState().resetSetup());

    const state = useInterviewSetupStore.getState();
    expect(state.selectedJdId).toBe("jd-keep");
    expect(state.selectedResumeUuid).toBe("r-keep");
    expect(state.interviewMode).toBe("full");
    expect(state.creatingSession).toBe(false);
    expect(state.createError).toBeNull();
    expect(state.createdSessionUuid).toBeNull();
  });
});
