import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { confirmPasswordResetApi } from "@/features/auth/api/authApi";
import { PasswordChecklist } from "@/shared/ui";

const INPUT_CLS = "w-full py-[13px] px-4 pr-11 bg-white border border-[#E5E7EB] rounded-lg text-[14px] text-[#0A0A0A] font-plex-sans-kr outline-none transition-[border-color] duration-200 placeholder-[#9CA3AF] focus:border-[#0991B2] md:py-[14px]";
const TOGGLE_BTN_CLS = "absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#9CA3AF] p-1 flex items-center justify-center hover:text-[#6B7280]";

function SecureInput({ id, value, show, placeholder, onChange, onToggle }: {
  id: string; value: string; show: boolean; placeholder: string;
  onChange: (v: string) => void; onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input id={id} className={INPUT_CLS} type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className={TOGGLE_BTN_CLS} onClick={onToggle} aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function InvalidTokenView() {
  return (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
        <KeyRound size={24} className="text-[#DC2626]" />
      </div>
      <p className="text-[14px] font-semibold text-[#DC2626] mb-4">유효하지 않은 링크입니다.</p>
      <Link to="/login" className="text-[13px] text-[#0991B2] font-bold no-underline hover:underline">로그인 페이지로 이동 →</Link>
    </div>
  );
}

function SuccessView({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
        <KeyRound size={24} className="text-[#059669]" />
      </div>
      <p className="text-[15px] font-bold text-[#0A0A0A] mb-2">비밀번호가 변경되었습니다!</p>
      <p className="text-[13px] text-[#6B7280] mb-6">새 비밀번호로 로그인해 주세요.</p>
      <button type="button" className="w-full py-[15px] bg-[#0A0A0A] text-white font-plex-sans-kr text-[15px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 hover:opacity-85" onClick={onLogin}>
        로그인하러 가기 →
      </button>
    </div>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (!/[A-Z]/.test(pw)) return "비밀번호에 대문자를 포함해야 합니다.";
    if (!/[a-z]/.test(pw)) return "비밀번호에 소문자를 포함해야 합니다.";
    if (!/[0-9]/.test(pw)) return "비밀번호에 숫자를 포함해야 합니다.";
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) return "비밀번호에 특수문자를 포함해야 합니다.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const pwError = validatePassword(newPw);
    if (pwError) { setError(pwError); return; }
    if (newPw !== confirmPw) { setError("비밀번호가 일치하지 않습니다."); return; }
    setIsLoading(true);
    const result = await confirmPasswordResetApi({ token, newPassword: newPw });
    setIsLoading(false);
    if (result.success) setSuccess(true);
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
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">비밀번호 재설정</div>
          <h1 className="font-plex-sans-kr text-[clamp(32px,9vw,48px)] font-black leading-[1.08] text-[#0A0A0A] mb-3 tracking-[-2px] md:text-[clamp(36px,5vw,52px)] md:mb-4">
            새 비밀번호를<br /><span className="gradient-text">설정하세요</span>
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-[1.7] md:text-[15px]">새로운 비밀번호를 입력하면 바로 로그인할 수 있어요.</p>
        </section>

        <section className="w-full flex justify-center">
          <div className="w-full max-w-[480px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-7 shadow-[var(--sc)] sm:px-7 sm:py-9">
            {!token ? <InvalidTokenView /> : success ? <SuccessView onLogin={() => navigate("/login")} /> : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4 md:mb-[18px]">
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="rp-pw">새 비밀번호</label>
                  <SecureInput id="rp-pw" value={newPw} show={showPw} placeholder="대·소문자·숫자·특수문자 포함 8자 이상" onChange={setNewPw} onToggle={() => setShowPw(!showPw)} />
                  <PasswordChecklist password={newPw} />
                </div>
                <div className="mb-4 md:mb-[18px]">
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="rp-pw-confirm">비밀번호 확인</label>
                  <SecureInput id="rp-pw-confirm" value={confirmPw} show={showConfirmPw} placeholder="비밀번호를 다시 입력하세요" onChange={setConfirmPw} onToggle={() => setShowConfirmPw(!showConfirmPw)} />
                </div>
                {error && <p className="text-[13px] text-[#DC2626] mb-[14px] px-[14px] py-[10px] bg-[#FEF2F2] border border-[#FECACA] rounded-lg" role="alert">{error}</p>}
                <button type="submit" className="w-full py-[15px] bg-[#0A0A0A] text-white font-plex-sans-kr text-[15px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed md:py-4 md:text-[16px]" disabled={isLoading || validatePassword(newPw) !== null || !confirmPw || newPw !== confirmPw}>
                  {isLoading ? "변경 중..." : "비밀번호 변경하기 →"}
                </button>
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
