import { useState } from "react";
import { useAuthStore } from "@/features/auth";
import { useNavigate, Link } from "react-router-dom";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function timingSafeEqual(a: string, b: string): boolean {
  const lenA = a.length;
  const lenB = b.length;
  const len = Math.max(lenA, lenB);
  let result = lenA ^ lenB;
  for (let i = 0; i < len; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

const SIGNUP_STYLES = `
        .su-page {
          min-height: 100vh;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .su-header {
          width: 100%; max-width: 1080px;
          margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 20px 0;
        }
        .su-logo {
          font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 900;
          color: #0A0A0A; text-decoration: none;
        }
        .su-nav-link {
          font-size: 13px; font-weight: 500; color: #6B7280;
          text-decoration: none; padding: 8px 16px;
          border: 1px solid #E5E7EB; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .su-nav-link:hover { color: #0A0A0A; background: #F9FAFB; }

        /* ── Main ── */
        .su-main {
          flex: 1; width: 100%; max-width: 1080px;
          margin: 0 auto; padding: 0 20px;
          display: flex; flex-direction: column; gap: 40px;
          justify-content: center;
        }

        /* ── Left ── */
        .su-left { display: flex; flex-direction: column; }
        .su-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
          align-self: flex-start; letter-spacing: 0.5px;
        }
        .su-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(36px, 9vw, 56px);
          font-weight: 900; line-height: 1.08;
          color: #0A0A0A; margin-bottom: 16px; letter-spacing: -2px;
        }
        .su-accent {
          background: linear-gradient(135deg, #0991B2, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .su-desc {
          font-size: 14px; color: #6B7280; line-height: 1.7;
          margin-bottom: 32px;
        }

        /* ── Steps ── */
        .su-steps { display: flex; flex-direction: column; gap: 8px; }
        .su-step {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px; border-radius: 8px;
          background: transparent; border: none;
        }
        .su-step--active {
          background: #0A0A0A;
          transition: transform 0.2s;
        }
        .su-step--active:hover { transform: translateY(-1px); }
        .su-step--active .su-step-name { color: #fff; }
        .su-step--active .su-step-sub { color: rgba(255,255,255,0.5); }
        .su-step-num {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          color: #6B7280; background: #E5E7EB; flex-shrink: 0;
        }
        .su-step-num--active { background: #0991B2; color: #fff; }
        .su-step-info { display: flex; flex-direction: column; gap: 2px; }
        .su-step-name { font-size: 14px; font-weight: 600; color: #0A0A0A; }
        .su-step-sub { font-size: 12px; color: #9CA3AF; }

        /* ── Card ── */
        .su-right { display: flex; justify-content: center; }
        .su-card {
          width: 100%; max-width: 520px;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 8px; padding: 40px 28px;
          box-shadow: var(--sc);
        }
        .su-card-title {
          font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800;
          color: #0A0A0A; margin-bottom: 6px;
        }
        .su-card-desc {
          font-size: 14px; color: #6B7280; margin-bottom: 28px;
        }

        /* ── Row ── */
        .su-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* ── Fields ── */
        .su-field { margin-bottom: 16px; }
        .su-label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 6px;
        }
        .su-input-wrap { position: relative; }
        .su-input {
          width: 100%; padding: 13px 16px;
          background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 8px; font-size: 14px; color: #0A0A0A;
          outline: none; transition: border-color 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .su-input::placeholder { color: #9CA3AF; }
        .su-input:focus { border-color: #0991B2; }
        .su-input-wrap .su-input { padding-right: 44px; }
        .su-input-icon {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          color: #9CA3AF; pointer-events: none;
          display: flex; align-items: center; justify-content: center;
        }
        .su-pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9CA3AF; padding: 4px;
          display: flex; align-items: center; justify-content: center;
        }
        .su-pw-toggle:hover { color: #6B7280; }

        /* ── Agreement ── */
        .su-agree {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13px; color: #374151; cursor: pointer;
          margin-bottom: 16px;
        }
        .su-agree input[type="checkbox"] {
          width: 17px; height: 17px; accent-color: #0991B2;
          border-radius: 3px; cursor: pointer; flex-shrink: 0; margin-top: 1px;
        }
        .su-agree-link {
          color: #0991B2; font-weight: 700; text-decoration: none;
        }
        .su-agree-link:hover { text-decoration: underline; }

        /* ── Error ── */
        .su-error {
          font-size: 13px; color: #DC2626; margin-bottom: 14px;
          padding: 10px 14px; background: #FEF2F2;
          border: 1px solid #FECACA; border-radius: 8px;
        }

        /* ── Submit ── */
        .su-submit {
          width: 100%; padding: 15px;
          background: #0A0A0A; color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 700;
          border: none; border-radius: 8px; cursor: pointer;
          transition: opacity 0.2s;
        }
        .su-submit:hover:not(:disabled) { opacity: 0.85; }
        .su-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Bottom ── */
        .su-bottom-text {
          text-align: center; font-size: 13px; color: #6B7280; margin-top: 20px;
        }
        .su-bottom-anchor { color: #0991B2; font-weight: 700; text-decoration: none; }
        .su-bottom-anchor:hover { text-decoration: underline; }

        /* ── Footer ── */
        .su-footer {
          width: 100%; max-width: 1080px; margin: 0 auto;
          padding: 32px 20px;
          display: flex; justify-content: center; gap: 20px;
        }
        .su-footer a {
          font-size: 11px; color: #9CA3AF; text-decoration: none;
          transition: color 0.2s;
        }
        .su-footer a:hover { color: #6B7280; }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .su-header { padding: 28px 40px 0; }
          .su-main {
            flex-direction: row; align-items: center;
            padding: 0 40px; gap: 60px;
          }
          .su-left { flex: 1; max-width: 440px; padding-top: 16px; }
          .su-right { flex: 1; max-width: 520px; }
          .su-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .su-title { font-size: clamp(40px, 4.5vw, 56px); }
          .su-desc { font-size: 15px; }
          .su-card { padding: 40px 36px; }
          .su-field { margin-bottom: 18px; }
          .su-input { padding: 14px 16px; }
          .su-submit { padding: 16px; font-size: 16px; }
          .su-footer { padding: 40px 40px; }
        }

        /* ── Mobile: steps horizontal ── */
        @media (max-width: 767px) {
          .su-left { align-items: center; text-align: center; }
          .su-badge { align-self: center; }
          .su-desc br { display: none; }
          .su-steps { flex-direction: row; gap: 8px; }
          .su-step {
            flex-direction: column; text-align: center;
            padding: 12px 10px; flex: 1;
          }
          .su-step-info { align-items: center; }
        }
`;

interface AgreementState {
  terms: boolean;
  privacy: boolean;
}

export function SignUpPage() {
  const navigate = useNavigate();
  const { isLoading, error, signUp, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [agreements, setAgreements] = useState<AgreementState>({
    terms: false,
    privacy: false,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return "이름을 입력해주세요.";
    if (!email.trim()) return "올바른 이메일을 입력해주세요.";
    if (!isValidEmail(email)) return "올바른 이메일을 입력해주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (!timingSafeEqual(password, passwordConfirm)) return "비밀번호가 일치하지 않습니다.";
    if (!(agreements.terms && agreements.privacy))
      return "이용약관 및 개인정보처리방침에 동의해주세요.";
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
    const ok = await signUp({ name, email, password });
    if (ok) navigate("/verify-email");
  };

  const bothAgreed = agreements.terms && agreements.privacy;
  const handleToggleBoth = (checked: boolean) => {
    setAgreements({ terms: checked, privacy: checked });
  };

  return (
    <div className="su-page">
      {/* Header */}
      <header className="su-header">
        <Link to="/" className="su-logo">me<span style={{ color: "#0991B2" }}>Fit</span></Link>
        <Link to="/login" className="su-nav-link">← 로그인</Link>
      </header>

      <main className="su-main">
        {/* Left: Hero + Steps */}
        <section className="su-left">
          <div className="su-badge">● STEP 1 OF 3</div>
          <h1 className="su-title">
            핏이 맞는 나를
            <br />
            <span className="su-accent">완성해가는</span>
            <br />
            여정
          </h1>
          <p className="su-desc">
            이메일 하나로 시작하는 AI 면접 코치.
            <br />
            3단계만 거치면 바로 연습할 수 있어요.
          </p>

          <div className="su-steps">
            <div className="su-step su-step--active">
              <div className="su-step-num su-step-num--active">1</div>
              <div className="su-step-info">
                <span className="su-step-name">이메일로 계정 생성</span>
                <span className="su-step-sub">지금 이 단계예요</span>
              </div>
            </div>
            <div className="su-step">
              <div className="su-step-num">2</div>
              <div className="su-step-info">
                <span className="su-step-name">이메일 인증 완료</span>
                <span className="su-step-sub">메일함을 확인해요</span>
              </div>
            </div>
            <div className="su-step">
              <div className="su-step-num">3</div>
              <div className="su-step-info">
                <span className="su-step-name">프로필 작성 후 면접 시작</span>
                <span className="su-step-sub">직군·경력 입력</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Form Card */}
        <section className="su-right">
          <div className="su-card">
            <h2 className="su-card-title">계정 만들기</h2>
            <p className="su-card-desc">아직 핏이 맞지 않아도 괜찮아요 — 지금 시작해요.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="su-field">
                <label className="su-label" htmlFor="su-name">이름</label>
                <input id="su-name" className="su-input" type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="su-field">
                <label className="su-label" htmlFor="su-email">이메일</label>
                <div className="su-input-wrap">
                  <input id="su-email" className="su-input" type="email" placeholder="hello@mefit.kr" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <span className="su-input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                </div>
              </div>

              <div className="su-field">
                <label className="su-label" htmlFor="su-pw">비밀번호</label>
                <div className="su-input-wrap">
                  <input id="su-pw" className="su-input" type={showPw ? "text" : "password"} placeholder="8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="su-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}>
                    {showPw ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>

              <div className="su-field">
                <label className="su-label" htmlFor="su-pw-confirm">비밀번호 확인</label>
                <div className="su-input-wrap">
                  <input id="su-pw-confirm" className="su-input" type={showPwConfirm ? "text" : "password"} placeholder="다시 입력" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
                  <button type="button" className="su-pw-toggle" onClick={() => setShowPwConfirm(!showPwConfirm)} aria-label={showPwConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}>
                    {showPwConfirm ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>

              <label className="su-agree">
                <input type="checkbox" checked={bothAgreed} onChange={(e) => handleToggleBoth(e.target.checked)} />
                <span><a href="#" className="su-agree-link">이용약관</a> 및 <a href="#" className="su-agree-link">개인정보처리방침</a>에 동의합니다.</span>
              </label>

              {(validationError || error) && (
                <p className="su-error" role="alert">{validationError || error}</p>
              )}

              <button type="submit" className="su-submit" disabled={isLoading}>
                {isLoading ? "처리 중..." : "가입하기 →"}
              </button>
            </form>

            <p className="su-bottom-text">
              이미 계정이 있으신가요? <Link to="/login" className="su-bottom-anchor">로그인 →</Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="su-footer">
        <a href="#">개인정보처리방침</a>
        <a href="#">이용약관</a>
        <a href="#">쿠키</a>
      </footer>

      <style>{SIGNUP_STYLES}</style>
    </div>
  );
}

function EyeOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
