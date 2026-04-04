import { useState } from "react";
import { useAuthStore } from "@/features/auth";
import { useNavigate, Link } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const { isLoading, error, login, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "올바른 이메일을 입력해주세요.";
    if (!password.trim()) return "비밀번호를 입력해주세요.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    const result = await login(email, password);
    if (result.success) {
      if (result.isEmailConfirmed === false) {
        navigate("/verify-email");
      } else {
        navigate("/onboarding");
      }
    }
  };

  return (
    <div className="li-page">
      {/* Header */}
      <header className="li-header">
        <Link to="/" className="li-logo">me<span style={{ color: "#0991B2" }}>Fit</span></Link>
        <Link to="/sign-up" className="li-nav-link">회원가입 →</Link>
      </header>

      <main className="li-main">
        {/* Hero */}
        <section className="li-hero">
          <div className="li-badge">로그인</div>
          <h1 className="li-title">
            다시 만나서
            <br />
            <span className="li-accent">반가워요</span>
          </h1>
          <p className="li-desc">미핏과 함께 면접 준비를 이어가세요.</p>
        </section>

        {/* Form Card */}
        <section className="li-card-wrap">
          <div className="li-card">
            <form onSubmit={handleSubmit} noValidate>
              <div className="li-field">
                <label className="li-label" htmlFor="li-email">이메일</label>
                <div className="li-input-wrap">
                  <input id="li-email" className="li-input" type="email" placeholder="hello@mefit.kr" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <span className="li-input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                </div>
              </div>

              <div className="li-field">
                <label className="li-label" htmlFor="li-pw">비밀번호</label>
                <div className="li-input-wrap">
                  <input id="li-pw" className="li-input" type={showPw ? "text" : "password"} placeholder="비밀번호를 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="li-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}>
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {(validationError || error) && (
                <p className="li-error" role="alert">{validationError || error}</p>
              )}

              <button type="submit" className="li-submit" disabled={isLoading}>
                {isLoading ? "처리 중..." : "로그인 →"}
              </button>
            </form>

            <p className="li-bottom-text">
              아직 계정이 없으신가요? <Link to="/sign-up" className="li-bottom-anchor">회원가입 →</Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="li-footer">
        <a href="#">개인정보처리방침</a>
        <a href="#">이용약관</a>
        <a href="#">쿠키</a>
      </footer>

      <style>{`
        .li-page {
          min-height: 100vh;
          background: #FFFFFF;
          display: flex; flex-direction: column; align-items: center;
        }

        /* ── Header ── */
        .li-header {
          width: 100%; max-width: 1080px;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 20px 0;
        }
        .li-logo {
          font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 900;
          color: #0A0A0A; text-decoration: none;
        }
        .li-nav-link {
          font-size: 13px; font-weight: 500; color: #6B7280;
          text-decoration: none; padding: 8px 16px;
          border: 1px solid #E5E7EB; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .li-nav-link:hover { color: #0A0A0A; background: #F9FAFB; }

        /* ── Main ── */
        .li-main {
          width: 100%; max-width: 480px;
          padding: 0 20px;
          display: flex; flex-direction: column; align-items: center;
        }

        /* ── Hero ── */
        .li-hero { text-align: center; padding: 48px 0 32px; }
        .li-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
        }
        .li-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(32px, 9vw, 48px);
          font-weight: 900; line-height: 1.08;
          color: #0A0A0A; margin-bottom: 12px; letter-spacing: -2px;
        }
        .li-accent {
          background: linear-gradient(135deg, #0991B2, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .li-desc { font-size: 14px; color: #6B7280; line-height: 1.7; }

        /* ── Card ── */
        .li-card-wrap { width: 100%; display: flex; justify-content: center; }
        .li-card {
          width: 100%;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 8px; padding: 40px 28px;
          box-shadow: var(--sc);
        }

        /* ── Fields ── */
        .li-field { margin-bottom: 16px; }
        .li-label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 6px;
        }
        .li-input-wrap { position: relative; }
        .li-input {
          width: 100%; padding: 13px 16px;
          background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 8px; font-size: 14px; color: #0A0A0A;
          outline: none; transition: border-color 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .li-input::placeholder { color: #9CA3AF; }
        .li-input:focus { border-color: #0991B2; }
        .li-input-wrap .li-input { padding-right: 44px; }
        .li-input-icon {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          color: #9CA3AF; pointer-events: none;
          display: flex; align-items: center; justify-content: center;
        }
        .li-pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9CA3AF; padding: 4px;
          display: flex; align-items: center; justify-content: center;
        }
        .li-pw-toggle:hover { color: #6B7280; }

        /* ── Error ── */
        .li-error {
          font-size: 13px; color: #DC2626; margin-bottom: 14px;
          padding: 10px 14px; background: #FEF2F2;
          border: 1px solid #FECACA; border-radius: 8px;
        }

        /* ── Submit ── */
        .li-submit {
          width: 100%; padding: 15px;
          background: #0A0A0A; color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 700;
          border: none; border-radius: 8px; cursor: pointer;
          transition: opacity 0.2s;
        }
        .li-submit:hover:not(:disabled) { opacity: 0.85; }
        .li-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Bottom ── */
        .li-bottom-text {
          text-align: center; font-size: 13px; color: #6B7280; margin-top: 20px;
        }
        .li-bottom-anchor { color: #0991B2; font-weight: 700; text-decoration: none; }
        .li-bottom-anchor:hover { text-decoration: underline; }

        /* ── Footer ── */
        .li-footer {
          margin-top: 48px; padding-bottom: 32px;
          display: flex; gap: 20px;
        }
        .li-footer a {
          font-size: 11px; color: #9CA3AF; text-decoration: none;
          transition: color 0.2s;
        }
        .li-footer a:hover { color: #6B7280; }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .li-header { padding: 28px 40px 0; }
          .li-main { max-width: 1080px; padding: 0 40px; }
          .li-hero { padding: 64px 0 40px; }
          .li-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .li-title { font-size: clamp(36px, 5vw, 52px); margin-bottom: 16px; }
          .li-desc { font-size: 15px; }
          .li-card { max-width: 520px; padding: 40px 36px; }
          .li-field { margin-bottom: 18px; }
          .li-input { padding: 14px 16px; }
          .li-submit { padding: 16px; font-size: 16px; }
          .li-footer { margin-top: 64px; padding-bottom: 40px; }
        }
      `}</style>
    </div>
  );
}
