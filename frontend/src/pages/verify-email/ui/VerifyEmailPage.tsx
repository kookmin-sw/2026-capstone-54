import { useState, useRef } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useAuthStore } from "@/features/auth";
import { Link, useNavigate } from "react-router-dom";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, isVerifying, isResending, error, resendVerification, verifyCode, logout, clearError } = useAuthStore();
  const [resent, setResent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = user?.email ?? "hello@mefit.kr";

  const handleResend = async () => {
    setResent(false);
    clearError();
    const ok = await resendVerification();
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
    const ok = await verifyCode(fullCode);
    if (ok) navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full max-w-container mx-auto flex justify-between items-center px-5 pt-5 md:px-10 md:pt-7">
        <Link to="/" className="flex items-center">
          <img src="/logo-korean.png" alt="미핏" className="h-[44px] w-auto md:h-[50px]" />
        </Link>
        <button
          type="button"
          className="text-[13px] font-medium text-[#6B7280] px-4 py-2 bg-none border border-[#E5E7EB] rounded-lg cursor-pointer font-plex-sans-kr transition-[color,background] duration-200 hover:text-[#0A0A0A] hover:bg-[#F9FAFB] flex items-center gap-1.5"
          onClick={handleLogout}
        >
          <LogOut size={14} /> 로그아웃
        </button>
      </header>

      <main className="flex-1 w-full mx-auto px-5 py-8 flex flex-col justify-center gap-8 md:px-10 md:py-12">
        <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-8 md:flex-row md:items-center md:gap-10 lg:gap-12">
        {/* Left */}
        <section className="flex flex-col items-center md:flex-1 md:items-start">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] self-center md:self-start md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            ● STEP 2 OF 3
          </div>
          <h1 className="font-plex-sans-kr text-[clamp(32px,8vw,48px)] font-black leading-[1.1] text-[#0A0A0A] mb-3 tracking-[-2px] text-center md:text-left md:text-[clamp(36px,3.5vw,48px)]">
            인증 메일을
            <br />
            <span className="gradient-text">확인</span>해주세요
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-[1.7] mb-6 text-center md:text-left md:text-[15px]">
            이메일 인증을 완료해야
            <br className="hidden md:block" />
            모든 기능을 이용할 수 있어요.
          </p>

          <div className="hidden md:flex md:flex-col md:gap-2 w-full">
            {/* Done step */}
            <div className="flex flex-row items-center gap-[14px] text-left px-5 py-[14px] rounded-lg opacity-60">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-white bg-[#0A0A0A] shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-[#0A0A0A]">이메일로 계정 생성</span>
                <span className="text-[12px] text-[#9CA3AF]">완료했어요</span>
              </div>
            </div>
            {/* Active step */}
            <div className="flex flex-row items-center gap-[14px] text-left px-5 py-[14px] rounded-lg">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-[#EF4444] bg-[#FEE2E2] shrink-0">
                <span className="text-[18px] font-black">!</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-bold text-[#EF4444]">이메일 인증 대기 중</span>
                <span className="text-[12px] text-[#EF4444]">인증이 필요해요</span>
              </div>
            </div>
            {/* Pending step */}
            <div className="flex flex-row items-center gap-[14px] text-left px-5 py-[14px] rounded-lg">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-[#6B7280] bg-[#E5E7EB] shrink-0">3</div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-[#0A0A0A]">프로필 작성 후 면접 시작</span>
                <span className="text-[12px] text-[#9CA3AF]">직군·경력 입력</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Card */}
        <section className="flex justify-center w-full md:flex-1">
          <div className="w-full max-w-[520px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-7 shadow-[var(--sc)] text-center sm:px-7 sm:py-9">
            {/* Lock icon */}
            <div className="inline-block relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E6F7FA] to-[#D1FAE5] flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" fill="#F59E0B" opacity="0.85"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="#92400E"/>
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#EF4444"/>
                  <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">!</text>
                </svg>
              </div>
            </div>

            <h2 className="font-plex-sans-kr text-[22px] font-extrabold text-[#0A0A0A] mb-2">이메일 인증이 필요해요</h2>
            <p className="text-[14px] text-[#6B7280] leading-[1.7] mb-6">
              회원가입 시 입력한 이메일로 인증 코드를 보냈어요.
              <br />
              코드를 입력하면 모든 기능을 자유롬게 이용할 수 있어요.
            </p>

            {/* Email display */}
            <div className="flex items-center justify-center gap-[10px] bg-white border border-[#E5E7EB] rounded-lg px-5 py-[14px] mb-5 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="font-plex-sans-kr text-[15px] font-bold text-[#0A0A0A] truncate" title={email}>{email}</span>
            </div>

            {/* Code input */}
            <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  className="w-12 h-14 text-center font-plex-sans-kr text-[22px] font-extrabold text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded-lg outline-none transition-[border-color] duration-200 placeholder-[#D1D5DB] focus:border-[#0991B2]"
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`인증 코드 ${i + 1}번째 자리`}
                />
              ))}
            </div>

            {error && (
              <p className="text-[13px] text-[#DC2626] mb-[14px] px-[14px] py-[10px] bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-center" role="alert">
                {error}
              </p>
            )}

            {/* Verify button */}
            <button
              type="button"
              className="w-full py-[15px] bg-[#0991B2] text-white font-plex-sans-kr text-[15px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 mb-5 hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed md:py-4 md:text-[16px]"
              onClick={handleVerify}
              disabled={isVerifying || fullCode.length < 6}
            >
              {isVerifying ? "확인 중..." : "인증 완료 →"}
            </button>

            {/* Resend label */}
            <p className="text-[12px] text-[#9CA3AF] text-left mb-2">인증 메일 재전송</p>

            {/* Resend button */}
            <button
              type="button"
              className="w-full py-[15px] bg-[#0A0A0A] text-white font-plex-sans-kr text-[15px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 flex items-center justify-center gap-[10px] mb-3 hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed md:py-4 md:text-[16px]"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "발송 중..." : (
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
              <p className="text-[13px] text-[#059669] mb-3 font-semibold" role="status">인증 메일이 재발송되었습니다.</p>
            )}

            {/* Action buttons */}
            <button
              type="button"
              className="w-full py-[14px] bg-white text-[#374151] font-plex-sans-kr text-[14px] font-semibold border border-[#E5E7EB] rounded-lg cursor-pointer transition-[color,background] duration-200 mb-2 hover:text-[#0A0A0A] hover:bg-[#F3F4F6] flex items-center justify-center gap-2"
              onClick={handleLogout}
            >
              <LogIn size={15} /> 다른 계정으로 로그인
            </button>

            <p className="text-[13px] text-[#6B7280] mt-4 leading-[1.6]">
              메일이 안 보인다면 <strong>스팸함</strong>을 확인하거나,
              <br />
              <a href="mailto:mefit.contact@gmail.com?subject=[이메일 인증 문의]" className="text-[#0A0A0A] font-bold underline hover:text-[#0991B2]">고객센터에 문의</a>해 주세요.
            </p>
          </div>
        </section>
        </div>
      </main>

      <footer className="w-full max-w-container mx-auto px-5 py-6 flex justify-center gap-5 md:px-10 md:py-8">
        {["개인정보처리방침", "이용약관", "쿠키"].map((item) => (
          <a key={item} href="#" className="text-[11px] text-[#9CA3AF] no-underline transition-[color] duration-200 hover:text-[#6B7280]">
            {item}
          </a>
        ))}
      </footer>
    </div>
  );
}
