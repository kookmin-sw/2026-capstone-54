const mockList = jest.fn();
const mockRetrieve = jest.fn();

jest.mock("@/features/user-job-description", () => ({
  userJobDescriptionApi: {
    list: (...args: unknown[]) => mockList(...args),
    retrieve: (...args: unknown[]) => mockRetrieve(...args),
  },
}));

import { fetchSetupJdListApi, fetchSetupJdByUuidApi } from "../setupApi";

const baseJd = {
  platform: "remoteok",
  title: "Backend",
  company: "Acme",
  location: "Seoul",
  workType: "full-time",
  collectionStatus: "done",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchSetupJdListApi", () => {
  it("목록 매핑: done → '수집 완료' / green / disabled=false", async () => {
    mockList.mockResolvedValue([
      { uuid: "u1", jobDescription: { ...baseJd } },
    ]);

    const result = await fetchSetupJdListApi();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      uuid: "u1",
      company: "Acme",
      role: "Backend",
      stage: "Seoul",
      badgeLabel: "수집 완료",
      badgeType: "green",
      disabled: false,
    });
  });

  it("collectionStatus='in_progress' → '수집 중' / accent / disabled=true", async () => {
    mockList.mockResolvedValue([
      { uuid: "u2", jobDescription: { ...baseJd, collectionStatus: "in_progress" } },
    ]);

    const result = await fetchSetupJdListApi();
    expect(result[0].badgeLabel).toBe("수집 중");
    expect(result[0].badgeType).toBe("accent");
    expect(result[0].disabled).toBe(true);
  });

  it("collectionStatus='error' → '수집 실패' / accent / disabled=true", async () => {
    mockList.mockResolvedValue([
      { uuid: "u3", jobDescription: { ...baseJd, collectionStatus: "error" } },
    ]);

    const result = await fetchSetupJdListApi();
    expect(result[0].badgeLabel).toBe("수집 실패");
  });

  it("company / title 없음 → fallback ('수집 중' / '채용공고')", async () => {
    mockList.mockResolvedValue([
      { uuid: "u4", jobDescription: { ...baseJd, company: "", title: "" } },
    ]);

    const result = await fetchSetupJdListApi();
    expect(result[0].company).toBe("수집 중");
    expect(result[0].role).toBe("채용공고");
  });

  it("stage 우선순위: location → workType → platform", async () => {
    mockList.mockResolvedValue([
      { uuid: "u5", jobDescription: { ...baseJd, location: "", workType: "remote", platform: "x" } },
    ]);
    const r1 = await fetchSetupJdListApi();
    expect(r1[0].stage).toBe("remote");

    mockList.mockResolvedValue([
      { uuid: "u6", jobDescription: { ...baseJd, location: "", workType: "", platform: "indeed" } },
    ]);
    const r2 = await fetchSetupJdListApi();
    expect(r2[0].stage).toBe("indeed");
  });
});

describe("fetchSetupJdByUuidApi", () => {
  it("성공 → 매핑된 SetupJdItem 반환", async () => {
    mockRetrieve.mockResolvedValue({ uuid: "u-9", jobDescription: { ...baseJd } });

    const result = await fetchSetupJdByUuidApi("u-9");
    expect(result?.uuid).toBe("u-9");
    expect(result?.company).toBe("Acme");
  });

  it("실패 → null 반환", async () => {
    mockRetrieve.mockRejectedValue(new Error("not found"));
    const result = await fetchSetupJdByUuidApi("missing");
    expect(result).toBeNull();
  });
});
