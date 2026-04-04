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
    <div className="ob-page">
      <header className="ob-header">
        <Link to="/" className="ob-logo">
          me<span style={{ color: "#0991B2" }}>Fit</span>
        </Link>
        <div className="ob-header-badge">
          <span className="ob-header-dot" />
          이메일 인증 완료
        </div>
      </header>

      <main className="ob-main">
        {/* ── Left ── */}
        <section className="ob-left">
          <div className="ob-badge">● STEP 3 OF 3</div>
          <h1 className="ob-title">
            이제 <span className="ob-accent">핏</span>을
            <br />
            맞춰볼
            <br />
            차례예요
          </h1>
          <p className="ob-desc">
            어떤 직군을 준비하는지 알려주면
            <br />
            AI가 맞춤 면접 질문을 바로 생성해줄게요.
          </p>

          {/* Email verified card */}
          <div className="ob-verified-card">
            <div className="ob-verified-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#059669" />
                <polyline
                  points="7 13 10 16 17 9"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <div className="ob-verified-text">
              <span className="ob-verified-label">이메일 인증 완료!</span>
              <span className="ob-verified-email">{email}</span>
            </div>
          </div>

          {/* Steps */}
          <div className="ob-steps">
            <div className="ob-step ob-step--done">
              <div className="ob-step-num ob-step-num--done">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="ob-step-info">
                <span className="ob-step-name">이메일로 계정 생성</span>
                <span className="ob-step-sub">완료</span>
              </div>
            </div>
            <div className="ob-step ob-step--done">
              <div className="ob-step-num ob-step-num--done">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="ob-step-info">
                <span className="ob-step-name">이메일 인증 완료</span>
                <span className="ob-step-sub">완료</span>
              </div>
            </div>
            <div className="ob-step ob-step--active">
              <div className="ob-step-num ob-step-num--active">3</div>
              <div className="ob-step-info">
                <span className="ob-step-name">프로필 작성 후 면접 시작</span>
                <span className="ob-step-sub">지금 이 단계예요</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: Profile Card ── */}
        <section className="ob-right">
          <div className="ob-card">
            <h2 className="ob-card-title">나를 알려주세요 👋</h2>
            <p className="ob-card-desc">
              면접 질문 맞춤화를 위해 딱 2가지만 입력하면 돼요.
            </p>

            {/* Progress */}
            <div className="ob-progress-row">
              <span className="ob-progress-label">프로필 완성도</span>
              <span className="ob-progress-value">{progress}%</span>
            </div>
            <div className="ob-progress-bar">
              <div
                className="ob-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Job categories — 단일 선택 */}
            <label className="ob-field-label">희망 직군</label>
            <div className="ob-chips">
              {JOB_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`ob-chip ${selectedJob === cat.id ? "ob-chip--selected" : ""}`}
                  onClick={() => selectJob(cat.id)}
                  aria-pressed={selectedJob === cat.id}
                >
                  <span className="ob-chip-emoji">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 희망 직업 — 자동완성 (1~3개) */}
            <label className="ob-field-label">
              희망 직업
              <span className="ob-field-hint"> ({jobTitles.length}/3)</span>
            </label>

            {/* 선택된 직업 태그 */}
            {jobTitles.length > 0 && (
              <div className="ob-selected-tags">
                {jobTitles.map((t) => (
                  <span key={t} className="ob-tag">
                    {t}
                    <button
                      type="button"
                      className="ob-tag-remove"
                      onClick={() => handleRemoveTitle(t)}
                      aria-label={`${t} 제거`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="ob-autocomplete" ref={acRef}>
              <input
                ref={inputRef}
                type="text"
                className="ob-input"
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
                <ul className="ob-ac-list" role="listbox">
                  {filtered.map((opt) => (
                    <li
                      key={opt.id}
                      className="ob-ac-item"
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
            <label className="ob-field-label">현재 직업 상태</label>
            <div className="ob-select-wrap">
              <select
                className="ob-select"
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
              <svg className="ob-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>

            {error && (
              <p className="ob-error" role="alert">{error}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              className="ob-submit-btn"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "면접 시작하러 가기 🚀"}
            </button>
          </div>
        </section>
      </main>

      <footer className="ob-footer">
        <a href="#">개인정보처리방침</a>
        <a href="#">이용약관</a>
        <a href="#">쿠키</a>
      </footer>

      <style>{`
        .ob-page {
          min-height: 100vh;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .ob-header {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 20px 0;
        }
        .ob-logo {
          font-family: 'Inter', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #0A0A0A;
          text-decoration: none;
        }
        .ob-header-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #059669;
          background: #ECFDF5;
          border: 1px solid #D1FAE5;
          border-radius: 8px;
          padding: 8px 16px;
        }
        .ob-header-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #059669;
          flex-shrink: 0;
        }

        /* ── Main ── */
        .ob-main {
          flex: 1;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          justify-content: center;
        }

        /* ── Left ── */
        .ob-left {
          display: flex;
          flex-direction: column;
        }
        .ob-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #0991B2;
          background: #E6F7FA;
          border-radius: 4px;
          padding: 5px 14px;
          margin-bottom: 14px;
          align-self: flex-start;
          letter-spacing: 0.5px;
        }
        .ob-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(36px, 9vw, 56px);
          font-weight: 900;
          line-height: 1.08;
          color: #0A0A0A;
          margin-bottom: 16px;
          letter-spacing: -2px;
        }
        .ob-accent {
          background: linear-gradient(135deg, #0991B2, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ob-desc {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        /* ── Verified card ── */
        .ob-verified-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 18px 22px;
          margin-bottom: 28px;
          box-shadow: var(--sc);
        }
        .ob-verified-icon { flex-shrink: 0; }
        .ob-verified-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ob-verified-label {
          font-size: 14px;
          font-weight: 700;
          color: #059669;
        }
        .ob-verified-email {
          font-size: 13px;
          color: #6B7280;
        }

        /* ── Steps ── */
        .ob-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ob-step {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          border-radius: 8px;
          background: transparent;
        }
        .ob-step--active {
          background: #0A0A0A;
          transition: transform 0.2s;
        }
        .ob-step--active:hover { transform: translateY(-1px); }
        .ob-step--active .ob-step-name { color: #fff; }
        .ob-step--active .ob-step-sub { color: rgba(255,255,255,0.5); }
        .ob-step--done { opacity: 0.6; }
        .ob-step-num {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #6B7280;
          background: #E5E7EB;
          flex-shrink: 0;
        }
        .ob-step-num--active { background: #0991B2; color: #fff; }
        .ob-step-num--done { background: #059669; color: #fff; }
        .ob-step-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ob-step-name { font-size: 14px; font-weight: 600; color: #0A0A0A; }
        .ob-step-sub { font-size: 12px; color: #9CA3AF; }

        /* ── Card ── */
        .ob-right { display: flex; justify-content: center; }
        .ob-card {
          width: 100%;
          max-width: 520px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 36px 28px;
          box-shadow: var(--sc);
        }
        .ob-card-title {
          font-family: 'Inter', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #0A0A0A;
          margin-bottom: 6px;
        }
        .ob-card-desc {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        /* ── Progress ── */
        .ob-progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .ob-progress-label { font-size: 13px; color: #6B7280; }
        .ob-progress-value { font-size: 13px; font-weight: 700; color: #0A0A0A; }
        .ob-progress-bar {
          width: 100%;
          height: 6px;
          background: #E5E7EB;
          border-radius: 3px;
          margin-bottom: 28px;
          overflow: hidden;
        }
        .ob-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0991B2, #06B6D4);
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        /* ── Fields ── */
        .ob-field-label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 8px;
        }
        .ob-input {
          width: 100%;
          padding: 14px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #0A0A0A;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 0;
          box-sizing: border-box;
        }
        .ob-input:focus { border-color: #0991B2; }
        .ob-input::placeholder { color: #D1D5DB; }
        .ob-input:disabled {
          background: #F3F4F6;
          cursor: not-allowed;
        }

        /* ── Chips ── */
        .ob-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }
        .ob-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .ob-chip:hover { border-color: #0991B2; color: #0991B2; }
        .ob-chip--selected {
          background: #E6F7FA;
          border-color: #0991B2;
          color: #0991B2;
        }
        .ob-chip-emoji { font-size: 14px; }

        /* ── Autocomplete ── */
        .ob-field-hint {
          font-size: 12px;
          font-weight: 600;
          color: #9CA3AF;
        }
        .ob-selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .ob-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          color: #0991B2;
          background: #E6F7FA;
          border: 1px solid #0991B2;
          border-radius: 8px;
        }
        .ob-tag-remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          font-size: 14px;
          line-height: 1;
          color: #0991B2;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 50%;
          transition: background 0.15s;
        }
        .ob-tag-remove:hover {
          background: rgba(9,145,178,0.15);
        }
        .ob-autocomplete {
          position: relative;
          margin-bottom: 24px;
        }
        .ob-ac-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin: 4px 0 0;
          padding: 6px 0;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          list-style: none;
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
        }
        .ob-ac-item {
          padding: 10px 16px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ob-ac-item:hover {
          background: #E6F7FA;
          color: #0991B2;
        }
        .ob-ac-item[aria-selected="true"] {
          background: #E6F7FA;
          color: #0991B2;
          font-weight: 600;
        }

        /* ── Select ── */
        .ob-select-wrap {
          position: relative;
          margin-bottom: 24px;
        }
        .ob-select {
          width: 100%;
          padding: 14px 40px 14px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #0A0A0A;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          outline: none;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .ob-select:focus { border-color: #0991B2; }
        .ob-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        /* ── Error ── */
        .ob-error {
          font-size: 13px;
          color: #DC2626;
          margin-bottom: 14px;
          padding: 10px 14px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 6px;
        }

        /* ── Submit ── */
        .ob-submit-btn {
          width: 100%;
          padding: 16px;
          background-color: #0A0A0A !important;
          background-image: none !important;
          color: #FFFFFF !important;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
          letter-spacing: -0.3px;
        }
        .ob-submit-btn:hover:not(:disabled) { opacity: 0.9; }
        .ob-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Footer ── */
        .ob-footer {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 32px 20px;
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .ob-footer a {
          font-size: 11px;
          color: #9CA3AF;
          text-decoration: none;
          transition: color 0.2s;
        }
        .ob-footer a:hover { color: #6B7280; }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .ob-header { padding: 28px 40px 0; }
          .ob-main {
            flex-direction: row;
            align-items: center;
            padding: 0 40px;
            gap: 60px;
          }
          .ob-left { flex: 1; max-width: 440px; padding-top: 16px; }
          .ob-right { flex: 1; max-width: 520px; }
          .ob-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .ob-title { font-size: clamp(40px, 4.5vw, 56px); }
          .ob-desc { font-size: 15px; }
          .ob-card { padding: 44px 36px; }
          .ob-footer { padding: 40px 40px; }
        }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .ob-left { align-items: center; text-align: center; }
          .ob-badge { align-self: center; }
          .ob-desc br { display: none; }
          .ob-verified-card { justify-content: center; }
          .ob-steps { flex-direction: row; gap: 8px; }
          .ob-step {
            flex-direction: column;
            text-align: center;
            padding: 12px 10px;
            flex: 1;
          }
          .ob-step-info { align-items: center; }
          .ob-chips { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
