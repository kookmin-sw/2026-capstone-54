import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { Button } from "./Button";

export interface CoachMarkStep {
  id: string;
  title: string;
  description: ReactNode;
  targetSelector: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export interface CoachMarksProps {
  steps: CoachMarkStep[];
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
  currentStep?: number;
  onStepChange?: (stepIndex: number) => void;
  dismissOnBackdrop?: boolean;
  dismissOnEsc?: boolean;
}

const TOOLTIP_WIDTH = 360;
const TOOLTIP_PADDING = 16;
const SPOTLIGHT_PADDING = 8;

export function CoachMarks(props: CoachMarksProps) {
  const {
    steps,
    open,
    onClose,
    onComplete,
    currentStep: controlledStep,
    onStepChange,
    dismissOnBackdrop = true,
    dismissOnEsc = true,
  } = props;

  const [internalStep, setInternalStep] = useState(0);
  const currentStepValue = controlledStep !== undefined ? controlledStep : internalStep;
  const currentStepData = steps[currentStepValue];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const coachMarksRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledStep !== undefined;

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  }, [currentStepValue]);

  useEffect(() => {
    if (!open) return;
    
    if (!isControlled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalStep(0);
    }
  }, [open, isControlled]);

  useEffect(() => {
    if (!open || !currentStepData?.targetSelector) return;
    
    const element = document.querySelector<HTMLElement>(currentStepData.targetSelector);
    if (element) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetRect(element.getBoundingClientRect());
    }
  }, [open, currentStepValue, currentStepData?.targetSelector]);

  useEffect(() => {
    if (!open) return;
    
    const handleResize = () => {
      if (currentStepData?.targetSelector) {
        const element = document.querySelector<HTMLElement>(currentStepData.targetSelector);
        if (element) {
           
          setTargetRect(element.getBoundingClientRect());
        }
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, currentStepData?.targetSelector]);

  const handleNext = useCallback(() => {
    if (currentStepValue < steps.length - 1) {
      if (isControlled) {
        onStepChange?.(currentStepValue + 1);
      } else {
        setInternalStep(currentStepValue + 1);
      }
    } else {
      onComplete?.();
      onClose();
    }
  }, [currentStepValue, steps.length, isControlled, onStepChange, onComplete, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentStepValue > 0) {
      if (isControlled) {
        onStepChange?.(currentStepValue - 1);
      } else {
        setInternalStep(currentStepValue - 1);
      }
    }
  }, [currentStepValue, isControlled, onStepChange]);

  const handleSkip = useCallback(() => {
    onComplete?.();
    onClose();
  }, [onComplete, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && dismissOnEsc) {
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowRight") {
      e.stopPropagation();
      handleNext();
    } else if (e.key === "ArrowLeft") {
      e.stopPropagation();
      handlePrevious();
    }
  }, [dismissOnEsc, onClose, handleNext, handlePrevious]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open || !currentStepData) return null;

  const position = currentStepData.position || "bottom";
  const align = currentStepData.align || "center";

  const getAlignPosition = (targetPos: number, targetSize: number, align: string) => {
    switch (align) {
      case "start":
        return targetPos;
      case "center":
        return targetPos + targetSize / 2 - TOOLTIP_WIDTH / 2;
      case "end":
        return targetPos + targetSize - TOOLTIP_WIDTH;
      default:
        return targetPos + targetSize / 2 - TOOLTIP_WIDTH / 2;
    }
  };

  const getSpotlightRect = () => {
    if (!targetRect) return null;
    
    return {
      x: targetRect.left - SPOTLIGHT_PADDING,
      y: targetRect.top - SPOTLIGHT_PADDING,
      width: targetRect.width + SPOTLIGHT_PADDING * 2,
      height: targetRect.height + SPOTLIGHT_PADDING * 2,
    };
  };

  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%" };
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let proposedTop: number;
    let proposedLeft: number;
    let proposedPosition = position;
    
    switch (position) {
      case "top":
        proposedTop = targetRect.top - TOOLTIP_PADDING;
        proposedLeft = getAlignPosition(targetRect.left, targetRect.width, align);
        break;
      case "bottom":
        proposedTop = targetRect.bottom + TOOLTIP_PADDING;
        proposedLeft = getAlignPosition(targetRect.left, targetRect.width, align);
        break;
      case "left":
        proposedTop = getAlignPosition(targetRect.top, targetRect.height, align);
        proposedLeft = targetRect.left - TOOLTIP_WIDTH - TOOLTIP_PADDING;
        break;
      case "right":
        proposedTop = getAlignPosition(targetRect.top, targetRect.height, align);
        proposedLeft = targetRect.right + TOOLTIP_PADDING;
        break;
      default:
        proposedTop = targetRect.bottom + TOOLTIP_PADDING;
        proposedLeft = getAlignPosition(targetRect.left, targetRect.width, align);
    }
    
    let finalTop = proposedTop;
    let finalLeft = proposedLeft;
    
    if (proposedLeft < TOOLTIP_PADDING) {
      finalLeft = TOOLTIP_PADDING;
    } else if (proposedLeft + TOOLTIP_WIDTH > windowWidth - TOOLTIP_PADDING) {
      finalLeft = windowWidth - TOOLTIP_WIDTH - TOOLTIP_PADDING;
    }
    
    if (proposedTop < TOOLTIP_PADDING) {
      finalTop = TOOLTIP_PADDING;
      if (targetRect.bottom + TOOLTIP_PADDING < windowHeight - TOOLTIP_PADDING) {
        finalTop = targetRect.bottom + TOOLTIP_PADDING;
        proposedPosition = "bottom";
      }
    } else if (proposedTop + tooltipHeight > windowHeight - TOOLTIP_PADDING) {
      if (targetRect.top - TOOLTIP_PADDING > TOOLTIP_PADDING) {
        finalTop = targetRect.top - TOOLTIP_PADDING - tooltipHeight;
        proposedPosition = "top";
      } else {
        finalTop = windowHeight - tooltipHeight - TOOLTIP_PADDING;
      }
    }
    
    return { top: `${finalTop}px`, left: `${finalLeft}px`, position: proposedPosition };
  };

  const spotlightRect = getSpotlightRect();
  const tooltipStyle = getTooltipPosition();

  return createPortal(
    <div
      ref={coachMarksRef}
      className="fixed inset-0 z-[2000]"
      role="dialog"
      aria-modal="true"
      aria-label="Coach Marks"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ fillRule: "evenodd", clipRule: "evenodd" }}
      >
        <defs>
          <mask id="coach-marks-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.x}
                y={spotlightRect.y}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#coach-marks-mask)"
        />
      </svg>

      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-2xl shadow-2xl p-6 text-left z-10 transition-all duration-200"
        style={{
          top: tooltipStyle.top,
          left: tooltipStyle.left,
          width: TOOLTIP_WIDTH,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900">{currentStepData.title}</h3>
          <button
            onClick={onClose}
            aria-label="Close coach marks"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-6 leading-relaxed">
          {currentStepData.description}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {currentStepValue + 1} / {steps.length}
          </div>

          <div className="flex gap-2">
            {currentStepValue > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
              >
                <ArrowLeft size={16} />
              </Button>
            )}

            {currentStepValue < steps.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
              >
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
              >
                완료
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              건너뛰기 <SkipForward size={14} />
            </Button>
          </div>
        </div>
      </div>

      {dismissOnBackdrop && (
        <div
          className="absolute inset-0"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </div>,
    document.body,
  );
}