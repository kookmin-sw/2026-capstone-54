import { Link, useNavigate } from "react-router-dom";
import { useJdAddStore, type JdStatus } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

const STATUS_OPTIONS: { value: JdStatus; icon: string; label: string; desc: string }[] = [
  { value: "planned", icon: "📅", label: "지원 예정", desc: "곧 지원할 예정" },
  { value: "saved",   icon: "⭐", label: "관심 저장",  desc: "관심만 저장" },
  { value: "applied", icon: "✅", label: "지원 완료",  desc: "이미 지원함" },
];

const PLATFORMS = [
  { name: "사람인", ok: true },
  { name: "잡코리아", ok: true },
  { name: "원티드", ok: true },
  { name: "링크드인", ok: true },
  { name: "회사 홈페이지", ok: null },
];

const cardCls = "bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]";

export function JdAddPage() {
  const navigate = useNavigate();
  const {
    url, customTitle, status, interviewActive,
    urlValidState, urlAnalysis,
    isSubmitting, isSaving, error,
    setUrl, setCustomTitle, setStatus, setInterviewActive,
    clearError, submit, saveDraft,
  } = useJdAddStore();

  const { user } = useSessionStore();

  const handleSubmit = async () => {
    clearError();
    const jdId = await submit();
    if (jdId) navigate("/jd/analyzing");
  };

  const handleSaveDraft = async () => {
    clearError();
    await saveDraft();
  };

  const fieldStatusCls = () => {
    if (urlValidState === "checking") return "text-[#0991B2]";
    if (urlValidState === "ok") return "text-[#059669]";
    if (urlValidState === "error") return "text-[#DC2626]";
    return "";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[200] py-[14px] px-8 flex justify-center max-sm:py-3 max-sm:px-4">
        <div className="flex items-center justify-between w-full max-w-[1140px] bg-white/[.92] backdrop-blur-[20px] border border-[#E5E7EB] rounded-lg p-[8px_8px_8px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
          <Link to="/home" className="text-[19px] font-black tracking-[-0.3px] text-[#0A0A0A] no-underline">
            me<span style={{ color: "#0991B2" }}>Fit</span>
          </Link>
          <ul className="flex gap-1 list-none">
            <li><Link to="/home" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">홈</Link></li>
            <li><Link to="/jd" className="text-[13px] font-bold text-[#0991B2] bg-[#E6F7FA] no-underline py-2 px-3.5 rounded-lg">채용공고</Link></li>
            <li><Link to="/interview" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">면접 시작</Link></li>
            <li><Link to="/resume" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">이력서</Link></li>
          </ul>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-[13px] font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] cursor-pointer">
            {user?.initial || "U"}
          </div>
        </div>
      </nav>

      <div className="relative max-w-[1140px] mx-auto px-8 pt-[100px] pb-[60px] max-sm:px-4 max-sm:pt-20">
        {/* PAGE HEADER */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5">+ 채용공고 추가</div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">새 채용공고 등록</h1>
            <p className="text-sm text-[#6B7280] mt-1.5">URL만 붙여넣으면 AI가 나머지를 분석해 드려요</p>
          </div>
          <Link to="/jd" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer py-[10px] px-4 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[#F3F4F6] no-underline">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            목록으로
          </Link>
        </div>

        {/* FORM LAYOUT */}
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start max-[900px]:grid-cols-1">

          {/* MAIN FORM */}
          <div>
            <div className={`${cardCls} p-[36px_32px] max-sm:p-[24px_16px]`}>

              {/* URL 섹션 */}
              <section className="mb-8">
                <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ background: "linear-gradient(135deg,#60A5FA,#2563EB)" }}>🔗</span>
                  채용공고 URL
                </div>
                <p className="text-[13px] text-[#6B7280] mb-[18px] ml-9">⚠️정확한 채용공고 페이지 URL을 입력해주세요.</p>

                <div className="mb-5">
                  <div className="flex items-center justify-between text-[13px] font-bold text-[#0A0A0A] mb-2">
                    URL <span className="text-[#0991B2] ml-0.5">*</span>
                    <span className="text-[11px] text-[#6B7280] font-normal">사람인, 잡코리아, 원티드, 링크드인 등</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-base pointer-events-none">🔗</span>
                    <input
                      type="url"
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg py-[13px] pr-4 pl-11 text-sm font-medium text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#D1D5DB]"
                      placeholder="https://www.saramin.co.kr/zf_user/jobs/relay/view?..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      aria-label="채용공고 URL"
                    />
                  </div>

                  {urlValidState !== "idle" && (
                    <div className={`flex items-center gap-1.5 text-[12px] font-semibold mt-1.5 ${fieldStatusCls()}`}>
                      {urlValidState === "checking" && "⟳ URL 확인 중..."}
                      {urlValidState === "ok" && "✓ 유효한 URL입니다"}
                      {urlValidState === "error" && "✗ 올바른 URL을 입력해 주세요"}
                    </div>
                  )}

                  {urlValidState === "ok" && urlAnalysis && (
                    <div className="mt-3 py-[14px] px-4 bg-[#ECFDF5] rounded-lg border border-[#A7F3D0] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-base shrink-0">🏢</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[#6B7280]">{urlAnalysis.company} · {urlAnalysis.domain}</div>
                        <div className="text-sm font-extrabold text-[#0A0A0A] whitespace-nowrap overflow-hidden text-ellipsis">{urlAnalysis.title}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between text-[13px] font-bold text-[#0A0A0A] mb-2">
                    내 식별 제목 (선택)
                    <span className="text-[11px] text-[#6B7280] font-normal">미입력 시 공고 원제목 사용</span>
                  </div>
                  <input
                    type="text"
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg py-[13px] px-4 text-sm font-medium text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#D1D5DB]"
                    placeholder="예: 네이버 백엔드 — 2차 지원"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    aria-label="내 식별 제목"
                  />
                </div>
              </section>

              <div className="h-px bg-[#E5E7EB] my-7" />

              {/* 지원 상태 */}
              <section className="mb-8">
                <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>📌</span>
                  지원 상태
                </div>
                <p className="text-[13px] text-[#6B7280] mb-[18px] ml-9">현재 지원 진행 상태를 선택해 주세요</p>
                <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`py-[14px] px-3 rounded-lg border cursor-pointer text-center transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:border-[#0991B2] ${
                        status === opt.value
                          ? "border-[#0991B2] bg-[#E6F7FA] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                          : "border-[#E5E7EB] bg-white"
                      }`}
                      onClick={() => setStatus(opt.value)}
                      aria-pressed={status === opt.value}
                    >
                      <span className="text-[22px] mb-1.5 block">{opt.icon}</span>
                      <div className={`text-[12px] font-extrabold ${status === opt.value ? "text-[#0991B2]" : "text-[#0A0A0A]"}`}>{opt.label}</div>
                      <div className="text-[10px] text-[#9CA3AF] mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="h-px bg-[#E5E7EB] my-7" />

              {/* 면접 활성화 */}
              <section className="mb-8">
                <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>⚡</span>
                  면접 활성화
                </div>
                <div className="flex items-center justify-between py-[14px] px-4 bg-white border border-[#E5E7EB] rounded-lg">
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-[#0A0A0A]">AI 면접에 포함하기</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">비활성화 시 면접 질문 생성에서 제외됩니다</div>
                  </div>
                  <label className="relative w-11 h-6 shrink-0 cursor-pointer" aria-label="AI 면접 포함">
                    <input
                      type="checkbox"
                      className="opacity-0 w-0 h-0 absolute"
                      checked={interviewActive}
                      onChange={(e) => setInterviewActive(e.target.checked)}
                    />
                    <div
                      className="absolute inset-0 rounded-full transition-[background] duration-[250ms]"
                      style={{ background: interviewActive ? "#0991B2" : "#E5E7EB" }}
                    />
                    <div
                      className="absolute left-[3px] top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-[250ms] pointer-events-none"
                      style={{ transform: interviewActive ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </label>
                </div>
              </section>

              {/* ERROR */}
              {error && (
                <p className="text-[13px] text-[#DC2626] mb-3.5 py-[10px] px-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg" role="alert">{error}</p>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 mt-7 pt-6 border-t border-[#E5E7EB]">
                <Link to="/jd" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer py-[10px] px-4 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[#F3F4F6] no-underline">취소</Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0991B2] bg-[#E6F7FA] border border-[#0991B2] cursor-pointer py-3.5 px-6 rounded-lg transition-all hover:enabled:bg-[#cceef6] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "임시저장"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3.5 px-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "분석 중..." : "채용공고 추가하기"}
                  {!isSubmitting && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:gap-3.5 max-sm:grid-cols-1">
            <div className={`${cardCls} p-[28px_24px] mb-[18px] max-[900px]:mb-0`}>
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>💡</span>
                이렇게 활용해요
              </div>
              {[
                "채용공고 URL을 복사해서 붙여넣으세요",
                "AI가 자동으로 요구 역량과 우대 사항을 분석해요",
                "분석이 완료되면 맞춤 면접 질문이 생성됩니다",
                "이력서와 연결해 더 정밀한 피드백을 받으세요",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 mb-3 text-[13px] text-[#6B7280] leading-[1.6] last:mb-0">
                  <div className="w-[22px] h-[22px] rounded-lg bg-[#E6F7FA] text-[#0991B2] text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-px">{i + 1}</div>
                  {tip}
                </div>
              ))}
            </div>

            <div className={`${cardCls} p-[28px_24px]`}>
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>🌐</span>
                지원 플랫폼
              </div>
              {PLATFORMS.map((p) => (
                <div key={p.name} className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px] last:border-b-0 last:pb-0">
                  <span className="text-[#6B7280] font-semibold">{p.name}</span>
                  {p.ok === true && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[3px] px-2.5 rounded-full bg-[#D1FAE5] text-[#047857]">✓ 지원</span>
                  )}
                  {p.ok === null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[3px] px-2.5 rounded-full bg-[#E6F7FA] text-[#0991B2]">대부분</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
