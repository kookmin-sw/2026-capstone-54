import { render, screen } from "@testing-library/react";
import { ParsedDataView } from "../ParsedDataView";
import type { ParsedData } from "../../api/types";

const emptyParsed: ParsedData = {
  basicInfo: {},
  summary: "",
  skills: { technical: [], soft: [], tools: [], languages: [] },
  experiences: [],
  educations: [],
  certifications: [],
  awards: [],
  projects: [],
  languagesSpoken: [],
  totalExperienceYears: null,
  totalExperienceMonths: null,
  industryDomains: [],
  keywords: [],
  jobCategory: null,
};

describe("ParsedDataView", () => {
  it("data가 null이면 안내 메시지를 표시한다", () => {
    render(<ParsedDataView data={null} />);
    expect(screen.getByText(/분석 결과가 아직 없어요/)).toBeInTheDocument();
  });

  it("summary가 있으면 요약 섹션을 렌더한다", () => {
    render(<ParsedDataView data={{ ...emptyParsed, summary: "백엔드 개발자입니다." }} />);
    expect(screen.getByText("백엔드 개발자입니다.")).toBeInTheDocument();
  });

  it("스킬 그룹을 flat으로 모아 배지로 렌더한다", () => {
    render(
      <ParsedDataView
        data={{
          ...emptyParsed,
          skills: { technical: ["Python", "Django"], tools: ["Docker"], soft: [], languages: [] },
        }}
      />,
    );
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Django")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
  });

  it("총 경력(연·월) 과 직군이 메타카드로 표시된다", () => {
    render(
      <ParsedDataView
        data={{
          ...emptyParsed,
          totalExperienceYears: 5,
          totalExperienceMonths: 6,
          jobCategory: "IT/개발",
        }}
      />,
    );
    expect(screen.getByText("5년 6개월")).toBeInTheDocument();
    expect(screen.getByText("IT/개발")).toBeInTheDocument();
  });

  it("경력(experiences)과 프로젝트 섹션을 렌더한다", () => {
    render(
      <ParsedDataView
        data={{
          ...emptyParsed,
          experiences: [
            { company: "ACME", role: "Backend", period: "2022-2024", responsibilities: [], highlights: ["고성능 API"] },
          ],
          projects: [
            { name: "Nova", role: "Lead", period: "2023", description: "플랫폼 리팩터", techStack: ["Go"] },
          ],
        }}
      />,
    );
    expect(screen.getByText("ACME")).toBeInTheDocument();
    expect(screen.getByText(/고성능 API/)).toBeInTheDocument();
    expect(screen.getByText("Nova")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });
});
