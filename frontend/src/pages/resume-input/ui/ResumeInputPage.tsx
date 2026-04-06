import { useNavigate } from "react-router-dom";
import { useResumeInputStore } from "@/features/resume";

const MAX_CONTENT = 5000;
const MAX_TITLE = 40;
const PROGRESS_THRESHOLD = 200;

const CHIPS = [
  { key: "fe", icon: "🎨", label: "프론트엔드" },
  { key: "be", icon: "⚙️", label: "백엔드" },
  { key: "fs", icon: "🛠", label: "풀스택" },
  { key: "ds", icon: "✏️", label: "디자이너" },
  { key: "pm", icon: "📊", label: "PM" },
  { key: "nw", icon: "🌱", label: "신입" },
];

export function ResumeInputPage() {
  const navigate = useNavigate();
  const {
    title, content, detectedTags, previewSummary,
    showPreview, showCharWarn, isSubmitting, showSuccess, error,
    setTitle, setContent, applyTemplate, submit, closeSuccess,
  } = useResumeInputStore();

  const contentLen = content.length;
  const titleLen = title.length;
  const progressPct = Math.min((contentLen / PROGRESS_THRESHOLD) * 100, 100);
  const canSubmit = contentLen > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!title.trim()) {
      document.getElementById("ri-title-input")?.focus();
      return;
    }
    if (canSubmit) submit();
  };

  return (
    <div className="bg-white font-inter text-[#0A0A0A] min-h-screen pb-[100px] antialiased">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-[100] bg-white/92 backdrop-blur-[24px] border-b border-[#E5E7EB]">
        <div className="max-w-container-xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-[10px]">
            <button
              className="w-9 h-9 rounded-[14px] bg-[#F9FAFB] border border-[#E5E7EB] cursor-pointer flex items-center justify-center shadow-[var(--sw)] text-[#0A0A0A] text-[18px] transition-[background] duration-150 hover:bg-[#F3F4F6]"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >←</button>
            <a href="/home" className="font-inter text-[20px] font-black text-[#0A0A0A] no-underline">
              me<span className="text-[#0991B2]">Fit</span>
            </a>
          </div>
          <span className="font-inter text-[16px] font-extrabold text-[#0A0A0A] md:text-[18px]">이력서 등록</span>
          <div style={{ width: 36 }} />
        </div>
      </nav>

      {/* ── STEP BAR ── */}
      <div className="bg-white/50 backdrop-blur-[12px] border-b border-[#E5E7EB]">
        <div className="max-w-container-xl mx-auto px-6 py-[14px] flex items-center justify-center gap-2 md:gap-3 md:py-4 md:px-8">
          <div className="flex items-center gap-[6px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 bg-[#059669] text-white">✓</div>
            <span className="text-[12px] font-bold text-[#9CA3AF] md:text-[13px]">방식 선택</span>
          </div>
          <div className="h-0.5 w-7 bg-[#059669] rounded-sm shrink-0 md:w-12" />
          <div className="flex items-center gap-[6px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 bg-[#0991B2] text-white animate-[ri-pulse_2s_infinite]">2</div>
            <span className="text-[12px] font-bold text-[#0991B2] md:text-[13px]">직접 입력</span>
          </div>
          <div className="h-0.5 w-7 bg-[#E5E7EB] rounded-sm shrink-0 md:w-12" />
          <div className="flex items-center gap-[6px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 bg-[#F3F4F6] text-[#9CA3AF]">3</div>
            <span className="text-[12px] font-bold text-[#9CA3AF] md:text-[13px]">AI 분석</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-container-xl mx-auto px-6 pt-10 md:px-8 md:pt-12">
        <div className="grid grid-cols-1 gap-6 md:gap-8 min-[900px]:grid-cols-[1.3fr_1fr] min-[900px]:items-start">

          {/* ── LEFT FORM ── */}
          <div className="animate-[ri-fadeUp_0.45s_ease_both]">

            {/* Method toggle */}
            <div className="flex bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] p-1 mb-6 shadow-[var(--sw)]">
              <button
                className="flex-1 py-[11px] border-none rounded-[11px] font-inter text-[13px] font-bold cursor-pointer transition-all duration-200 text-[#6B7280] bg-transparent hover:text-[#0A0A0A] md:text-[14px] md:py-3"
                onClick={() => navigate("/resume/upload")}
              >📎 파일 업로드</button>
              <button className="flex-1 py-[11px] border-none rounded-[11px] font-inter text-[13px] font-bold cursor-pointer transition-all duration-200 bg-[#0A0A0A] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] md:text-[14px] md:py-3">
                ✏️ 직접 입력
              </button>
            </div>

            <h1 className="font-inter text-[clamp(22px,3.5vw,32px)] font-black text-[#0A0A0A] mb-[6px] leading-[1.25]">
              경력을 자유롭게<br />적어주세요
            </h1>
            <p className="text-[14px] text-[#6B7280] leading-[1.6] mb-[22px]">
              한 줄도 괜찮아요. 내용이 많을수록 더 정확한 면접 질문이 만들어져요 😊
            </p>

            {/* Title field */}
            <div className="mb-4">
              <label className="text-[12px] font-bold text-[#6B7280] mb-[7px] flex items-center justify-between tracking-[0.05em]" htmlFor="ri-title-input">
                <span>이력서 제목 <span className="text-[#DC2626]">*</span></span>
                <span className="text-[11px] font-semibold text-[#9CA3AF]">{titleLen}/{MAX_TITLE}</span>
              </label>
              <input
                id="ri-title-input"
                className={`w-full px-[18px] py-[14px] rounded-[10px] border bg-[#F9FAFB] font-inter text-[14px] font-medium text-[#0A0A0A] outline-none transition-[border-color,box-shadow] duration-200 placeholder-[#D1D5DB] focus:border-[#0991B2] focus:bg-white focus:shadow-[0_0_0_3px_rgba(9,145,178,0.12)] md:text-[15px] md:px-5 md:py-[15px] ${error && !title.trim() ? "border-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.1)]" : "border-[#E5E7EB]"}`}
                type="text"
                placeholder="예: 신입 프론트엔드 자기소개"
                maxLength={MAX_TITLE}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Template chips */}
            <div className="mb-4">
              <span className="text-[12px] font-bold text-[#6B7280] mb-2 block">💡 빠른 템플릿으로 시작하기</span>
              <div className="flex gap-[7px] flex-wrap">
                {CHIPS.map((c) => (
                  <button
                    key={c.key}
                    className="text-[12px] font-bold px-[15px] py-[7px] rounded-full border border-[#E5E7EB] cursor-pointer bg-[#F9FAFB] text-[#0991B2] shadow-[var(--sw)] transition-all duration-150 hover:bg-[#E6F7FA] hover:border-[#0991B2] active:scale-[0.92] md:text-[13px] md:px-[17px] md:py-2"
                    onClick={() => applyTemplate(c.key)}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative mb-[14px]">
              <textarea
                className="w-full min-h-[clamp(200px,28vh,320px)] p-[18px] rounded-xl border border-[#E5E7EB] resize-y bg-[#F9FAFB] font-inter text-[14px] leading-[1.75] text-[#0A0A0A] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#D1D5DB] placeholder:text-[13px] placeholder:leading-[1.7] focus:border-[#0991B2] focus:bg-white focus:shadow-[0_0_0_3px_rgba(9,145,178,0.12)] md:text-[15px] md:min-h-[clamp(240px,33vh,400px)]"
                maxLength={MAX_CONTENT}
                placeholder={`예시)\n경력: 스타트업 백엔드 개발자 3년\n기술: Python, Django, PostgreSQL, Redis, AWS\n학력: 컴퓨터공학과 졸업 (2019~2023)\n\n주요 업무:\n- 월 500만 DAU 서비스의 API 설계 및 개발\n- 결제 시스템 도입 및 PG사 연동\n\n자기소개:\n기술적 문제 해결에 열정이 있으며 팀 소통을 중시합니다.`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <span className="absolute bottom-3 right-[14px] text-[11px] font-semibold text-[#9CA3AF] bg-white/90 rounded-full px-[9px] py-0.5 pointer-events-none">
                {contentLen.toLocaleString()} / 5,000
              </span>
            </div>

            {/* Char warning */}
            {showCharWarn && (
              <div className="text-[12px] text-[#D97706] font-semibold px-[14px] py-[9px] rounded-[10px] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] mb-3 animate-[ri-fadeUp_0.3s_ease_both]">
                ⚠️ 50자 이상 작성하면 더 정확한 질문이 만들어져요!
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-[12px] text-[#DC2626] font-semibold px-[14px] py-[9px] rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] mb-3">
                {error}
              </div>
            )}

            {/* Live preview */}
            {showPreview && (
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] p-[18px] mb-[14px] shadow-[var(--sc)] animate-[ri-fadeUp_0.35s_ease_both]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-inter text-[14px] font-extrabold text-[#0A0A0A]">🤖 AI 실시간 미리보기</span>
                  <span className="flex items-center gap-[5px] text-[11px] font-bold text-[#059669]">
                    <span className="w-[7px] h-[7px] rounded-full bg-[#059669] animate-[ri-liveDot_2s_infinite]" />
                    Live
                  </span>
                </div>
                <div className="flex gap-[6px] flex-wrap mb-[10px]">
                  {detectedTags.length === 0 ? (
                    <span className="text-[12px] text-[#9CA3AF]">기술 스택을 입력하면 태그가 표시돼요</span>
                  ) : (
                    <>
                      {detectedTags.slice(0, 6).map((t, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-bold px-[11px] py-1 rounded-full bg-[#E6F7FA] text-[#0991B2] animate-[ri-pop_0.3s_ease_both]"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >{t}</span>
                      ))}
                      {detectedTags.length > 6 && (
                        <span className="text-[11px] font-bold px-[11px] py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF] animate-[ri-pop_0.3s_ease_both]">
                          +{detectedTags.length - 6}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="text-[12px] text-[#6B7280] leading-[1.6] font-medium">{previewSummary}</div>
              </div>
            )}

            <button
              className="block w-full text-center font-inter text-[13px] text-[#9CA3AF] font-semibold py-[14px] cursor-pointer bg-none border-none underline underline-offset-2 transition-[color] duration-200 hover:text-[#6B7280]"
              onClick={() => navigate("/interview/setup")}
            >
              이력서 없이 면접 시작하기 →
            </button>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="flex flex-col gap-4 animate-[ri-fadeUp_0.45s_ease_0.1s_both] min-[900px]:sticky min-[900px]:top-20">

            {/* Stats card */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[20px] p-5 shadow-[var(--sc)]">
              <div className="font-inter text-[14px] font-extrabold text-[#0A0A0A] mb-3">📊 작성 현황</div>
              {[
                { label: "작성 글자 수", val: `${contentLen}자` },
                { label: "감지된 기술 스택", val: `${detectedTags.length}개` },
                { label: "완성도", val: `${Math.min(Math.round(contentLen / PROGRESS_THRESHOLD * 100), 100)}%` },
              ].map((row, i, arr) => (
                <div key={row.label} className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
                  <span className="text-[12px] text-[#6B7280] font-semibold">{row.label}</span>
                  <span className="font-inter text-[14px] font-extrabold text-[#0A0A0A]">{row.val}</span>
                </div>
              ))}
            </div>

            {/* Hint card */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[20px] p-5 shadow-[var(--sc)]">
              <div className="flex items-center gap-[9px] mb-[14px]">
                <div className="w-8 h-8 rounded-[10px] bg-[#E6F7FA] border border-[rgba(9,145,178,0.2)] flex items-center justify-center text-[15px] shrink-0">💡</div>
                <span className="font-inter text-[14px] font-extrabold text-[#0A0A0A]">이렇게 작성하면 더 좋아요</span>
              </div>
              <div className="flex flex-col gap-[10px]">
                {[
                  { dot: "🎯", text: "구체적인 숫자나 성과를 포함하면 질문 깊이가 달라져요" },
                  { dot: "🛠", text: "기술 스택을 구체적으로 (React 18, TypeScript 5 등)" },
                  { dot: "📝", text: "자유 형식이라 형식에 구애받지 않아도 돼요" },
                  { dot: "🔒", text: "회사명 마스킹해도 분석에 지장 없어요" },
                ].map((h, i) => (
                  <div key={i} className="flex items-start gap-[10px] text-[12px] text-[#6B7280] leading-[1.55] font-medium">
                    <div className="w-[22px] h-[22px] rounded-lg bg-[#E6F7FA] flex items-center justify-center text-[12px] shrink-0 mt-[1px]">{h.dot}</div>
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample card */}
            <div className="bg-gradient-to-br from-[rgba(6,182,212,0.1)] to-[rgba(9,145,178,0.05)] rounded-[20px] p-[18px] border border-[rgba(9,145,178,0.12)]">
              <div className="font-inter text-[14px] font-extrabold text-[#0991B2] mb-[10px]">✍️ 작성 예시</div>
              <pre className="font-inter text-[12px] text-[#6B7280] leading-[1.7] font-medium whitespace-pre-wrap">{`경력: 프론트엔드 2년 (스타트업)\n기술: React, TypeScript, Next.js\n학력: 컴공 졸업 (2022)\n\n- Lighthouse 45→92점 성능 개선\n- 디자인 시스템 구축\n- 코드 리뷰 문화 도입`}</pre>
            </div>

          </div>
        </div>
      </main>

      {/* ── BOTTOM CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white/95 backdrop-blur-[24px] border-t border-[#E5E7EB] px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] md:px-8 md:pt-[14px]">
        <div className="max-w-container-xl mx-auto flex items-center gap-4">
          <div className="flex-1 hidden md:block">
            <div className="flex justify-between mb-[5px]">
              <span className="text-[11px] text-[#9CA3AF] font-semibold">작성 완성도</span>
              <span className="font-inter text-[11px] font-extrabold text-[#0991B2]">{contentLen}자</span>
            </div>
            <div className="h-[5px] bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#0991B2] transition-[width] duration-300 ease-in-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            className="shrink-0 px-7 py-[15px] border-none rounded-[16px] cursor-pointer font-inter text-[15px] font-black bg-[#0A0A0A] text-white shadow-[var(--sb)] transition-opacity duration-150 flex items-center gap-2 whitespace-nowrap max-[767px]:flex-1 max-[767px]:justify-center hover:enabled:opacity-85 active:enabled:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed md:text-[16px] md:px-10"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <><span className="w-[18px] h-[18px] rounded-full border-2 border-white/35 border-t-white animate-[ri-spin_0.7s_linear_infinite]" />저장 중...</>
            ) : contentLen > 0 ? (
              "✅  이력서 저장하기"
            ) : (
              "✏️ 내용을 입력해주세요"
            )}
          </button>
        </div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-[400] bg-black/25 backdrop-blur-[8px] flex items-center justify-center p-6"
          onClick={closeSuccess}
        >
          <div
            className="bg-white rounded-[28px] px-7 py-9 text-center max-w-[400px] w-full shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-[ri-slideUp_0.4s_cubic-bezier(0.4,0,0.2,1)_both]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[64px] block mb-[14px]">🎉</span>
            <div className="font-inter text-[24px] font-black text-[#0A0A0A] mb-2">이력서 저장 완료!</div>
            <div className="text-[14px] text-[#6B7280] leading-[1.65] mb-6">
              AI가 지금 내용을 분석하고 있어요.<br />분석이 끝나면 알려드릴게요 😊
            </div>
            <button
              className="w-full py-[15px] border-none rounded-[16px] cursor-pointer font-inter text-[15px] font-black bg-[#0A0A0A] text-white shadow-[var(--sb)] mb-[10px] transition-opacity duration-200 hover:opacity-85"
              onClick={() => navigate("/resume")}
            >
              이력서 목록 보기
            </button>
            <button
              className="w-full py-[15px] border border-[#0991B2] rounded-[16px] cursor-pointer font-inter text-[14px] font-bold bg-[#E6F7FA] text-[#0991B2] transition-[background] duration-200 hover:bg-[#cceef6]"
              onClick={() => navigate("/interview/setup")}
            >
              바로 면접 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
