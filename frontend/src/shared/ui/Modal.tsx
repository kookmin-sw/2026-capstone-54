/** 공통 Modal 컴포넌트.
 *
 * - Portal 로 document.body 에 렌더되어 부모 stacking context 에 영향받지 않음
 * - ESC 키, 백드롭 클릭, 닫기 버튼으로 dismiss (각각 개별 끄기 옵션)
 * - 열릴 때 body 스크롤 잠금
 * - footer slot 으로 임의 액션 배치 (ConfirmModal 같은 wrapper 가 활용)
 * - stickyTop slot 으로 스크롤해도 본문 상단에 고정되는 영역 (검색창 등) 배치
 * - heightMode 로 콘텐츠에 따른 높이 변화(flexible) / 뷰포트 기반 고정(fixed) 선택
 * - role="dialog" / aria-modal / aria-labelledby 로 접근성 확보
 *
 * Flexible (default):
 *   콘텐츠 크기에 맞춰 dialog 높이가 변한다. `max-h-[calc(100vh-32px)]` 로 상한만 있음.
 *   짧은 안내 / ConfirmModal 처럼 크기 변동이 괜찮은 경우 적합.
 *
 * Fixed:
 *   dialog 높이를 뷰포트 기반으로 고정해 검색/필터로 목록이 바뀌어도 흔들리지 않게 한다.
 *   picker / file browser / chat history 처럼 "스크롤 가능한 리스트" 에 적합.
 *
 * Usage:
 *   <Modal
 *     open={open}
 *     onClose={close}
 *     title="템플릿"
 *     size="lg"
 *     heightMode="fixed"
 *     stickyTop={<SearchInput ... />}
 *   >
 *     <TemplateList ... />
 *   </Modal>
 */

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl";
export type ModalHeightMode = "flexible" | "fixed";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** footer 액션 영역 (보통 버튼 그룹). 안 주면 footer 가 그려지지 않음. */
  footer?: ReactNode;
  /** 본문 스크롤 컨테이너 상단에 sticky 로 고정되는 슬롯 (검색창 등). */
  stickyTop?: ReactNode;
  size?: ModalSize;
  /**
   * 높이 동작 모드.
   * - "flexible" (default): 콘텐츠 크기에 맞춰 조절, `max-h` 상한만 있음
   * - "fixed": 뷰포트 기반 고정 높이 — 본문이 바뀌어도 흔들리지 않는다
   */
  heightMode?: ModalHeightMode;
  /** 백드롭 클릭으로 닫기 허용 여부. 기본 true. */
  dismissOnBackdrop?: boolean;
  /** ESC 키로 닫기 허용 여부. 기본 true. */
  dismissOnEsc?: boolean;
  /** 우상단 X 버튼 노출 여부. 기본 true. */
  showCloseButton?: boolean;
  /** 열린 후 호출되는 콜백 (mount 1회). */
  onOpened?: () => void;
}

const SIZE_CLS: Record<ModalSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[520px]",
  lg: "max-w-[680px]",
  xl: "max-w-[860px]",
};

/**
 * heightMode 별 dialog 루트 높이 클래스.
 * - flexible: max-h 상한만. 콘텐츠에 따라 shrink.
 * - fixed: 뷰포트 기반 고정 — `min(<size-specific>, calc(100vh-64px))` 로 small viewport 에서도 안전.
 *   각 size 별로 서로 다른 "타겟 높이" 를 갖되, 뷰포트가 작으면 자동으로 capped.
 */
const FIXED_HEIGHT_BY_SIZE: Record<ModalSize, string> = {
  sm: "h-[min(420px,calc(100vh-64px))]",
  md: "h-[min(560px,calc(100vh-64px))]",
  lg: "h-[min(680px,calc(100vh-64px))]",
  xl: "h-[min(780px,calc(100vh-64px))]",
};

const FLEXIBLE_HEIGHT_CLS = "max-h-[calc(100vh-32px)]";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  stickyTop,
  size = "md",
  heightMode = "flexible",
  dismissOnBackdrop = true,
  dismissOnEsc = true,
  showCloseButton = true,
  onOpened,
}: ModalProps) {
  // body scroll lock + ESC 핸들러
  useEffect(() => {
    if (!open) return;
    onOpened?.();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissOnEsc) {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const titleId = title ? "modal-title" : undefined;
  const descId = description ? "modal-desc" : undefined;

  // 본문 슬롯이 비어 있으면 (null / undefined / false / 빈 문자열 / 빈 배열) 본문 영역과
  // header/footer 사이의 divider 를 그리지 않는다 — ConfirmModal 처럼 description 만으로
  // 충분한 케이스에서 어색한 빈 구분선을 없앤다.
  // stickyTop 이 있으면 본문이 있다고 간주한다.
  const hasBody =
    stickyTop !== undefined
    || (children !== null
      && children !== undefined
      && children !== false
      && !(typeof children === "string" && children.length === 0)
      && !(Array.isArray(children) && children.length === 0));

  const dialogHeightCls =
    heightMode === "fixed" ? FIXED_HEIGHT_BY_SIZE[size] : FLEXIBLE_HEIGHT_CLS;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-[modal-fade-in_150ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => {
          if (dismissOnBackdrop) onClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-full ${SIZE_CLS[size]} ${dialogHeightCls} flex flex-col animate-[modal-pop_180ms_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <header
            className={`flex items-start justify-between gap-3 px-6 py-5 shrink-0 ${
              hasBody ? "border-b border-[#F3F4F6]" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-[16px] font-extrabold text-[#0A0A0A] leading-[1.4]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-[12px] text-[#6B7280] leading-[1.55]">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </header>
        )}

        {hasBody && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {stickyTop && (
              <div className="sticky top-0 z-[1] bg-white px-6 pt-5 pb-3 border-b border-[#F3F4F6]">
                {stickyTop}
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
          </div>
        )}

        {footer && (
          <footer
            className={`px-6 py-4 flex items-center justify-end gap-2 shrink-0 ${
              hasBody ? "border-t border-[#F3F4F6]" : ""
            }`}
          >
            {footer}
          </footer>
        )}
      </div>

      <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

/** Modal 내부에 footer 슬롯으로 넣을 수 있는 보조 컴포넌트 (선택 사용). */
Modal.Footer = function ModalFooter({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
