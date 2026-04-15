/** 템플릿 picker 상태 — 목록 fetch, 검색 debounce, 직군 그룹핑, 선택/덮어쓰기 분기. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resumeTemplatesApi, type ResumeTemplateListItem } from "@/features/resume";

interface UseTemplatePickerOptions {
  /** 현재 에디터 본문. 비어있지 않으면 선택 시 덮어쓰기 confirm 을 거친다. */
  currentContent: string;
  /** 실제 본문 주입 콜백 (상세 API 로드 성공 시 호출). */
  onApply: (title: string, content: string) => void;
}

export function useTemplatePicker({ currentContent, onApply }: UseTemplatePickerOptions) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templates, setTemplates] = useState<ResumeTemplateListItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [pickerLoadingUuid, setPickerLoadingUuid] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingTemplate, setPendingTemplate] = useState<ResumeTemplateListItem | null>(null);

  /** 마지막으로 발행된 fetch 요청만 반영하도록 보관하는 토큰 — 이전 fetch 결과가 늦게
   *  돌아와 최신 상태를 덮어쓰는 race 를 방지한다. */
  const fetchTokenRef = useRef(0);

  /** 현재 debouncedSearch 로 목록을 새로 가져온다. effect 와 retryFetch 가 공유. */
  const fetchTemplates = useCallback(async (query: string) => {
    const token = ++fetchTokenRef.current;
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const items = await resumeTemplatesApi.list(query ? { search: query } : undefined);
      if (token === fetchTokenRef.current) setTemplates(items);
    } catch (e) {
      if (token === fetchTokenRef.current) {
        setTemplatesError(e instanceof Error ? e.message : "템플릿 목록 불러오기 실패");
      }
    } finally {
      if (token === fetchTokenRef.current) setTemplatesLoading(false);
    }
  }, []);

  // 250ms debounce — picker 열려 있을 때만 동작
  useEffect(() => {
    if (!pickerOpen) return;
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput, pickerOpen]);

  // picker 가 열려 있거나 debouncedSearch 가 바뀌면 fetch 를 발행
  useEffect(() => {
    if (!pickerOpen) return;
    void fetchTemplates(debouncedSearch);
  }, [pickerOpen, debouncedSearch, fetchTemplates]);

  /** 직군(category) 기준 그룹핑된 목록. */
  const groupedTemplates = useMemo(() => {
    const groups = new Map<string, ResumeTemplateListItem[]>();
    for (const t of templates) {
      const key = t.job.category ?? "기타";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, "ko"));
  }, [templates]);

  /** 상세 API 를 호출해 본문을 로드 후 onApply 로 주입. */
  const applyTemplate = async (template: ResumeTemplateListItem) => {
    setPickerLoadingUuid(template.uuid);
    try {
      const detail = await resumeTemplatesApi.retrieve(template.uuid);
      onApply(detail.title, detail.content);
      setPickerOpen(false);
    } catch (e) {
      setTemplatesError(e instanceof Error ? e.message : "템플릿 불러오기 실패");
    } finally {
      setPickerLoadingUuid(null);
    }
  };

  /** 카드 클릭 핸들러 — 본문이 있으면 덮어쓰기 confirm 분기. */
  const handlePickTemplate = (template: ResumeTemplateListItem) => {
    if (currentContent.trim()) {
      setPendingTemplate(template);
      return;
    }
    void applyTemplate(template);
  };

  /** ConfirmModal 의 "덮어쓰기" 확정. */
  const confirmOverwrite = async () => {
    if (!pendingTemplate) return;
    await applyTemplate(pendingTemplate);
    setPendingTemplate(null);
  };

  /** 현재 debouncedSearch 로 재요청 (error retry 용) — 상태를 흔들지 않고 직접 재호출. */
  const retryFetch = useCallback(() => {
    void fetchTemplates(debouncedSearch);
  }, [debouncedSearch, fetchTemplates]);

  return {
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
    templates,
    templatesLoading,
    templatesError,
    pickerLoadingUuid,
    searchInput,
    setSearchInput,
    debouncedSearch,
    groupedTemplates,
    handlePickTemplate,
    pendingTemplate,
    cancelOverwrite: () => setPendingTemplate(null),
    confirmOverwrite,
    retryFetch,
  };
}
