import { render, screen, fireEvent } from "@testing-library/react";
import { ResumeDetailPage } from "../ResumeDetailPage";
import type { ResumeDetail } from "@/features/resume";

jest.mock("@/shared/api/client", () => ({
  apiRequest: jest.fn(),
  BASE_URL: "http://localhost:8000",
  getAccessToken: jest.fn(() => "test-token"),
}));

jest.mock("@/features/resume/api/resumeApi", () => ({
  resumeApi: {
    retrieve: jest.fn(),
    remove: jest.fn(),
    finalize: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  useParams: () => ({ uuid: "test-uuid-1234" }),
  useNavigate: () => jest.fn(),
}));

import { resumeApi } from "@/features/resume/api/resumeApi";

const fakeResume: ResumeDetail = {
  uuid: "test-uuid-1234",
  type: "text",
  sourceMode: "text",
  title: "백엔드 개발자 이력서",
  isParsed: true,
  isDirty: false,
  lastFinalizedAt: null,
  analysisStatus: "completed",
  analysisStep: "done",
  analyzedAt: "2024-03-10T10:00:00Z",
  createdAt: "2024-03-01T09:00:00Z",
  updatedAt: "2024-03-10T10:00:00Z",
  resumeJobCategory: { uuid: "jc-1", name: "IT/개발", emoji: "💻" },
  content: "안녕하세요. 저는 5년 경력의 백엔드 개발자입니다.",
  originalFilename: null,
  fileSizeBytes: null,
  mimeType: null,
  fileTextContent: null,
  fileUrl: null,
  parsedData: {
    basicInfo: { name: "홍길동", email: "hong@example.com", phone: null, location: null },
    summary: "백엔드 개발 전문가입니다.",
    skills: { technical: ["Python", "Django"], soft: [], tools: ["Docker"], languages: [] },
    experiences: [],
    educations: [],
    certifications: [],
    awards: [],
    projects: [],
    languagesSpoken: [],
    totalExperienceYears: 5,
    totalExperienceMonths: 6,
    industryDomains: [],
    keywords: [],
    jobCategory: "IT/개발",
  },
};

describe("ResumeDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (resumeApi.retrieve as jest.Mock).mockResolvedValue(fakeResume);
  });

  it("이력서 제목이 표시된다", async () => {
    render(<ResumeDetailPage />);
    expect(await screen.findByText("백엔드 개발자 이력서")).toBeInTheDocument();
  });

  it("parsedData 요약이 SummarySection 에 표시된다", async () => {
    render(<ResumeDetailPage />);
    expect(await screen.findByText("백엔드 개발 전문가입니다.")).toBeInTheDocument();
  });

  it("CareerMetaSection 에 총 경력 연·월이 표시된다", async () => {
    render(<ResumeDetailPage />);
    expect(await screen.findByText("5년 6개월")).toBeInTheDocument();
  });

  it("RawSourceDrawer 를 열면 텍스트 원본이 표시된다", async () => {
    render(<ResumeDetailPage />);
    const trigger = await screen.findByText(/원본 보기/);
    fireEvent.click(trigger);
    expect(
      await screen.findByText("안녕하세요. 저는 5년 경력의 백엔드 개발자입니다."),
    ).toBeInTheDocument();
  });
});
