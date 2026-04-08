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
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-container flex justify-between items-center px-5 pt-5 md:px-10 md:pt-7">
        <Link to="/" className="flex items-center">
          <img src="/logo-korean.png" alt="미핏" className="h-[44px] w-auto md:h-[50px]" />
        </Link>
        <Link
          to="/sign-up"
          className="text-[13px] font-medium text-[#6B7280] no-underline px-4 py-2 border border-[#E5E7EB] rounded-lg transition-[color,background] duration-200 hover:text-[#0A0A0A] hover:bg-[#F9FAFB]"
        >
          회원가입 →
        </Link>
      </header>

      <main className="w-full max-w-content px-5 flex flex-col items-center md:max-w-container md:px-10">
        {/* Hero */}
        <section className="text-center pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            로그인
          </div>
          <h1 className="font-inter text-[clamp(32px,9vw,48px)] font-black leading-[1.08] text-[#0A0A0A] mb-3 tracking-[-2px] md:text-[clamp(36px,5vw,52px)] md:mb-4">
            다시 만나서
            <br />
            <span className="gradient-text">반가워요</span>
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-[1.7] md:text-[15px]">미핏과 함께 면접 준비를 이어가세요.</p>
        </section>

        {/* Form Card */}
        <section className="w-full flex justify-center">
          <div className="w-full max-w-[480px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-7 shadow-[var(--sc)] sm:px-7 sm:py-9">
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4 md:mb-[18px]">
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="li-email">이메일</label>
                <div className="relative">
                  <input
                    id="li-email"
                    className="w-full py-[13px] px-4 pr-11 bg-white border border-[#E5E7EB] rounded-lg text-[14px] text-[#0A0A0A] font-inter outline-none transition-[border-color] duration-200 placeholder-[#9CA3AF] focus:border-[#0991B2] md:py-[14px]"
                    type="email"
                    placeholder="hello@mefit.kr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none flex items-center justify-center" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                </div>
              </div>

              <div className="mb-4 md:mb-[18px]">
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="li-pw">비밀번호</label>
                <div className="relative">
                  <input
                    id="li-pw"
                    className="w-full py-[13px] px-4 pr-11 bg-white border border-[#E5E7EB] rounded-lg text-[14px] text-[#0A0A0A] font-inter outline-none transition-[border-color] duration-200 placeholder-[#9CA3AF] focus:border-[#0991B2] md:py-[14px]"
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#9CA3AF] p-1 flex items-center justify-center hover:text-[#6B7280]"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {(validationError || error) && (
                <p className="text-[13px] text-[#DC2626] mb-[14px] px-[14px] py-[10px] bg-[#FEF2F2] border border-[#FECACA] rounded-lg" role="alert">
                  {validationError || error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-[15px] bg-[#0A0A0A] text-white font-inter text-[15px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed md:py-4 md:text-[16px]"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "로그인 →"}
              </button>
            </form>

            <p className="text-center text-[13px] text-[#6B7280] mt-5">
              아직 계정이 없으신가요?{" "}
              <Link to="/sign-up" className="text-[#0991B2] font-bold no-underline hover:underline">
                회원가입 →
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-12 pb-8 flex gap-5 md:mt-16 md:pb-10">
        {["개인정보처리방침", "이용약관", "쿠키"].map((item) => (
          <a key={item} href="#" className="text-[11px] text-[#9CA3AF] no-underline transition-[color] duration-200 hover:text-[#6B7280]">
            {item}
          </a>
        ))}
      </footer>
    </div>
  );
}
