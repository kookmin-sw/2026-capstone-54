const mockCreate = jest.fn();

jest.mock("@/features/user-job-description", () => ({
  userJobDescriptionApi: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

import { useJdAddStore } from "../store";

beforeEach(() => {
  jest.clearAllMocks();
  useJdAddStore.getState().reset();
  localStorage.clear();
});

describe("useJdAddStore — setUrl URL validation", () => {
  it("빈 문자열 → urlValidState='idle' + analysis null", () => {
    useJdAddStore.getState().setUrl("");
    const s = useJdAddStore.getState();
    expect(s.urlValidState).toBe("idle");
    expect(s.urlAnalysis).toBeNull();
  });

  it("http/https 가 아닌 URL → urlValidState='error'", () => {
    useJdAddStore.getState().setUrl("ftp://example.com");
    expect(useJdAddStore.getState().urlValidState).toBe("error");
  });

  it("정상 URL → urlValidState='ok' + analysis 채워짐 (company/title/domain)", () => {
    useJdAddStore.getState().setUrl("https://example.com/jd/123");
    const s = useJdAddStore.getState();
    expect(s.urlValidState).toBe("ok");
    expect(s.urlAnalysis?.domain).toBe("example.com");
  });

  it("setUrl 시 error 자동 클리어", () => {
    useJdAddStore.setState({ error: "이전 에러" });
    useJdAddStore.getState().setUrl("https://x.com");
    expect(useJdAddStore.getState().error).toBeNull();
  });
});

describe("useJdAddStore — submit", () => {
  it("성공 → uuid 반환 + isSubmitting false", async () => {
    mockCreate.mockResolvedValue({ uuid: "new-1" });
    useJdAddStore.getState().setUrl("https://example.com/j");
    useJdAddStore.getState().setCustomTitle("커스텀");
    useJdAddStore.getState().setStatus("applied");

    const uuid = await useJdAddStore.getState().submit();

    expect(uuid).toBe("new-1");
    expect(mockCreate).toHaveBeenCalledWith({
      url: "https://example.com/j",
      title: "커스텀",
      applicationStatus: "applied",
    });
    expect(useJdAddStore.getState().isSubmitting).toBe(false);
  });

  it("URL 비어있음 → error 설정 + null 반환", async () => {
    const uuid = await useJdAddStore.getState().submit();
    expect(uuid).toBeNull();
    expect(useJdAddStore.getState().error).toContain("URL을 입력");
  });

  it("invalid URL → error 설정 + API 미호출", async () => {
    useJdAddStore.setState({ url: "ftp://x" });
    const uuid = await useJdAddStore.getState().submit();
    expect(uuid).toBeNull();
    expect(useJdAddStore.getState().error).toContain("http 또는 https");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("API throw → error 설정 + null 반환", async () => {
    mockCreate.mockRejectedValue(new Error("server fail"));
    useJdAddStore.getState().setUrl("https://x.com");

    const uuid = await useJdAddStore.getState().submit();
    expect(uuid).toBeNull();
    expect(useJdAddStore.getState().error).toBe("server fail");
  });

  it("customTitle 빈 문자열 → undefined 로 전송", async () => {
    mockCreate.mockResolvedValue({ uuid: "x" });
    useJdAddStore.getState().setUrl("https://x.com");
    await useJdAddStore.getState().submit();

    expect(mockCreate.mock.calls[0][0]).toMatchObject({ title: undefined });
  });
});

describe("useJdAddStore — draft 관리", () => {
  it("saveDraft → localStorage 에 jd_draft 저장 + isSaving false 복귀", async () => {
    useJdAddStore.getState().setUrl("https://x.com");
    useJdAddStore.getState().setCustomTitle("초안");
    useJdAddStore.getState().setStatus("saved");

    const ok = await useJdAddStore.getState().saveDraft();

    expect(ok).toBe(true);
    expect(useJdAddStore.getState().isSaving).toBe(false);
    const raw = localStorage.getItem("jd_draft");
    expect(JSON.parse(raw!)).toEqual({
      url: "https://x.com",
      customTitle: "초안",
      status: "saved",
    });
  });

  it("loadDraft → localStorage 에 저장된 값 복원 + setUrl 트리거로 urlValidState 갱신", () => {
    localStorage.setItem(
      "jd_draft",
      JSON.stringify({ url: "https://saved.com", customTitle: "복원", status: "applied" }),
    );

    const ok = useJdAddStore.getState().loadDraft();
    const s = useJdAddStore.getState();
    expect(ok).toBe(true);
    expect(s.url).toBe("https://saved.com");
    expect(s.customTitle).toBe("복원");
    expect(s.status).toBe("applied");
    expect(s.urlValidState).toBe("ok");
  });

  it("loadDraft 저장 안 됨 → false", () => {
    expect(useJdAddStore.getState().loadDraft()).toBe(false);
  });

  it("clearDraft → localStorage 비움 + state INITIAL 로 리셋", () => {
    localStorage.setItem("jd_draft", JSON.stringify({ url: "x", customTitle: "x", status: "saved" }));
    useJdAddStore.getState().setUrl("https://x.com");
    useJdAddStore.getState().clearDraft();

    expect(localStorage.getItem("jd_draft")).toBeNull();
    expect(useJdAddStore.getState().url).toBe("");
    expect(useJdAddStore.getState().status).toBe("planned");
  });

  it("clearError → error 만 null 로", () => {
    useJdAddStore.setState({ error: "x" });
    useJdAddStore.getState().clearError();
    expect(useJdAddStore.getState().error).toBeNull();
  });
});
