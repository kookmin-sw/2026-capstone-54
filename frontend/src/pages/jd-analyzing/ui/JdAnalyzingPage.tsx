import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useJdAnalyzingStore, type StepStatus } from "@/features/jd";
import { Navigation, Card, Badge, Button } from "@/shared/ui";

function StepBadge({ label, status }: { label: string; status: StepStatus }) {
  const variant = status === "done" ? "success" : status === "active" ? "info" : "default";
  const icon = status === "done" ? "✓ " : status === "active" ? "⟳ " : "";
  
  return (
    <Badge variant={variant} className={status === "active" ? "animate-[jan-pulse_1.5s_ease-in-out_infinite]" : ""}>
      {icon}{label}
    </Badge>
  );
}

export function JdAnalyzingPage() {
  const navigate = useNavigate();
  const { steps, progress, isRunning, startAnalysis, reset } = useJdAnalyzingStore();

  useEffect(() => {
    reset();
    startAnalysis(() => {
      setTimeout(() => navigate("/jd/detail/mock-jd-1"), 600);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = steps.find((s) => s.status === "active");
  const subText = isRunning
    ? currentStep
      ? `${currentStep.label} 처리 중...`
      : "잠깐만요, 금방 끝나요 ✨"
    : "분석 완료! 잠시 후 이동합니다...";

  const navItems = [
    { to: "/home", label: "홈" },
    { to: "/jd", label: "채용공고", active: true },
    { to: "/interview", label: "면접 시작" },
    { to: "/resume", label: "이력서" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <Navigation items={navItems} />

      <div className="max-w-container-sm mx-auto pt-[100px] px-8 pb-[60px] max-[640px]:pt-20 max-[640px]:px-4 max-[640px]:pb-10">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6">
          <Link
            to="/jd"
            className="text-[#6B7280] no-underline transition-colors duration-200 hover:text-[#0991B2]"
          >
            채용공고
          </Link>
          <span className="opacity-50">›</span>
          <span className="text-[#0A0A0A] font-semibold">분석 중</span>
        </div>

        {/* ANALYZING HERO */}
        <Card
          padding="lg"
          className="text-center relative overflow-hidden mb-[18px] animate-[jan-fadeUp_.45s_ease_both] max-[640px]:p-[36px_20px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(9,145,178,0.06)] to-[rgba(6,182,212,0.04)] pointer-events-none" />

          <div className="w-20 h-20 rounded-full bg-white shadow-[var(--sc)] flex items-center justify-center mx-auto mb-6 relative">
            <div className="w-11 h-11 border-4 border-[rgba(9,145,178,0.15)] border-t-[#0991B2] rounded-full animate-[jan-spin_0.9s_linear_infinite]" />
          </div>

          <div className="text-[22px] font-black text-[#0A0A0A] mb-2 relative">
            AI가 공고를 분석하고 있어요
          </div>
          <div className="text-[14px] text-[#6B7280] relative min-h-[20px]">{subText}</div>

          <div className="mt-6 relative">
            <div className="h-[6px] bg-[#E5E7EB] rounded-full overflow-hidden max-w-button-group mx-auto">
              <div
                className="h-full bg-gradient-to-r from-[#06B6D4] to-[#0991B2] rounded-full transition-[width] duration-500 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {steps.map((s) => (
                <StepBadge key={s.key} label={s.label} status={s.status} />
              ))}
            </div>
          </div>
        </Card>

        {/* SKELETON CARD 1 */}
        <Card className="mb-[18px] animate-[jan-fadeUp_.45s_ease_.1s_both] max-[640px]:p-[20px_16px]">
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[18px] w-1/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-3/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-4/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[20px] w-35p" />
          <div className="rounded-lg skeleton-shimmer mb-[14px] h-[80px]" />
          <div className="rounded-lg skeleton-shimmer mb-[14px] h-[60px]" />
        </Card>

        {/* SKELETON CARD 2 */}
        <Card className="mb-[18px] animate-[jan-fadeUp_.45s_ease_.1s_both] max-[640px]:p-[20px_16px]">
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[14px] w-1/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-full" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-4/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-3/5" />
        </Card>

        {/* BACK CTA */}
        <div className="text-center mt-6">
          <p className="text-[13px] text-[#6B7280] mb-4">분석 중에도 다른 작업을 진행할 수 있어요</p>
          <Button variant="secondary" onClick={() => navigate("/jd")}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
