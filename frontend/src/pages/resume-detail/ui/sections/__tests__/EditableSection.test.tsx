import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableSection } from "../EditableSection";

const readNode = <span data-testid="rv">read-content</span>;
const editNode = <span data-testid="ev">edit-content</span>;

describe("EditableSection", () => {
  it("isEditing=false → readView 표시 + 편집 버튼 노출", () => {
    render(
      <EditableSection
        title="요약"
        isEditing={false}
        onEdit={() => {}}
        onCancel={() => {}}
        readView={readNode}
        editView={editNode}
      />,
    );

    expect(screen.getByTestId("rv")).toBeInTheDocument();
    expect(screen.queryByTestId("ev")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /편집/ })).toBeInTheDocument();
  });

  it("isEditing=true → editView 표시 + 저장/취소 버튼 노출", () => {
    render(
      <EditableSection
        title="요약"
        isEditing={true}
        onEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
        readView={readNode}
        editView={editNode}
      />,
    );

    expect(screen.getByTestId("ev")).toBeInTheDocument();
    expect(screen.queryByTestId("rv")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /저장/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /취소/ })).toBeInTheDocument();
  });

  it("onSave 미지정 + 편집 모드 → 저장 버튼 미노출", () => {
    render(
      <EditableSection
        title="요약"
        isEditing={true}
        onEdit={() => {}}
        onCancel={() => {}}
        readView={readNode}
        editView={editNode}
      />,
    );

    expect(screen.queryByRole("button", { name: /저장/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /취소/ })).toBeInTheDocument();
  });

  it("isSaving=true → 저장 버튼 disabled", () => {
    render(
      <EditableSection
        title="요약"
        isEditing={true}
        isSaving={true}
        onEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
        readView={readNode}
        editView={editNode}
      />,
    );

    expect(screen.getByRole("button", { name: /저장/ })).toBeDisabled();
  });

  it("hideEditButton=true → 읽기 모드에서도 편집 버튼 미노출", () => {
    render(
      <EditableSection
        title="요약"
        isEditing={false}
        hideEditButton={true}
        onEdit={() => {}}
        onCancel={() => {}}
        readView={readNode}
        editView={editNode}
      />,
    );

    expect(screen.queryByRole("button", { name: /편집/ })).not.toBeInTheDocument();
  });

  it("편집 버튼 클릭 → onEdit 호출", async () => {
    const onEdit = jest.fn();
    render(
      <EditableSection
        title="요약"
        isEditing={false}
        onEdit={onEdit}
        onCancel={() => {}}
        readView={readNode}
        editView={editNode}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("저장 버튼 클릭 → onSave 호출", async () => {
    const onSave = jest.fn();
    render(
      <EditableSection
        title="요약"
        isEditing={true}
        onEdit={() => {}}
        onCancel={() => {}}
        onSave={onSave}
        readView={readNode}
        editView={editNode}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("취소 버튼 클릭 → onCancel 호출", async () => {
    const onCancel = jest.fn();
    render(
      <EditableSection
        title="요약"
        isEditing={true}
        onEdit={() => {}}
        onCancel={onCancel}
        readView={readNode}
        editView={editNode}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("title prop 이 h2 헤더로 렌더", () => {
    render(
      <EditableSection
        title="기본 정보"
        isEditing={false}
        onEdit={() => {}}
        onCancel={() => {}}
        readView={readNode}
        editView={editNode}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "기본 정보" })).toBeInTheDocument();
  });
});
