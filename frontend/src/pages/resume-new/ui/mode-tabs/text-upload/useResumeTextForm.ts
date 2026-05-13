/** 이력서 텍스트 입력 폼 상태 + 제출 로직. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resumeApi } from "@/features/resume";
import { isApiError } from "@/shared/api/client";

function parseApiError(e: unknown, fallback: string): string {
  if (isApiError(e)) {
    const fieldMsg = e.fieldErrors
      ? Object.values(e.fieldErrors).flat()[0]
      : undefined;
    return fieldMsg ?? e.message ?? fallback;
  }
  return e instanceof Error ? e.message : fallback;
}

export function useResumeTextForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await resumeApi.createText(title, content);
      navigate(`/resume/${created.uuid}`);
    } catch (e) {
      setError(parseApiError(e, "생성 실패"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 템플릿 선택 결과를 폼에 적용. title 이 비어있을 때만 템플릿 title 을 덮어쓴다. */
  const applyTemplateContent = (templateTitle: string, templateContent: string) => {
    setContent(templateContent);
    if (!title.trim()) setTitle(templateTitle);
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    isSubmitting,
    error,
    setError,
    submit,
    applyTemplateContent,
  };
}
