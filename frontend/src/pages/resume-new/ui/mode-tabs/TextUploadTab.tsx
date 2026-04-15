/** 이력서 텍스트 입력 탭 — 폼 + 템플릿 picker 합성.
 *
 * 실제 상태/로직은 아래 모듈들에 분리되어 있다:
 * - text-upload/useResumeTextForm   : title/content/제출
 * - text-upload/useTemplatePicker   : picker 상태, 검색 debounce, fetch, 덮어쓰기 분기
 * - text-upload/TemplatePickerModal : 모달 UI (검색/목록/confirm)
 */

import { FileText, LayoutTemplate } from "lucide-react";
import { Alert, Button, Input, Textarea } from "@/shared/ui";
import { TemplatePickerModal } from "./text-upload/TemplatePickerModal";
import { useResumeTextForm } from "./text-upload/useResumeTextForm";
import { useTemplatePicker } from "./text-upload/useTemplatePicker";

export function TextUploadTab() {
  const form = useResumeTextForm();
  const picker = useTemplatePicker({
    currentContent: form.content,
    onApply: form.applyTemplateContent,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void form.submit();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-[#6B7280] leading-[1.5]">
            직군별 이력서 텍스트 템플릿을 불러와 시작점으로 사용할 수 있어요.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={picker.openPicker}>
            <LayoutTemplate size={13} /> 템플릿 둘러보기
          </Button>
        </div>

        <Input
          label="제목"
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          placeholder="예: 2026 백엔드 개발자 이력서"
        />

        <Textarea
          label="이력서 본문"
          value={form.content}
          onChange={(e) => form.setContent(e.target.value)}
          rows={14}
          placeholder="자유 형식 텍스트로 이력서 내용을 입력하세요. 분석 후 자동으로 정규화됩니다."
          className="font-mono leading-[1.6]"
        />

        {form.error && <Alert variant="error">{form.error}</Alert>}

        <Button type="submit" variant="primary" fullWidth loading={form.isSubmitting}>
          <FileText size={14} /> 텍스트 저장 후 분석 시작
        </Button>
      </form>

      <TemplatePickerModal picker={picker} />
    </>
  );
}
