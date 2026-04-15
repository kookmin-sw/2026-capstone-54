/** 확인/취소 형태의 일반 ConfirmModal.
 *
 * Modal 위에 얹은 얇은 wrapper 로, 콜백/라벨/위험도를 단순한 prop 으로 받는다.
 *
 * Usage:
 *   <ConfirmModal
 *     open={open}
 *     title="덮어쓸까요?"
 *     description="현재 작성 중인 내용이 사라집니다."
 *     confirmLabel="덮어쓰기"
 *     cancelLabel="취소"
 *     destructive
 *     onConfirm={() => { ... }}
 *     onCancel={() => setOpen(false)}
 *   />
 */

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Modal, type ModalSize } from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  /** 본문 영역에 추가로 그릴 임의 노드 (옵션). */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true 면 confirm 버튼이 빨간색 톤으로 표시된다 (삭제/덮어쓰기 등). */
  destructive?: boolean;
  size?: ModalSize;
  /** confirm 콜백. async 함수도 받는다 — 진행 중에는 자동으로 로딩 상태로 잠긴다. */
  onConfirm: () => void | Promise<void>;
  /** cancel 콜백. ESC / 백드롭 / 취소 버튼 / X 버튼 모두 이 함수를 호출한다. */
  onCancel: () => void;
  /** confirm 도중 에러 발생 시 호출. 기본은 console.error. */
  onError?: (error: unknown) => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  children,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  size = "sm",
  onConfirm,
  onCancel,
  onError,
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (e) {
      if (onError) onError(e);
      else console.error("ConfirmModal onConfirm failed:", e);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    if (isConfirming) return;
    onCancel();
  };

  const confirmCls = destructive
    ? "text-white bg-[#DC2626] hover:enabled:bg-[#B91C1C]"
    : "text-white bg-[#0A0A0A] hover:enabled:opacity-85";

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={title}
      description={description}
      size={size}
      dismissOnBackdrop={!isConfirming}
      dismissOnEsc={!isConfirming}
      footer={
        <>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isConfirming}
            className="text-[13px] font-bold text-[#6B7280] bg-transparent border border-[#E5E7EB] rounded-lg px-4 py-2 hover:enabled:text-[#0A0A0A] hover:enabled:bg-[#F3F4F6] disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`inline-flex items-center gap-1.5 text-[13px] font-bold rounded-lg px-4 py-2 disabled:opacity-50 transition-colors ${confirmCls}`}
          >
            {isConfirming && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
