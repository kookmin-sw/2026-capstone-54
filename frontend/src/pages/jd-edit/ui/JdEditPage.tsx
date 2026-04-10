import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useJdEditStore, type JdStatus } from "@/features/jd";
import { Navigation } from "@/shared/ui";

const STATUS_OPTIONS: { value: JdStatus; icon: string; label: string; desc: string }[] = [
  { value: "planned", icon: "📅", label: "지원 예정", desc: "곧 지원할 예정" },
  { value: "saved",   icon: "⭐", label: "관심 저장", desc: "관심만 저장" },
  { value: "applied", icon: "✅", label: "지원 완료", desc: "이미 지원함" },
];

const cardCls = "bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]";

export function JdEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    jd, customTitle, status, interviewActive,
    isLoading, isSubmitting, error,
    fetchJd, setCustomTitle, setStatus, setInterviewActive,
    submit, deleteJd, clearError, reset,
  } = useJdEditStore();

  useEffect(() => {
    reset();
    if (id) fetchJd(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async () => {
    clearError();
    const ok = await submit();
    if (ok) navigate(`/jd/detail/${jd?.id}`);
  };

  const handleDelete = async () => {
    if (!confirm("채용공고를 삭제하면 연결된 정보도 모두 삭제됩니다. 계속하시겠어요?")) return;
    const ok = await deleteJd();
    if (ok) navigate("/jd");
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation title="채용공고" />
        <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
          <div className="text-center py-20 text-[15px] text-[#6B7280]">불러오는 중...</div>
        </div>
      </div>
    );
  }

  /* ── Error / Not Found ── */
  if (!jd) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation title="채용공고" />
        <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
          <div className="text-center py-[60px] flex flex-col items-center text-[15px] text-[#DC2626]">
            <p>{error ?? "채용공고를 찾을 수 없습니다."}</p>
            <Link to="/jd" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3.5 px-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 no-underline mt-4">목록으로</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation title="채용공고" />

      <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6">
          <Link to="/jd" className="text-[#6B7280] no-underline transition-colors hover:text-[#0991B2]">채용공고</Link>
          <span className="opacity-50">›</span>
          <Link to={`/jd/detail/${jd.id}`} className="text-[#6B7280] no-underline transition-colors hover:text-[#0991B2]">
            {jd.company} {jd.title.split("—")[0].trim()}
          </Link>
          <span className="opacity-50">›</span>
          <span className="text-[#0A0A0A] font-semibold">수정</span>
        </div>

        {/* PAGE HEADER */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-lg mb-2.5">✏️ 공고 수정</div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">채용공고 수정</h1>
            <p className="text-sm text-[#6B7280] mt-1.5">공고 정보와 지원 상태를 업데이트하세요</p>
          </div>
        </div>

        {/* COMPANY CHIP */}
        <div className="flex items-center gap-3.5 mb-7">
          <div className="flex items-center gap-2.5 py-[10px] px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
              style={{ background: jd.companyColor }}
            >
              {jd.companyInitial}
            </div>
            <div className="text-[13px] font-bold text-[#0A0A0A]">{jd.company}</div>
          </div>
          <span className="text-[12px] text-[#9CA3AF]">URL 원문은 변경할 수 없어요</span>
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-6 items-start max-[900px]:grid-cols-1">

          {/* ── MAIN FORM ── */}
          <div className="animate-[jde-fadeUp_.5s_ease_both]">
            <div className={`${cardCls} p-[36px_32px] max-sm:p-[24px_16px]`}>

              {/* 원본 URL (읽기 전용) */}
              <section className="mb-8">
                <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0 bg-[rgba(9,145,178,0.1)]">🔗</span>
                  원본 URL
                </div>
                <div className="mb-5">
                  <input
                    className="w-full bg-[rgba(9,145,178,0.04)] border border-[#F3F4F6] rounded-lg py-[13px] px-4 text-sm font-medium text-[#9CA3AF] outline-none cursor-not-allowed focus:border-[#F3F4F6] focus:shadow-none"
                    type="text"
                    value={jd.originalUrl}
                    readOnly
                    aria-label="원본 URL (읽기 전용)"
                  />
                  <div className="text-[12px] text-[#9CA3AF] mt-1.5 flex items-center gap-1">🔒 원본 URL은 수정할 수 없습니다. 새 공고로 추가해 주세요.</div>
                </div>
              </section>

              <div className="h-px bg-[#E5E7EB] my-7" />

              {/* 식별 제목 */}
              <section className="mb-8">
                <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ background: "linear-gradient(135deg,#60A5FA,#2563EB)" }}>✏️</span>
                  내 식별 제목
                </div>
                <p className="text-[13px] text-[#6B7280] mb-[18px] ml-9">이 공고를 구별하기 위한 나만의 제목을 설정하세요</p>
                <div className="mb-5">
                  <div className="flex items-center justify-between text-[13px] font-bold text-[#0A0A0A] mb-2">
                    식별 제목
                    <span className="text-[11px] text-[#6B7280] font-normal">미입력 시 공고 원제목 표시</span>
                  </div>
                  <input
                    type="text"
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg py-[13px] px-4 text-sm font-medium text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#D1D5DB]"
                    placeholder={jd.title}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    aria-label="식별 제목"
                  />
                </div>
              </section>

              <div className="h-px bg-[#E5E7EB] my-7" />

              {/* 지원 상태 */}
              <section className="mb-8">
                <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>📌</span>
                  지원 상태
                </div>
                <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`py-[14px] px-3 rounded-lg border cursor-pointer text-center transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:border-[#0991B2] ${
                        status === opt.value
                          ? "border-[#0991B2] bg-[#E6F7FA] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]"
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

              {/* AI 면접 포함 */}
              <section className="mb-8">
                <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>⚡</span>
                  AI 면접 포함 설정
                </div>
                <div className="flex items-center justify-between py-[14px] px-4 bg-white border border-[#E5E7EB] rounded-lg">
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-[#0A0A0A]">AI 면접에 포함하기</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">비활성화하면 이 공고는 면접 질문 생성에서 제외됩니다</div>
                  </div>
                  <label className="relative w-11 h-6 shrink-0 cursor-pointer" aria-label="AI 면접 포함">
                    <input
                      type="checkbox"
                      className="opacity-0 w-0 h-0 absolute"
                      checked={interviewActive}
                      onChange={(e) => setInterviewActive(e.target.checked)}
                    />
                    <div
                      className="absolute inset-0 rounded-lg transition-[background] duration-[250ms]"
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
                <Link to={`/jd/detail/${jd.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer py-[10px] px-4 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[#F3F4F6] no-underline">취소</Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3.5 px-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "저장 중..." : "변경사항 저장"}
                  {!isSubmitting && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── SIDE ── */}
          <div className="animate-[jde-fadeUp_.5s_ease_.08s_both] flex flex-col gap-[18px] max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:gap-3.5 max-sm:grid-cols-1">

            {/* 현재 정보 */}
            <div className={`${cardCls} p-[22px_20px]`}>
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>ℹ️</span> 현재 정보
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px]">
                <span className="text-[#6B7280] font-semibold">회사</span>
                <span className="text-[#0A0A0A] font-medium text-right">{jd.company}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px]">
                <span className="text-[#6B7280] font-semibold">원제목</span>
                <span className="text-[12px] text-[#0A0A0A] font-medium text-right max-w-[160px] leading-[1.4]">{jd.title}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px]">
                <span className="text-[#6B7280] font-semibold">등록일</span>
                <span className="text-[#0A0A0A] font-medium text-right">{jd.registeredAt}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-[#6B7280] font-semibold">면접 횟수</span>
                <span className="text-[#0A0A0A] font-medium text-right">{jd.interviewCount}회</span>
              </div>
            </div>

            {/* 위험 영역 */}
            <div className="bg-[#F9FAFB] border-[1.5px] border-[rgba(185,28,28,0.15)] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] p-[22px_20px]">
              <div className="text-[13px] font-extrabold text-[#B91C1C] mb-3 flex items-center gap-1.5">⚠️ 위험 영역</div>
              <p className="text-[12px] text-[#6B7280] leading-[1.6] mb-3.5">
                채용공고를 삭제하면 연결된 지원 현황 정보도 함께 삭제됩니다. 이 작업은 되돌릴 수 없어요.
              </p>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 w-full py-3 rounded-lg border-[1.5px] border-[rgba(185,28,28,0.2)] bg-[rgba(185,28,28,0.06)] text-[#B91C1C] text-[13px] font-bold cursor-pointer transition-all hover:enabled:bg-[rgba(185,28,28,0.12)] hover:enabled:border-[rgba(185,28,28,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                🗑 채용공고 삭제
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
