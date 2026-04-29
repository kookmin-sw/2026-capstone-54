import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { requestPasswordResetApi } from "@/features/auth/api/authApi";

function SentView({ email, onRetry }: { email: string; onRetry: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-full bg-[#E6F7FA] flex items-center justify-center mx-auto mb-4">
        <Mail size={24} className="text-[#0991B2]" />
      </div>
      <p className="text-[15px] font-bold text-[#0A0A0A] mb-2">이메일을 확인해주세요</p>
      <p className="text-[13px] text-[#6B7280] mb-1"><span className="font-semibold text-[#0A0A0A]">{email}</span></p>
      <p className="text-[13px] text-[#6B7280] mb-6">으로 비밀번호 재설정 링크를 발송했어요.</p>
      <button type="button" className="w-full py-[13px] text-[13px] font-semibold text-[#6B7280] bg-white border border-[#E5E7EB] rounded-lg cursor-pointer transition-[color,background] duration-200 hover:text-[#0A0A0A] hover:bg-[#F3F4F6]" onClick={onRetry}>
        다른 이메일로 재시도
      </button>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일을 입력해주세요.");
      return;
    }
    setIsLoading(true);
    const result = await requestPasswordResetApi(email);
    setIsLoading(false);
    if (result.success) setSent(true);
    else setError(result.message);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <header className="w-full max-w-container flex justify-between items-center px-5 pt-5 md:px-10 md:pt-7">
        <Link to="/" className="flex items-center">
          <img src="/logo-korean.png" alt="미핏" className="h-[44px] w-auto md:h-[50px]" />
        </Link>
        <Link to="/login" className="text-[13px] font-medium text-[#6B7280] no-underline px-4 py-2 border border-[#E5E7EB] rounded-lg transition-[color,background] duration-200 hover:text-[#0A0A0A] hover:bg-[#F9FAFB]">
          로그인 →
        </Link>
      </header>

      <main className="w-full max-w-content px-5 flex flex-col items-center md:max-w-container md:px-10">
        <section className="text-center pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">비밀번호 찾기</div>
          <h1 className="font-plex-sans-kr text-[clamp(32px,9vw,48px)] font-black leading-[1.08] text-[#0A0A0A] mb-3 tracking-[-2px] md:text-[clamp(36px,5vw,52px)] md:mb-4">
            비밀번호를<br /><span className="gradient-text">재설정해요</span>
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-[1.7] md:text-[15px]">가입한 이메일로 재설정 링크를 보내드려요.</p>
        </section>

        <section className="w-full flex justify-center">
          <div className="w-full max-w-[480px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-7 shadow-[var(--sc)] sm:px-7 sm:py-9">
            {sent ? <SentView email={email} onRetry={() => { setSent(false); setEmail(""); }} /> : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4 md:mb-[18px]">
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="fp-email">이메일</label>
                  <div className="relative">
                    <input id="fp-email" className="w-full py-[13px] px-4 pr-11 bg-white border border-[#E5E7EB] rounded-lg text-[14px] text-[#0A0A0A] font-plex-sans-kr outline-none transition-[border-color] duration-200 placeholder-[#9CA3AF] focus:border-[#0991B2] md:py-[14px]" type="email" placeholder="가입한 이메일을 입력하세요" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none flex items-center"><Mail size={16} /></span>
                  </div>
                </div>
                {error && <p className="text-[13px] text-[#DC2626] mb-[14px] px-[14px] py-[10px] bg-[#FEF2F2] border border-[#FECACA] rounded-lg" role="alert">{error}</p>}
                <button type="submit" className="w-full py-[15px] bg-[#0A0A0A] text-white font-plex-sans-kr text-[15px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed md:py-4 md:text-[16px]" disabled={isLoading}>
                  {isLoading ? "발송 중..." : "재설정 링크 보내기 →"}
                </button>
                <p className="text-center text-[13px] text-[#6B7280] mt-5">
                  비밀번호가 기억나셨나요?{" "}
                  <Link to="/login" className="text-[#0991B2] font-bold no-underline hover:underline">로그인 →</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-12 pb-8 flex gap-5 md:mt-16 md:pb-10">
        {["개인정보처리방침", "이용약관", "쿠키"].map((item) => (
          <a key={item} href="#" className="text-[11px] text-[#9CA3AF] no-underline transition-[color] duration-200 hover:text-[#6B7280]">{item}</a>
        ))}
      </footer>
    </div>
  );
}
