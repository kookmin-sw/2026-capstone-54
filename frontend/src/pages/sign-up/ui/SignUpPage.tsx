import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/features/auth";
import { useNavigate, Link } from "react-router-dom";
import { getTermsDocumentsApi, getTermsDocumentApi, type TermsDocument } from "@/features/auth/api/termsApi";
import { Modal, PasswordChecklist } from "@/shared/ui";
import { validatePassword } from "@/shared/lib/validatePassword";

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

export function SignUpPage() {
  const navigate = useNavigate();
  const { isLoading, error, signUp, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [terms, setTerms] = useState<TermsDocument[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [agreements, setAgreements] = useState<Record<number, boolean>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    getTermsDocumentsApi().then((data) => {
      setTerms(data);
      setTermsLoading(false);
    });
  }, []);

  const allRequiredAgreed = useMemo(() => {    const requiredIds = terms.filter((t) => t.isRequired).map((t) => t.id);
    return requiredIds.every((id) => agreements[id]);
  }, [terms, agreements]);

  const allAgreed = useMemo(() => {
    return terms.length > 0 && terms.every((t) => agreements[t.id]);
  }, [terms, agreements]);

  const validate = (): string | null => {
    if (!name.trim()) return "이름을 입력해주세요.";
    if (!email.trim()) return "올바른 이메일을 입력해주세요.";
    if (!isValidEmail(email)) return "올바른 이메일을 입력해주세요.";
    const pwError = validatePassword(password);
    if (pwError) return pwError;
    if (!timingSafeEqual(password, passwordConfirm)) return "비밀번호가 일치하지 않습니다.";
    if (!allRequiredAgreed) return "필수 약관에 모두 동의해주세요.";
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
    const agreedTermsIds = terms.filter((t) => agreements[t.id]).map((t) => t.id);
    const ok = await signUp({ name, email, password, termsDocumentIds: agreedTermsIds });
    if (ok) navigate("/verify-email");
  };

  const handleToggleAll = (checked: boolean) => {
    const newAgreements: Record<number, boolean> = {};
    terms.forEach((t) => {
      newAgreements[t.id] = checked;
    });
    setAgreements(newAgreements);
  };

  const handleTermClick = async (termId: number, title: string) => {
    setModalTitle(title);
    setModalOpen(true);
    setModalLoading(true);
    const doc = await getTermsDocumentApi(termId);
    setModalContent(doc?.content ?? null);
    setModalLoading(false);
  };

  const inputClass =
    "w-full py-[13px] px-4 pr-11 bg-white border border-[#E5E7EB] rounded-lg text-[14px] text-[#0A0A0A] font-plex-sans-kr outline-none transition-[border-color] duration-200 placeholder-[#9CA3AF] focus:border-[#0991B2] md:py-[14px]";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="w-full max-w-container mx-auto flex justify-between items-center px-5 pt-5 md:px-10 md:pt-7">
        <Link to="/" className="flex items-center">
          <img src="/logo-korean.png" alt="미핏" className="h-[44px] w-auto md:h-[50px]" />
        </Link>
        <Link
          to="/login"
          className="text-[13px] font-medium text-[#6B7280] no-underline px-4 py-2 border border-[#E5E7EB] rounded-lg transition-[color,background] duration-200 hover:text-[#0A0A0A] hover:bg-[#F9FAFB]"
        >
          ← 로그인
        </Link>
      </header>

      <main className="flex-1 w-full mx-auto px-5 py-8 flex flex-col justify-center gap-8 md:px-10 md:py-12">
        <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-8 md:flex-row md:items-center md:gap-10 lg:gap-12">
        {/* Left: Hero + Steps */}
        <section className="flex flex-col items-center md:flex-1 md:items-start">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] tracking-[0.5px] md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            ● STEP 1 OF 3
          </div>
          <h1 className="font-plex-sans-kr text-[clamp(32px,8vw,48px)] font-black leading-[1.1] text-[#0A0A0A] mb-3 tracking-[-2px] text-center md:text-left md:text-[clamp(36px,3.5vw,48px)]">
            핏이 맞는 나를
            <br />
            <span className="gradient-text">완성해가는</span>
            <br />
            여정
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-[1.7] mb-6 text-center md:text-left md:text-[15px]">
            <span className="hidden md:inline">이메일 하나로 시작하는 AI 면접 코치.<br /></span>
            3단계만 거치면 바로 연습할 수 있어요.
          </p>

          <div className="hidden md:flex md:flex-col md:gap-2 w-full">
            <div className="flex flex-row items-center gap-[14px] text-left px-5 py-[14px] rounded-lg bg-[#0A0A0A] transition-transform duration-200 hover:-translate-y-px">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-white bg-[#0991B2] shrink-0">1</div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-white">이메일로 계정 생성</span>
                <span className="text-[12px] text-white/50">지금 이 단계예요</span>
              </div>
            </div>
            {[
              { num: 2, name: "이메일 인증 완료", sub: "메일함을 확인해요" },
              { num: 3, name: "프로필 작성 후 면접 시작", sub: "직군·경력 입력" },
            ].map((step) => (
              <div key={step.num} className="flex flex-row items-center gap-[14px] text-left px-5 py-[14px] rounded-lg">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-[#6B7280] bg-[#E5E7EB] shrink-0">{step.num}</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#0A0A0A]">{step.name}</span>
                  <span className="text-[12px] text-[#9CA3AF]">{step.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Form Card */}
        <section className="flex justify-center w-full md:flex-1">
          <div className="w-full max-w-[520px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-7 shadow-[var(--sc)] sm:px-7 sm:py-9">
            <h2 className="font-plex-sans-kr text-[22px] font-extrabold text-[#0A0A0A] mb-1.5">계정 만들기</h2>
            <p className="text-[14px] text-[#6B7280] mb-7">아직 핏이 맞지 않아도 괜찮아요 — 지금 시작해요.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4 md:mb-[18px]">
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="su-name">이름</label>
                <input id="su-name" className={inputClass.replace("pr-11 ", "")} type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="mb-4 md:mb-[18px]">
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="su-email">이메일</label>
                <div className="relative">
                  <input id="su-email" className={inputClass} type="email" placeholder="hello@mefit.kr" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none flex items-center justify-center" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                </div>
              </div>

              <div className="mb-4 md:mb-[18px]">
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="su-pw">비밀번호</label>
                <div className="relative">
                  <input id="su-pw" className={inputClass} type={showPw ? "text" : "password"} placeholder="대·소문자·숫자·특수문자 포함 8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#9CA3AF] p-1 flex items-center justify-center hover:text-[#6B7280]" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}>
                    {showPw ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
                <PasswordChecklist password={password} />
              </div>

              <div className="mb-4 md:mb-[18px]">
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5" htmlFor="su-pw-confirm">비밀번호 확인</label>
                <div className="relative">
                  <input id="su-pw-confirm" className={inputClass} type={showPwConfirm ? "text" : "password"} placeholder="다시 입력" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#9CA3AF] p-1 flex items-center justify-center hover:text-[#6B7280]" onClick={() => setShowPwConfirm(!showPwConfirm)} aria-label={showPwConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}>
                    {showPwConfirm ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>

              {termsLoading ? (
                <div className="text-[13px] text-[#6B7280] mb-4">약관을 불러오는 중...</div>
              ) : (
                <div className="mb-4">
                  <label className="flex items-start gap-[10px] text-[13px] text-[#374151] cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      className="w-[17px] h-[17px] accent-[#0991B2] rounded-[3px] cursor-pointer shrink-0 mt-[1px]"
                      checked={allAgreed}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                    />
                    <span className="font-bold">모든 약관에 동의합니다.</span>
                  </label>

                  {terms.map((term) => (
                    <label key={term.id} className="flex items-start gap-[10px] text-[13px] text-[#374151] cursor-pointer mb-2 ml-5">
                      <input
                        type="checkbox"
                        className="w-[17px] h-[17px] accent-[#0991B2] rounded-[3px] cursor-pointer shrink-0 mt-[1px]"
                        checked={agreements[term.id] || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setValidationError(null);
                          setAgreements((prev) => ({ ...prev, [term.id]: checked }));
                        }}
                      />
                      <span
                        className="font-bold cursor-pointer hover:underline"
                        onClick={() => handleTermClick(term.id, term.title)}
                      >
                        {term.isRequired && <span className="text-[#EF4444] mr-1">[필수]</span>}
                        {term.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {(validationError || error) && (
                <p className="text-[13px] text-[#DC2626] mb-[14px] px-[14px] py-[10px] bg-[#FEF2F2] border border-[#FECACA] rounded-lg" role="alert">
                  {validationError || error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-[15px] bg-[#0A0A0A] text-white font-plex-sans-kr text-[15px] font-bold border-none rounded-lg cursor-pointer transition-opacity duration-200 hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed md:py-4 md:text-[16px]"
                disabled={isLoading || !name.trim() || !isValidEmail(email) || validatePassword(password) !== null || !timingSafeEqual(password, passwordConfirm) || !allRequiredAgreed}
              >
                {isLoading ? "처리 중..." : "가입하기 →"}
              </button>
            </form>

            <p className="text-center text-[13px] text-[#6B7280] mt-5">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="text-[#0991B2] font-bold no-underline hover:underline">로그인 →</Link>
            </p>
          </div>
        </section>
        </div>
            <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        size="lg"
      >
        {modalLoading ? (
          <div className="text-[14px] text-[#6B7280] py-8 text-center">약관을 불러오는 중...</div>
        ) : modalContent ? (
          <div
            className="prose prose-sm max-w-none text-[14px] text-[#0A0A0A] leading-[1.7]"
            dangerouslySetInnerHTML={{ __html: modalContent }}
          />
        ) : (
          <div className="text-[14px] text-[#6B7280] py-8 text-center">약관 내용을 불러올 수 없습니다.</div>
        )}
      </Modal>
</main>   </div>
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
