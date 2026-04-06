import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useJdAnalyzingStore, type StepStatus } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

function StepBadge({ label, status }: { label: string; status: StepStatus }) {
  const cls =
    status === "done"
      ? "text-[11px] font-bold px-3 py-[5px] rounded-full bg-[#D1FAE5] text-[#047857]"
      : status === "active"
      ? "text-[11px] font-bold px-3 py-[5px] rounded-full bg-[#E6F7FA] text-[#0991B2] animate-[jan-pulse_1.5s_ease-in-out_infinite]"
      : "text-[11px] font-bold px-3 py-[5px] rounded-full bg-[#F3F4F6] text-[#9CA3AF]";

  return (
    <span className={cls}>
      {status === "done" ? `✓ ${label}` : status === "active" ? `⟳ ${label}` : label}
    </span>
  );
}

export function JdAnalyzingPage() {
  const navigate = useNavigate();
  const { steps, progress, isRunning, startAnalysis, reset } = useJdAnalyzingStore();
  const { user } = useSessionStore();

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

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[200] px-8 py-[14px] flex justify-center max-[640px]:px-4 max-[640px]:py-3">
        <div className="flex items-center justify-between w-full max-w-container-lg bg-white/[0.92] backdrop-blur-xl border border-[#E5E7EB] rounded-lg py-2 pl-6 pr-2 shadow-[var(--sc)]">
          <Link to="/home" className="text-[19px] font-black tracking-[-0.3px] text-[#0A0A0A] no-underline">
            me<span className="text-[#0991B2]">Fit</span>
          </Link>
          <ul className="flex gap-1 list-none">
            <li><Link to="/home" className="text-[13px] font-medium text-[#6B7280] no-underline px-[14px] py-2 rounded-lg transition-all duration-200 hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">홈</Link></li>
            <li><Link to="/jd" className="text-[13px] font-bold text-[#0991B2] bg-[#E6F7FA] no-underline px-[14px] py-2 rounded-lg">채용공고</Link></li>
            <li><Link to="/interview" className="text-[13px] font-medium text-[#6B7280] no-underline px-[14px] py-2 rounded-lg transition-all duration-200 hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">면접 시작</Link></li>
            <li><Link to="/resume" className="text-[13px] font-medium text-[#6B7280] no-underline px-[14px] py-2 rounded-lg transition-all duration-200 hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">이력서</Link></li>
          </ul>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-[13px] font-bold text-white shadow-[var(--sb)] cursor-pointer">
            {user?.initial || "U"}
          </div>
        </div>
      </nav>

      <div className="max-w-container-sm mx-auto pt-[100px] px-8 pb-[60px] max-[640px]:pt-20 max-[640px]:px-4 max-[640px]:pb-10">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6">
          <Link to="/jd" className="text-[#6B7280] no-underline transition-colors duration-200 hover:text-[#0991B2]">채용공고</Link>
          <span className="opacity-50">›</span>
          <span className="text-[#0A0A0A] font-semibold">분석 중</span>
        </div>

        {/* ANALYZING HERO */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[var(--sc)] p-[48px_40px] text-center relative overflow-hidden mb-[18px] animate-[jan-fadeUp_.45s_ease_both] max-[640px]:p-[36px_20px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(9,145,178,0.06)] to-[rgba(6,182,212,0.04)] pointer-events-none" />

          <div className="w-20 h-20 rounded-full bg-white shadow-[var(--sc)] flex items-center justify-center mx-auto mb-6 relative">
            <div className="w-11 h-11 border-4 border-[rgba(9,145,178,0.15)] border-t-[#0991B2] rounded-full animate-[jan-spin_0.9s_linear_infinite]" />
          </div>

          <div className="text-[22px] font-black text-[#0A0A0A] mb-2 relative">AI가 공고를 분석하고 있어요</div>
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
        </div>

        {/* SKELETON CARD 1 */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[var(--sc)] p-[28px_32px] mb-[18px] animate-[jan-fadeUp_.45s_ease_.1s_both] max-[640px]:p-[20px_16px]">
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[18px] w-1/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-3/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-4/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[20px] w-35p" />
          <div className="rounded-lg skeleton-shimmer mb-[14px] h-[80px]" />
          <div className="rounded-lg skeleton-shimmer mb-[14px] h-[60px]" />
        </div>

        {/* SKELETON CARD 2 */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[var(--sc)] p-[28px_32px] mb-[18px] animate-[jan-fadeUp_.45s_ease_.1s_both] max-[640px]:p-[20px_16px]">
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[14px] w-1/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-full" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-4/5" />
          <div className="h-[14px] rounded-full skeleton-shimmer mb-[10px] w-3/5" />
        </div>

        {/* BACK CTA */}
        <div className="text-center mt-6">
          <p className="text-[13px] text-[#6B7280] mb-4">분석 중에도 다른 작업을 진행할 수 있어요</p>
          <Link
            to="/jd"
            className="inline-flex items-center gap-2 text-[14px] font-bold text-[#0991B2] bg-[#E6F7FA] border border-[#0991B2] cursor-pointer px-6 py-[14px] rounded-lg transition-[background] duration-200 hover:bg-[#cceef6] no-underline whitespace-nowrap"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
