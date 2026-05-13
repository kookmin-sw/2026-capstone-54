/** 이력서 섹션 read/edit 토글 공통 래퍼.
 *
 * children 으로 read 영역과 edit 영역을 받아 토글한다. 저장 / 취소 액션과 isSaving 표시를 통합.
 */

import { Edit2, X, Loader2, Check } from "lucide-react";
import type { ReactNode } from "react";

interface EditableSectionProps {
  title: string;
  isEditing: boolean;
  isSaving?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave?: () => void;
  /** 편집 모드일 때 보여줄 폼 영역 */
  editView: ReactNode;
  /** 읽기 모드일 때 보여줄 콘텐츠 */
  readView: ReactNode;
  /** 편집 버튼을 숨기고 싶을 때 (1:N 처럼 각 항목마다 별도 처리) */
  hideEditButton?: boolean;
}

export function EditableSection({
  title,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  editView,
  readView,
  hideEditButton,
}: EditableSectionProps) {
  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-extrabold text-[#0A0A0A]">{title}</h2>
        {!hideEditButton && !isEditing && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2] hover:underline"
          >
            <Edit2 size={12} /> 편집
          </button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#0991B2] rounded px-2 py-1 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                저장
              </button>
            )}
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7280] hover:text-[#0A0A0A]"
            >
              <X size={12} /> 취소
            </button>
          </div>
        )}
      </header>
      {isEditing ? editView : readView}
    </section>
  );
}
