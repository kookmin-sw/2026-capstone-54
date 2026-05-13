/** 템플릿 둘러보기 Modal + 덮어쓰기 ConfirmModal 합성 컴포넌트. */

import { ConfirmModal, Modal, SearchInput } from "@/shared/ui";
import { TemplatePickerList } from "./TemplatePickerList";
import type { useTemplatePicker } from "./useTemplatePicker";

interface TemplatePickerModalProps {
  picker: ReturnType<typeof useTemplatePicker>;
}

export function TemplatePickerModal({ picker }: TemplatePickerModalProps) {
  return (
    <>
      <Modal
        open={picker.pickerOpen}
        onClose={picker.closePicker}
        title="이력서 템플릿"
        description="직군별 템플릿을 선택하면 본문에 채워집니다. 작성 중인 내용이 있으면 덮어쓰기 전 한 번 더 확인합니다."
        size="lg"
        heightMode="fixed"
        stickyTop={
          <SearchInput
            value={picker.searchInput}
            onChange={picker.setSearchInput}
            placeholder="템플릿 제목으로 검색..."
            ariaLabel="템플릿 제목 검색"
          />
        }
      >
        <TemplatePickerList
          loading={picker.templatesLoading}
          error={picker.templatesError}
          templates={picker.templates}
          groupedTemplates={picker.groupedTemplates}
          debouncedSearch={picker.debouncedSearch}
          pickerLoadingUuid={picker.pickerLoadingUuid}
          onPick={picker.handlePickTemplate}
          onRetry={picker.retryFetch}
        />
      </Modal>

      <ConfirmModal
        open={picker.pendingTemplate !== null}
        title="현재 작성 중인 본문을 덮어쓸까요?"
        description={
          picker.pendingTemplate
            ? `선택한 템플릿(${picker.pendingTemplate.job.name} — ${picker.pendingTemplate.title}) 으로 본문이 교체됩니다. 작성 중인 내용은 사라져요.`
            : ""
        }
        confirmLabel="덮어쓰기"
        cancelLabel="취소"
        destructive
        onConfirm={picker.confirmOverwrite}
        onCancel={picker.cancelOverwrite}
      />
    </>
  );
}
