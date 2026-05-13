const mockRetrieve = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock("@/features/user-job-description", () => ({
  userJobDescriptionApi: {
    retrieve: (...args: unknown[]) => mockRetrieve(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

import { useJdDetailStore } from "../detailStore";

function makeRaw(overrides?: Record<string, unknown>) {
  return {
    uuid: "u-1",
    title: "Backend Engineer",
    applicationStatus: "planned",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    jobDescription: {
      company: "Acme",
      title: "Backend Engineer",
      platform: "remoteok",
      location: "Seoul",
      experience: "3-5y",
      workType: "full-time",
      url: "https://x.com/jd/1",
      duties: "API 설계\n서비스 운영",
      requirements: "Java\nSpring\n5년 이상",
      preferred: "Kubernetes · GraphQL",
      collectionStatus: "done",
    },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useJdDetailStore.getState().reset();
});

describe("useJdDetailStore — fetchJd / toDetail 매핑", () => {
  it("성공 → jd 객체 매핑 + requirements/preferences 분리", async () => {
    mockRetrieve.mockResolvedValue(makeRaw());
    await useJdDetailStore.getState().fetchJd("u-1");

    const s = useJdDetailStore.getState();
    expect(s.isLoading).toBe(false);
    expect(s.jd?.company).toBe("Acme");
    expect(s.jd?.location).toBe("Seoul");
    expect(s.jd?.experience).toBe("3-5y");
    expect(s.jd?.requirements).toHaveLength(3);
    expect(s.jd?.requirements[0]).toEqual({ level: "required", text: "Java" });
    expect(s.jd?.preferences).toEqual(["Kubernetes", "GraphQL"]);
    expect(s.jd?.analyzed).toBe(true);
  });

  it("collectionStatus !== 'done' → analyzed=false", async () => {
    mockRetrieve.mockResolvedValue(makeRaw({ jobDescription: { ...makeRaw().jobDescription, collectionStatus: "in_progress" } }));
    await useJdDetailStore.getState().fetchJd("u-1");
    expect(useJdDetailStore.getState().jd?.analyzed).toBe(false);
  });

  it("title 빈 문자열 → jd.title fallback 사용", async () => {
    mockRetrieve.mockResolvedValue(makeRaw({ title: "" }));
    await useJdDetailStore.getState().fetchJd("u-1");
    expect(useJdDetailStore.getState().jd?.title).toBe("Backend Engineer");
  });

  it("fetchJd 실패 → error 설정 + jd=null 유지", async () => {
    mockRetrieve.mockRejectedValue(new Error("not found"));
    await useJdDetailStore.getState().fetchJd("missing");

    const s = useJdDetailStore.getState();
    expect(s.error).toBe("not found");
    expect(s.jd).toBeNull();
  });
});

describe("useJdDetailStore — silentRefreshJd / updateStatus / deleteJd", () => {
  beforeEach(async () => {
    mockRetrieve.mockResolvedValue(makeRaw());
    await useJdDetailStore.getState().fetchJd("u-1");
    mockRetrieve.mockClear();
  });

  it("silentRefreshJd: 실패해도 error overwrite 안 함", async () => {
    useJdDetailStore.setState({ error: "기존 에러" });
    mockRetrieve.mockRejectedValue(new Error("silent fail"));
    await useJdDetailStore.getState().silentRefreshJd("u-1");
    expect(useJdDetailStore.getState().error).toBe("기존 에러");
  });

  it("silentRefreshJd 성공 → jd 업데이트", async () => {
    mockRetrieve.mockResolvedValue(makeRaw({ jobDescription: { ...makeRaw().jobDescription, company: "Updated" } }));
    await useJdDetailStore.getState().silentRefreshJd("u-1");
    expect(useJdDetailStore.getState().jd?.company).toBe("Updated");
  });

  it("updateStatus 성공 → jd.status 변경 + true 반환", async () => {
    mockUpdate.mockResolvedValue(undefined);
    const ok = await useJdDetailStore.getState().updateStatus("applied");
    expect(ok).toBe(true);
    expect(useJdDetailStore.getState().jd?.status).toBe("applied");
  });

  it("updateStatus 실패 → error 설정 + false", async () => {
    mockUpdate.mockRejectedValue(new Error("update fail"));
    const ok = await useJdDetailStore.getState().updateStatus("saved");
    expect(ok).toBe(false);
    expect(useJdDetailStore.getState().error).toBe("update fail");
  });

  it("updateStatus: jd=null 일 때 → false (가드)", async () => {
    useJdDetailStore.setState({ jd: null });
    const ok = await useJdDetailStore.getState().updateStatus("applied");
    expect(ok).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("deleteJd 성공 → true 반환", async () => {
    mockRemove.mockResolvedValue(undefined);
    const ok = await useJdDetailStore.getState().deleteJd();
    expect(ok).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith("u-1");
  });

  it("deleteJd 실패 → error 설정 + false", async () => {
    mockRemove.mockRejectedValue(new Error("delete fail"));
    const ok = await useJdDetailStore.getState().deleteJd();
    expect(ok).toBe(false);
    expect(useJdDetailStore.getState().error).toBe("delete fail");
  });

  it("clearError / reset 동작", () => {
    useJdDetailStore.setState({ error: "x" });
    useJdDetailStore.getState().clearError();
    expect(useJdDetailStore.getState().error).toBeNull();

    useJdDetailStore.getState().reset();
    expect(useJdDetailStore.getState().jd).toBeNull();
  });
});
