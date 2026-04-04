import { useState, useRef } from "react";
import { useAuthStore } from "@/features/auth";
import { Link, useNavigate } from "react-router-dom";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { pendingEmail, isLoading, error, resendVerification, verifyCode, logout, clearError } = useAuthStore();
  const [resent, setResent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = pendingEmail || "hello@mefit.kr";

  const handleResend = async () => {
    setResent(false);
    clearError();
    const ok = await resendVerification(email);
    if (ok) setResent(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1).toUpperCase();
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const fullCode = code.join("");

  const handleVerify = async () => {
    clearError();
    const ok = await verifyCode(email, fullCode);
    if (ok) navigate("/onboarding");
  };

  return (
    <div className="ve-page">
      <header className="ve-header">
        <Link to="/" className="ve-logo">
          me<span style={{ color: "#0991B2" }}>Fit</span>
        </Link>
        <button type="button" className="ve-logout-btn" onClick={handleLogout}>
          🚪 로그아웃
        </button>
      </header>

      <main className="ve-main">
        {/* Left */}
        <section className="ve-left">
          <div className="ve-badge">● STEP 2 OF 3</div>
          <h1 className="ve-title">
            인증 메일을
            <br />
            <span className="ve-accent">확인</span>해주세요
          </h1>
          <p className="ve-desc">
            이메일 인증을 완료해야
            <br />
            모든 기능을 이용할 수 있어요.
          </p>

          <div className="ve-steps">
            <div className="ve-step ve-step--done">
              <div className="ve-step-num ve-step-num--done">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="ve-step-info">
                <span className="ve-step-name">이메일로 계정 생성</span>
                <span className="ve-step-sub">완료했어요</span>
              </div>
            </div>
            <div className="ve-step ve-step--active">
              <div className="ve-step-num ve-step-num--active">
                <span className="ve-step-excl">!</span>
              </div>
              <div className="ve-step-info">
                <span className="ve-step-name ve-step-name--alert">이메일 인증 대기 중</span>
                <span className="ve-step-sub ve-step-sub--alert">인증이 필요해요</span>
              </div>
            </div>
            <div className="ve-step">
              <div className="ve-step-num">3</div>
              <div className="ve-step-info">
                <span className="ve-step-name">프로필 작성 후 면접 시작</span>
                <span className="ve-step-sub">직군·경력 입력</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Card */}
        <section className="ve-right">
          <div className="ve-card">
            {/* Lock icon */}
            <div className="ve-icon-wrap">
              <div className="ve-icon-circle">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" fill="#F59E0B" opacity="0.85"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="#92400E"/>
                </svg>
              </div>
              <div className="ve-icon-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#EF4444"/>
                  <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">!</text>
                </svg>
              </div>
            </div>

            <h2 className="ve-card-title">이메일 인증이 필요해요</h2>
            <p className="ve-card-desc">
              회원가입 시 입력한 이메일로 인증 코드를 보냈어요.
              <br />
              코드를 입력하면 모든 기능을 자유롭게 이용할 수 있어요.
            </p>

            {/* Email display */}
            <div className="ve-email-box">
              <span className="ve-email-dot" />
              <span className="ve-email-text">{email}</span>
            </div>

            {/* Code input */}
            <div className="ve-code-inputs" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  className="ve-code-input"
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`인증 코드 ${i + 1}번째 자리`}
                />
              ))}
            </div>

            {error && (
              <p className="ve-error" role="alert">{error}</p>
            )}

            {/* Verify button */}
            <button
              type="button"
              className="ve-verify-btn"
              onClick={handleVerify}
              disabled={isLoading || fullCode.length < 6}
            >
              {isLoading ? "확인 중..." : "인증 완료 →"}
            </button>

            {/* Resend label */}
            <p className="ve-resend-label">인증 메일 재전송</p>

            {/* Resend button */}
            <button
              type="button"
              className="ve-resend-btn"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? "발송 중..." : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  인증 메일 다시 보내기
                </>
              )}
            </button>

            {resent && (
              <p className="ve-resent-msg" role="status">인증 메일이 재발송되었습니다.</p>
            )}

            {/* Action buttons */}
            <button
              type="button"
              className="ve-action-btn"
              onClick={handleLogout}
            >
              🚪 다른 계정으로 로그인
            </button>

            <p className="ve-help-text">
              메일이 안 보인다면 <strong>스팸함</strong>을 확인하거나,
              <br />
              <a href="#" className="ve-help-link">고객센터에 문의</a>해 주세요.
            </p>
          </div>
        </section>
      </main>

      <footer className="ve-footer">
        <a href="#">개인정보처리방침</a>
        <a href="#">이용약관</a>
        <a href="#">쿠키</a>
      </footer>

      <style>{`
        .ve-page {
          min-height: 100vh;
          background: #FFFFFF;
          display: flex; flex-direction: column;
        }

        /* ── Header ── */
        .ve-header {
          width: 100%; max-width: 1080px;
          margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 20px 0;
        }
        .ve-logo {
          font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 900;
          color: #0A0A0A; text-decoration: none;
        }
        .ve-logout-btn {
          font-size: 13px; font-weight: 500; color: #6B7280;
          padding: 8px 16px; background: none;
          border: 1px solid #E5E7EB; border-radius: 8px;
          cursor: pointer; transition: color 0.2s, background 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .ve-logout-btn:hover { color: #0A0A0A; background: #F9FAFB; }

        /* ── Main ── */
        .ve-main {
          flex: 1; width: 100%; max-width: 1080px;
          margin: 0 auto; padding: 0 20px;
          display: flex; flex-direction: column; gap: 40px;
          justify-content: center;
        }

        /* ── Left ── */
        .ve-left { display: flex; flex-direction: column; }
        .ve-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
          align-self: flex-start;
        }
        .ve-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(36px, 9vw, 56px);
          font-weight: 900; line-height: 1.08;
          color: #0A0A0A; margin-bottom: 16px; letter-spacing: -2px;
        }
        .ve-accent {
          background: linear-gradient(135deg, #0991B2, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ve-desc {
          font-size: 14px; color: #6B7280; line-height: 1.7;
          margin-bottom: 32px;
        }

        /* ── Steps ── */
        .ve-steps { display: flex; flex-direction: column; gap: 8px; }
        .ve-step {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px; border-radius: 8px;
          background: transparent;
        }
        .ve-step--active {
          background: transparent;
        }
        .ve-step--done { opacity: 0.6; }
        .ve-step-num {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          color: #6B7280; background: #E5E7EB; flex-shrink: 0;
        }
        .ve-step-num--active {
          background: #FEE2E2; color: #EF4444;
        }
        .ve-step-excl {
          font-size: 18px; font-weight: 900; color: #EF4444;
        }
        .ve-step-num--done { background: #0A0A0A; color: #fff; }
        .ve-step-info { display: flex; flex-direction: column; gap: 2px; }
        .ve-step-name { font-size: 14px; font-weight: 600; color: #0A0A0A; }
        .ve-step-name--alert { color: #EF4444; font-weight: 700; }
        .ve-step-sub { font-size: 12px; color: #9CA3AF; }
        .ve-step-sub--alert { color: #EF4444; }

        /* ── Card ── */
        .ve-right { display: flex; justify-content: center; }
        .ve-card {
          width: 100%; max-width: 520px;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 8px; padding: 40px 28px;
          box-shadow: var(--sc);
          text-align: center;
        }

        /* ── Lock Icon ── */
        .ve-icon-wrap {
          display: inline-block;
          position: relative;
          margin-bottom: 24px;
        }
        .ve-icon-circle {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #E6F7FA, #D1FAE5);
          display: flex; align-items: center; justify-content: center;
        }
        .ve-icon-badge {
          position: absolute; bottom: -2px; right: -2px;
          width: 22px; height: 22px; border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .ve-card-title {
          font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800;
          color: #0A0A0A; margin-bottom: 8px;
        }
        .ve-card-desc {
          font-size: 14px; color: #6B7280; line-height: 1.7;
          margin-bottom: 24px;
        }

        /* ── Email box ── */
        .ve-email-box {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 8px; padding: 14px 20px;
          margin-bottom: 20px;
        }
        .ve-email-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #F59E0B; flex-shrink: 0;
        }
        .ve-email-text {
          font-size: 15px; font-weight: 700; color: #0A0A0A;
          font-family: 'Inter', sans-serif;
        }

        /* ── Resend label ── */
        .ve-resend-label {
          font-size: 12px; color: #9CA3AF; text-align: left;
          margin-bottom: 8px;
        }

        /* ── Code inputs ── */
        .ve-code-inputs {
          display: flex; gap: 8px; justify-content: center;
          margin-bottom: 16px;
        }
        .ve-code-input {
          width: 48px; height: 56px;
          text-align: center; font-size: 22px; font-weight: 800;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A; background: #FFFFFF;
          border: 1px solid #E5E7EB; border-radius: 8px;
          outline: none; transition: border-color 0.2s;
        }
        .ve-code-input:focus { border-color: #0991B2; }
        .ve-code-input::placeholder { color: #D1D5DB; }

        /* ── Error ── */
        .ve-error {
          font-size: 13px; color: #DC2626; margin-bottom: 14px;
          padding: 10px 14px; background: #FEF2F2;
          border: 1px solid #FECACA; border-radius: 8px;
          text-align: center;
        }

        /* ── Verify button ── */
        .ve-verify-btn {
          width: 100%; padding: 15px;
          background: #0991B2; color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 700;
          border: none; border-radius: 8px; cursor: pointer;
          transition: opacity 0.2s;
          margin-bottom: 20px;
        }
        .ve-verify-btn:hover:not(:disabled) { opacity: 0.85; }
        .ve-verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Resend button ── */
        .ve-resend-btn {
          width: 100%; padding: 15px;
          background: #0A0A0A; color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 700;
          border: none; border-radius: 8px; cursor: pointer;
          transition: opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-bottom: 12px;
        }
        .ve-resend-btn:hover:not(:disabled) { opacity: 0.85; }
        .ve-resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ve-resent-msg {
          font-size: 13px; color: #059669; margin-bottom: 12px;
          font-weight: 600;
        }

        /* ── Action buttons ── */
        .ve-action-btn {
          width: 100%; padding: 14px;
          background: #FFFFFF; color: #374151;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 600;
          border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer;
          transition: color 0.2s, background 0.2s;
          margin-bottom: 8px;
        }
        .ve-action-btn:hover { color: #0A0A0A; background: #F3F4F6; }

        /* ── Help text ── */
        .ve-help-text {
          font-size: 13px; color: #6B7280; margin-top: 16px;
          line-height: 1.6;
        }
        .ve-help-link {
          color: #0A0A0A; font-weight: 700; text-decoration: underline;
        }
        .ve-help-link:hover { color: #0991B2; }

        /* ── Footer ── */
        .ve-footer {
          width: 100%; max-width: 1080px; margin: 0 auto;
          padding: 32px 20px;
          display: flex; justify-content: center; gap: 20px;
        }
        .ve-footer a {
          font-size: 11px; color: #9CA3AF; text-decoration: none;
          transition: color 0.2s;
        }
        .ve-footer a:hover { color: #6B7280; }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .ve-header { padding: 28px 40px 0; }
          .ve-main {
            flex-direction: row; align-items: center;
            padding: 0 40px; gap: 60px;
          }
          .ve-left { flex: 1; max-width: 440px; padding-top: 16px; }
          .ve-right { flex: 1; max-width: 520px; }
          .ve-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .ve-title { font-size: clamp(40px, 4.5vw, 56px); }
          .ve-desc { font-size: 15px; }
          .ve-card { padding: 48px 36px; }
          .ve-verify-btn { padding: 16px; font-size: 16px; }
          .ve-resend-btn { padding: 16px; font-size: 16px; }
          .ve-footer { padding: 40px 40px; }
        }

        /* ── Mobile: steps horizontal ── */
        @media (max-width: 767px) {
          .ve-left { align-items: center; text-align: center; }
          .ve-badge { align-self: center; }
          .ve-desc br { display: none; }
          .ve-steps { flex-direction: row; gap: 8px; }
          .ve-step {
            flex-direction: column; text-align: center;
            padding: 12px 10px; flex: 1;
          }
          .ve-step-info { align-items: center; }
        }
      `}</style>
    </div>
  );
}
