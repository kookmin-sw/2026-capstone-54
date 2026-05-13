const mockGetTermsDocument = jest.fn();

jest.mock("@/features/auth/api/termsApi", () => ({
  getTermsDocumentApi: (...args: unknown[]) => mockGetTermsDocument(...args),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentItem } from "../ConsentItem";

const baseProps = {
  termsDocumentId: 1,
  title: "이용약관",
  termsType: "terms_of_service",
  version: 2,
  isRequired: true,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ConsentItem — 기본 렌더", () => {
  it("title + version 'v<n>' + 동의 완료/필요 라벨", () => {
    render(<ConsentItem {...baseProps} isAgreed />);
    expect(screen.getByText("이용약관")).toBeInTheDocument();
    expect(screen.getByText(/v2 · 동의 완료/)).toBeInTheDocument();
  });

  it("isAgreed=false → '동의 필요' 라벨", () => {
    render(<ConsentItem {...baseProps} isAgreed={false} />);
    expect(screen.getByText(/동의 필요/)).toBeInTheDocument();
  });

  it("isRequired=true 일반 약관 → '(필수)' 라벨", () => {
    render(<ConsentItem {...baseProps} isRequired />);
    expect(screen.getByText("(필수)")).toBeInTheDocument();
  });

  it("isRequired=false 일반 약관 → '(선택)' 라벨", () => {
    render(<ConsentItem {...baseProps} isRequired={false} />);
    expect(screen.getByText("(선택)")).toBeInTheDocument();
  });
});

describe("ConsentItem — ai_training_data 분기", () => {
  it("ai_training_data + Pro → '(Pro에서 선택적 동의)' + 토글 활성화", () => {
    render(
      <ConsentItem
        {...baseProps}
        termsType="ai_training_data"
        isRequired={false}
        isProPlan
      />,
    );
    expect(screen.getByText("(Pro에서 선택적 동의)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이용약관" })).not.toBeDisabled();
  });

  it("ai_training_data + Pro 아님 → '(Pro 요금제 사용시, 선택적 동의 가능)' + 토글 disabled", () => {
    render(
      <ConsentItem
        {...baseProps}
        termsType="ai_training_data"
        isRequired={false}
        isProPlan={false}
      />,
    );
    expect(screen.getByText("(Pro 요금제 사용시, 선택적 동의 가능)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이용약관" })).toBeDisabled();
  });
});

describe("ConsentItem — onToggle", () => {
  it("marketing 토글 클릭 → onToggle(id, !isAgreed) 호출", async () => {
    const onToggle = jest.fn();
    render(
      <ConsentItem
        {...baseProps}
        termsDocumentId={9}
        termsType="marketing"
        isAgreed={false}
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "이용약관" }));
    expect(onToggle).toHaveBeenCalledWith(9, true);
  });

  it("일반 약관 (toggle 미표시) → 버튼 미렌더", () => {
    render(<ConsentItem {...baseProps} />);
    expect(screen.queryByRole("button", { name: "이용약관" })).not.toBeInTheDocument();
  });

  it("ai_training_data + Pro 아님 → 클릭해도 onToggle 미호출", async () => {
    const onToggle = jest.fn();
    render(
      <ConsentItem
        {...baseProps}
        termsType="ai_training_data"
        isProPlan={false}
        onToggle={onToggle}
      />,
    );

    const btn = screen.getByRole("button", { name: "이용약관" });
    await userEvent.click(btn);
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe("ConsentItem — 약관 모달", () => {
  it("title 클릭 → getTermsDocumentApi 호출 + 로딩 표시", async () => {
    mockGetTermsDocument.mockImplementation(() => new Promise(() => {}));
    render(<ConsentItem {...baseProps} />);

    await userEvent.click(screen.getByText("이용약관"));
    expect(mockGetTermsDocument).toHaveBeenCalledWith(1);
    expect(screen.getByText(/약관을 불러오는 중/)).toBeInTheDocument();
  });

  it("content 로드 성공 → HTML 렌더 (dangerouslySetInnerHTML)", async () => {
    mockGetTermsDocument.mockResolvedValue({ content: "<p>약관 내용</p>" });
    render(<ConsentItem {...baseProps} />);

    await userEvent.click(screen.getByText("이용약관"));
    await waitFor(() => {
      expect(screen.getByText("약관 내용")).toBeInTheDocument();
    });
  });

  it("content=null (못 불러옴) → 에러 안내", async () => {
    mockGetTermsDocument.mockResolvedValue(null);
    render(<ConsentItem {...baseProps} />);

    await userEvent.click(screen.getByText("이용약관"));
    await waitFor(() => {
      expect(screen.getByText(/약관 내용을 불러올 수 없/)).toBeInTheDocument();
    });
  });
});
