import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth";
import {
  useOnboardingStore,
  JOB_CATEGORIES,
  JOB_STATUS_OPTIONS,
} from "@/features/onboarding";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { pendingEmail } = useAuthStore();
  const {
    selectedJob,
    jobTitles,
    jobTitleOptions,
    jobTitlesLoading,
    jobStatus,
    isLoading,
    error,
    selectJob,
    toggleJobTitle,
    setJobStatus,
    submitProfile,
    clearError,
  } = useOnboardingStore();

  const email = pendingEmail || "hello@mefit.kr";

  // 자동완성 상태
  const [acOpen, setAcOpen] = useState(false);
  const [acFilter, setAcFilter] = useState("");
  const acRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = jobTitleOptions.filter(
    (o) =>
      o.label.toLowerCase().includes(acFilter.toLowerCase()) &&
      !jobTitles.includes(o.label)
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acRef.current && !acRef.current.contains(e.target as Node)) {
        setAcOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectTitle = useCallback(
    (label: string) => {
      toggleJobTitle(label);
      setAcFilter("");
      setAcOpen(false);
    },
    [toggleJobTitle]
  );

  const handleRemoveTitle = useCallback(
    (label: string) => {
      toggleJobTitle(label);
    },
    [toggleJobTitle]
  );

  const filledCount =
    (selectedJob ? 1 : 0) + (jobTitles.length > 0 ? 1 : 0);
  const progress = Math.round((filledCount / 2) * 100);

  const handleSubmit = async () => {
    clearError();
    const ok = await submitProfile();
    if (ok) navigate("/interview");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full max-w-container mx-auto flex justify-between items-center px-5 pt-5 md:px-10 md:pt-7">
        <Link to="/" className="font-inter text-[22px] font-black text-[#0A0A0A] no-underline">
          me<span style={{ color: "#0991B2" }}>Fit</span>
        </Link>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#059669] bg-[#ECFDF5] border border-[#D1FAE5] rounded-lg px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-[#059669] shrink-0" />
          이메일 인증 완료
        </div>
      </header>

      <main className="flex-1 w-full max-w-container mx-auto px-5 flex flex-col gap-10 justify-center items-center text-center md:flex-row md:items-center md:px-10 md:gap-[60px] md:text-left">
        {/* ── Left ── */}
        <section className="flex flex-col items-center md:flex-none md:flex-1 md:max-w-text md:items-start md:pt-4">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] tracking-[0.5px] self-center md:self-start md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            ● STEP 3 OF 3
          </div>
          <h1 className="font-inter text-[clamp(36px,9vw,56px)] font-black leading-[1.08] text-[#0A0A0A] mb-4 tracking-[-2px] md:text-[clamp(40px,4.5vw,56px)]">
            이제 <span className="gradient-text">핏</span>을
            <br />
            맞춰볼
            <br />
            차례예요
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-[1.7] mb-6 md:text-[15px]">
            어떤 직군을 준비하는지 알려주면
            <br className="hidden md:block" />
            AI가 맞춤 면접 질문을 바로 생성해줄게요.
          </p>

          {/* Email verified card */}
          <div className="flex items-center justify-center gap-[14px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[22px] py-[18px] mb-7 shadow-[var(--sc)] w-full md:justify-start">
            <div className="shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#059669" />
                <polyline points="7 13 10 16 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-bold text-[#059669]">이메일 인증 완료!</span>
              <span className="text-[13px] text-[#6B7280]">{email}</span>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-row gap-2 w-full md:flex-col md:gap-2">
            {[
              { done: true, num: null, name: "이메일로 계정 생성", sub: "완료" },
              { done: true, num: null, name: "이메일 인증 완료", sub: "완료" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center flex-1 px-[10px] py-3 rounded-lg opacity-60 md:flex-row md:items-center md:gap-[14px] md:text-left md:px-5 md:py-[14px]">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-white bg-[#059669] shrink-0 mx-auto md:mx-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="flex flex-col gap-0.5 items-center md:items-start">
                  <span className="text-[14px] font-semibold text-[#0A0A0A]">{step.name}</span>
                  <span className="text-[12px] text-[#9CA3AF]">{step.sub}</span>
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center text-center flex-1 px-[10px] py-3 rounded-lg bg-[#0A0A0A] transition-transform duration-200 hover:-translate-y-px md:flex-row md:items-center md:gap-[14px] md:text-left md:px-5 md:py-[14px]">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-white bg-[#0991B2] shrink-0 mx-auto md:mx-0">3</div>
              <div className="flex flex-col gap-0.5 items-center md:items-start">
                <span className="text-[14px] font-semibold text-white">프로필 작성 후 면접 시작</span>
                <span className="text-[12px] text-white/50">지금 이 단계예요</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: Profile Card ── */}
        <section className="flex justify-center w-full md:flex-none md:flex-1 md:max-w-form">
          <div className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-7 py-9 shadow-[var(--sc)] md:px-9 md:py-11">
            <h2 className="font-inter text-[22px] font-extrabold text-[#0A0A0A] mb-1.5">나를 알려주세요 👋</h2>
            <p className="text-[14px] text-[#6B7280] leading-[1.6] mb-6">
              면접 질문 맞춤화를 위해 딱 2가지만 입력하면 돼요.
            </p>

            {/* Progress */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-[#6B7280]">프로필 완성도</span>
              <span className="text-[13px] font-bold text-[#0A0A0A]">{progress}%</span>
            </div>
            <div className="w-full h-[6px] bg-[#E5E7EB] rounded-full mb-7 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0991B2] to-[#06B6D4] rounded-full transition-[width] duration-[400ms] ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Job categories — 단일 선택 */}
            <label className="block text-[14px] font-bold text-[#0A0A0A] mb-2">희망 직군</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {JOB_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`inline-flex items-center gap-[6px] px-4 py-[9px] font-inter text-[13px] font-semibold rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap border ${
                    selectedJob === cat.id
                      ? "bg-[#E6F7FA] border-[#0991B2] text-[#0991B2]"
                      : "bg-white border-[#E5E7EB] text-[#374151] hover:border-[#0991B2] hover:text-[#0991B2]"
                  }`}
                  onClick={() => selectJob(cat.id)}
                  aria-pressed={selectedJob === cat.id}
                >
                  <span className="text-[14px]">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 희망 직업 — 자동완성 (1~3개) */}
            <label className="block text-[14px] font-bold text-[#0A0A0A] mb-2">
              희망 직업
              <span className="text-[12px] font-semibold text-[#9CA3AF]"> ({jobTitles.length}/3)</span>
            </label>

            {/* 선택된 직업 태그 */}
            {jobTitles.length > 0 && (
              <div className="flex flex-wrap gap-[6px] mb-2">
                {jobTitles.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 py-[6px] text-[13px] font-semibold text-[#0991B2] bg-[#E6F7FA] border border-[#0991B2] rounded-lg">
                    {t}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-4 h-4 p-0 text-[14px] leading-none text-[#0991B2] bg-none border-none cursor-pointer rounded-full transition-[background] duration-150 hover:bg-[rgba(9,145,178,0.15)]"
                      onClick={() => handleRemoveTitle(t)}
                      aria-label={`${t} 제거`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative mb-6" ref={acRef}>
              <input
                ref={inputRef}
                type="text"
                className="w-full py-[14px] px-4 font-inter text-[15px] text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded-lg outline-none transition-[border-color] duration-200 placeholder-[#D1D5DB] focus:border-[#0991B2] disabled:bg-[#F3F4F6] disabled:cursor-not-allowed"
                placeholder={
                  !selectedJob
                    ? "먼저 희망 직군을 선택해주세요"
                    : jobTitlesLoading
                      ? "직업 목록 불러오는 중..."
                      : jobTitles.length >= 3
                        ? "최대 3개까지 선택 가능합니다"
                        : "직업을 검색하세요"
                }
                value={acFilter}
                disabled={!selectedJob || jobTitlesLoading || jobTitles.length >= 3}
                onChange={(e) => {
                  setAcFilter(e.target.value);
                  setAcOpen(true);
                }}
                onFocus={() => {
                  if (selectedJob && !jobTitlesLoading && jobTitles.length < 3) setAcOpen(true);
                }}
                aria-label="희망 직업"
                autoComplete="off"
              />
              {acOpen && filtered.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 py-[6px] bg-white border border-[#E5E7EB] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.08)] list-none max-h-[200px] overflow-y-auto z-10" role="listbox">
                  {filtered.map((opt) => (
                    <li
                      key={opt.id}
                      className="px-4 py-[10px] text-[14px] text-[#374151] cursor-pointer transition-[background] duration-150 hover:bg-[#E6F7FA] hover:text-[#0991B2] aria-selected:bg-[#E6F7FA] aria-selected:text-[#0991B2] aria-selected:font-semibold"
                      role="option"
                      aria-selected={jobTitles.includes(opt.label)}
                      onClick={() => handleSelectTitle(opt.label)}
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Job status */}
            <label className="block text-[14px] font-bold text-[#0A0A0A] mb-2">현재 직업 상태</label>
            <div className="relative mb-6">
              <select
                className="w-full py-[14px] pl-4 pr-10 font-inter text-[15px] text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded-lg outline-none appearance-none cursor-pointer transition-[border-color] duration-200 focus:border-[#0991B2]"
                value={jobStatus}
                onChange={(e) => setJobStatus(e.target.value)}
                aria-label="현재 직업 상태"
              >
                {JOB_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg className="absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>

            {error && (
              <p className="text-[13px] text-[#DC2626] mb-[14px] px-[14px] py-[10px] bg-[#FEF2F2] border border-[#FECACA] rounded-[6px]" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="button"
              className="w-full py-4 bg-[#0A0A0A] text-white font-inter text-[16px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 tracking-[-0.3px] hover:enabled:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "면접 시작하러 가기 🚀"}
            </button>
          </div>
        </section>
      </main>

      <footer className="w-full max-w-container mx-auto px-5 py-8 flex justify-center gap-5 md:px-10 md:py-10">
        {["개인정보처리방침", "이용약관", "쿠키"].map((item) => (
          <a key={item} href="#" className="text-[11px] text-[#9CA3AF] no-underline transition-[color] duration-200 hover:text-[#6B7280]">
            {item}
          </a>
        ))}
      </footer>
    </div>
  );
}
