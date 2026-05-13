import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RawSourceDrawer } from "../RawSourceDrawer";
import type { ResumeDetail } from "@/features/resume";

function makeResume(overrides: Partial<ResumeDetail>): ResumeDetail {
  return {
    uuid: "r-1",
    type: "text",
    title: "이력서",
    isActive: true,
    isParsed: false,
    analysisStatus: "completed",
    analysisStep: "",
    analyzedAt: null,
    createdAt: "",
    updatedAt: "",
    content: null,
    fileUrl: null,
    fileTextContent: null,
    originalFilename: null,
    parsedData: null,
    isDirty: false,
    ...overrides,
  } as ResumeDetail;
}

describe("RawSourceDrawer", () => {
  it("resume.type='structured' → null 반환 (drawer 미렌더)", () => {
    const { container } = render(
      <RawSourceDrawer resume={makeResume({ type: "structured" })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("type='text' → '원본 보기 (텍스트)' 헤더 + 닫힌 상태", () => {
    render(<RawSourceDrawer resume={makeResume({ type: "text", content: "내용" })} />);
    expect(screen.getByText(/원본 보기/)).toBeInTheDocument();
    expect(screen.getByText(/텍스트/)).toBeInTheDocument();
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });

  it("type='file' → '원본 보기 (파일)' 헤더", () => {
    render(<RawSourceDrawer resume={makeResume({ type: "file", originalFilename: "x.pdf" })} />);
    expect(screen.getByText(/파일/)).toBeInTheDocument();
  });

  it("헤더 클릭 → drawer 열림 + 본문 표시", async () => {
    render(<RawSourceDrawer resume={makeResume({ type: "text", content: "텍스트 본문" })} />);

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("텍스트 본문")).toBeInTheDocument();
  });

  it("text + content=null → '(원본이 없습니다)' fallback", async () => {
    render(<RawSourceDrawer resume={makeResume({ type: "text", content: null })} />);

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/원본이 없습니다/)).toBeInTheDocument();
  });

  it("file + originalFilename + fileUrl → 파일명 + 다운로드 링크", async () => {
    render(
      <RawSourceDrawer
        resume={makeResume({
          type: "file",
          originalFilename: "resume.pdf",
          fileUrl: "https://x.com/r.pdf",
        })}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /원본 보기/ }));
    expect(screen.getByText(/resume.pdf/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /원본 다운로드/ });
    expect(link).toHaveAttribute("href", "https://x.com/r.pdf");
  });

  it("file + fileTextContent → pre 영역에 텍스트 표시", async () => {
    render(
      <RawSourceDrawer
        resume={makeResume({ type: "file", fileTextContent: "추출된 텍스트", originalFilename: "x.pdf" })}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /원본 보기/ }));
    expect(screen.getByText("추출된 텍스트")).toBeInTheDocument();
  });

  it("file + originalFilename=null → '-' fallback", async () => {
    render(<RawSourceDrawer resume={makeResume({ type: "file", originalFilename: null })} />);

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/파일명/)).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("토글: 두 번 클릭 → 다시 닫힘", async () => {
    render(<RawSourceDrawer resume={makeResume({ type: "text", content: "본문" })} />);

    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    expect(screen.getByText("본문")).toBeInTheDocument();

    await userEvent.click(btn);
    expect(screen.queryByText("본문")).not.toBeInTheDocument();
  });
});
