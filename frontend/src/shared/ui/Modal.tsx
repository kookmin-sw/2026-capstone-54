/** 공통 Modal 컴포넌트.
 *
 * - Portal 로 document.body 에 렌더되어 부모 stacking context 에 영향받지 않음
 * - ESC 키, 백드롭 클릭, 닫기 버튼으로 dismiss (각각 개별 끄기 옵션)
 * - 여러 Modal 이 중첩될 때도 안전한 body scroll lock (모듈 레벨 카운터)
 * - footer slot 으로 임의 액션 배치 (ConfirmModal 같은 wrapper 가 활용)
 * - stickyTop slot 으로 스크롤해도 본문 상단에 고정되는 영역 (검색창 등) 배치
 * - heightMode 로 콘텐츠에 따른 높이 변화(flexible) / 뷰포트 기반 고정(fixed) 선택
 * - role="dialog" / aria-modal / aria-labelledby 로 접근성 확보
 * - 애니메이션(`animate-modal-fade-in`, `animate-modal-pop`) 은 `tailwind.config.ts` 에
 *   키프레임이 정의되어 있다
 */

import { useEffect, useRef, type ReactNode } from "react";
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
  /** footer 액션 영역. 안 주면 footer 가 그려지지 않음. */
  footer?: ReactNode;
  /** 본문 스크롤 컨테이너 상단에 sticky 로 고정되는 슬롯. */
  stickyTop?: ReactNode;
  size?: ModalSize;
  heightMode?: ModalHeightMode;
  dismissOnBackdrop?: boolean;
  dismissOnEsc?: boolean;
  showCloseButton?: boolean;
  onOpened?: () => void;
}

const SIZE_CLS: Record<ModalSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[520px]",
  lg: "max-w-[680px]",
  xl: "max-w-[860px]",
};

const FIXED_HEIGHT_BY_SIZE: Record<ModalSize, string> = {
  sm: "h-[min(420px,calc(100vh-64px))]",
  md: "h-[min(560px,calc(100vh-64px))]",
  lg: "h-[min(680px,calc(100vh-64px))]",
  xl: "h-[min(780px,calc(100vh-64px))]",
};

const FLEXIBLE_HEIGHT_CLS = "max-h-[calc(100vh-32px)]";

// ─── 전역 scroll lock 카운터 ────────────────────────────────────────────
// 중첩 모달이 동시에 열려 있을 때 가장 마지막 하나가 닫힐 때까지
// body overflow 를 해제하지 않기 위한 카운터.
let openModalCount = 0;
let previousBodyOverflow: string | null = null;

function acquireBodyScrollLock() {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  openModalCount += 1;
}

function releaseBodyScrollLock() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow ?? "";
    previousBodyOverflow = null;
  }
}

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
  // 최신 콜백/옵션을 ref 로 보관 — effect 의존성 배열에 포함시키지 않고도
  // ESC 핸들러가 언제나 최신 값을 참조하도록 한다. 렌더 중 ref 변경은 금지이므로
  // 커밋 단계의 useEffect 에서 동기화한다.
  const onCloseRef = useRef(onClose);
  const onOpenedRef = useRef(onOpened);
  const dismissOnEscRef = useRef(dismissOnEsc);
  useEffect(() => {
    onCloseRef.current = onClose;
    onOpenedRef.current = onOpened;
    dismissOnEscRef.current = dismissOnEsc;
  });

  // open 이 true 로 바뀌는 시점에만 mount 로직 실행 (scroll lock, ESC listener, onOpened).
  useEffect(() => {
    if (!open) return;
    onOpenedRef.current?.();
    acquireBodyScrollLock();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissOnEscRef.current) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      releaseBodyScrollLock();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const titleId = title ? "modal-title" : undefined;
  const descId = description ? "modal-desc" : undefined;

  // 본문 슬롯이 비어 있으면 divider 를 그리지 않는다 — ConfirmModal 처럼
  // description 만으로 충분한 케이스의 빈 구분선 제거.
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-modal-fade-in"
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
        className={`relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-full ${SIZE_CLS[size]} ${dialogHeightCls} flex flex-col animate-modal-pop`}
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
    </div>,
    document.body,
  );
}

/** Modal 내부에 footer 슬롯으로 넣을 수 있는 보조 컴포넌트 (선택 사용). */
Modal.Footer = function ModalFooter({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
