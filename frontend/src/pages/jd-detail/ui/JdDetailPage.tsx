import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useJdDetailStore, type JdStatus } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

const STATUS_OPTIONS: { value: JdStatus; icon: string; label: string; sub: string }[] = [
  { value: "planned", icon: "📅", label: "지원 예정",  sub: "곧 지원할 예정" },
  { value: "saved",   icon: "⭐", label: "관심 저장",  sub: "관심만 저장" },
  { value: "applied", icon: "✅", label: "지원 완료",  sub: "이미 지원 완료" },
];

const STATUS_LABEL: Record<JdStatus, string> = {
  planned: "지원 예정",
  saved:   "관심 저장",
  applied: "지원 완료",
};

const cardCls = "bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)]";

export function JdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jd, isLoading, isUpdating, error, fetchJd, updateStatus, deleteJd, clearError } =
    useJdDetailStore();

  useEffect(() => {
    if (id) fetchJd(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("채용공고를 삭제하시겠어요?")) return;
    const ok = await deleteJd();
    if (ok) navigate("/jd");
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="max-w-container-lg mx-auto px-8 pt-[100px] pb-[60px] max-sm:px-4 max-sm:pt-20">
          <div className="text-center py-20 text-[15px] text-[#6B7280]">불러오는 중...</div>
        </div>
      </div>
    );
  }

  /* ── Error / Not Found ── */
  if (error || !jd) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="max-w-container-lg mx-auto px-8 pt-[100px] pb-[60px] max-sm:px-4 max-sm:pt-20">
          <div className="text-center py-[60px] flex flex-col items-center text-[15px] text-[#DC2626]">
            <p>{error ?? "채용공고를 찾을 수 없습니다."}</p>
            <Link to="/jd" className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3 px-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 no-underline mt-4">
              목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div className="max-w-container-lg mx-auto px-8 pt-[100px] pb-[60px] max-sm:px-4 max-sm:pt-20">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6">
          <Link to="/jd" className="text-[#6B7280] no-underline transition-colors hover:text-[#0991B2]">채용공고</Link>
          <span className="opacity-50">›</span>
          <span className="text-[#0A0A0A] font-semibold">{jd.company} {jd.title.split("—")[0].trim()}</span>
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-6 items-start max-[900px]:grid-cols-1">
          {/* ── MAIN ── */}
          <div className="animate-[jdd-fadeUp_.5s_ease_both] flex flex-col gap-[18px]">

            {/* HERO CARD */}
            <div className={`${cardCls} p-[36px_32px] relative overflow-hidden max-sm:p-[24px_16px]`}>
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(9,145,178,0.05)] to-[rgba(6,182,212,0.03)] pointer-events-none" />
              <div className="flex items-center gap-3.5 mb-[18px] relative">
                <div
                  className="w-[54px] h-[54px] rounded-lg flex items-center justify-center text-[22px] font-black text-white shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                  style={{ background: jd.companyColor }}
                >
                  {jd.companyInitial}
                </div>
                <div>
                  <div className="text-[13px] text-[#6B7280] font-semibold mb-0.5">{jd.company} · {jd.source}</div>
                  <div className="text-[clamp(18px,2.5vw,26px)] font-black tracking-[-0.5px] leading-[1.2] text-[#0A0A0A] relative">{jd.title}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 relative">
                <span className="inline-flex items-center gap-[5px] text-[12px] font-semibold py-[5px] px-3 rounded-full bg-white text-[#6B7280] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">🏢 {jd.company}</span>
                <span className="inline-flex items-center gap-[5px] text-[12px] font-semibold py-[5px] px-3 rounded-full bg-white text-[#6B7280] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">📍 {jd.location}</span>
                <span className="inline-flex items-center gap-[5px] text-[12px] font-semibold py-[5px] px-3 rounded-full bg-white text-[#6B7280] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">💼 {jd.experience}</span>
                <span className="inline-flex items-center gap-[5px] text-[12px] font-semibold py-[5px] px-3 rounded-full bg-white text-[#6B7280] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">🕐 {jd.period}</span>
                <span className="inline-flex items-center gap-[5px] text-[12px] font-semibold py-[5px] px-3 rounded-full bg-[#E6F7FA] text-[#0991B2] border border-[#0991B2] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  {STATUS_OPTIONS.find((o) => o.value === jd.status)?.icon} {STATUS_LABEL[jd.status]}
                </span>
              </div>

              <div className="flex gap-2.5 mt-5 relative flex-wrap">
                <Link to="/interview" className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3 px-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 no-underline whitespace-nowrap">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  면접 시작하기
                </Link>
                <Link to={`/jd/edit/${jd.id}`} className="inline-flex items-center gap-2 text-[13px] font-bold text-[#0991B2] bg-[#E6F7FA] border border-[#0991B2] cursor-pointer py-3 px-5 rounded-lg transition-[background] hover:bg-[#cceef6] no-underline whitespace-nowrap">✏️ 수정</Link>
                <a href={jd.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer py-[10px] px-4 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[#F3F4F6] no-underline">
                  🔗 원문 보기
                </a>
                <button type="button" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer py-[10px] px-4 rounded-lg transition-all hover:text-[#DC2626] hover:bg-[#FEF2F2]" onClick={handleDelete}>
                  🗑 삭제
                </button>
              </div>
            </div>

            {/* 직무 요약 */}
            <div className={`${cardCls} p-[28px_32px] max-sm:p-[20px_16px]`}>
              <div className="text-base font-black text-[#0A0A0A] mb-[18px] flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>📄</span>
                직무 요약
              </div>
              <p className="text-sm text-[#6B7280] leading-[1.8] py-4 px-[18px] bg-[rgba(9,145,178,0.04)] rounded-lg border-l-[3px] border-l-[#0991B2]">{jd.summary}</p>
            </div>

            {/* 필수 자격 요건 */}
            <div className={`${cardCls} p-[28px_32px] max-sm:p-[20px_16px]`}>
              <div className="text-base font-black text-[#0A0A0A] mb-[18px] flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>⚡</span>
                필수 자격 요건
              </div>
              <div className="flex flex-col gap-2">
                {jd.requirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-[10px_14px] bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-[#0A0A0A] leading-[1.6]">
                    <div className={`w-5 h-5 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold mt-px ${
                      req.level === "required"
                        ? "bg-gradient-to-br from-[#34D399] to-[#059669] text-white shadow-[0_2px_6px_rgba(5,150,105,0.25)]"
                        : "bg-[#E6F7FA] text-[#0991B2]"
                    }`}>✓</div>
                    {req.text}
                  </div>
                ))}
              </div>
            </div>

            {/* 우대 사항 */}
            <div className={`${cardCls} p-[28px_32px] max-sm:p-[20px_16px]`}>
              <div className="text-base font-black text-[#0A0A0A] mb-[18px] flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0" style={{ background: "linear-gradient(135deg,#FCD34D,#D97706)" }}>⭐</span>
                우대 사항
              </div>
              <div className="grid grid-cols-2 gap-2 max-[900px]:grid-cols-1">
                {jd.preferences.map((pref, i) => (
                  <div key={i} className="p-[10px_14px] bg-white border border-[#E5E7EB] rounded-lg text-[12px] font-semibold text-[#6B7280] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
                    {pref}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── SIDE ── */}
          <div className="animate-[jdd-fadeUp_.5s_ease_.08s_both] flex flex-col gap-[18px] max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:gap-3.5 max-sm:grid-cols-1">

            {/* 지원 상태 변경 */}
            <div className={`${cardCls} p-[22px_20px]`}>
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>📌</span> 지원 상태 변경
                {isUpdating && <span className="text-[11px] text-[#6B7280] font-normal ml-auto">저장 중...</span>}
              </div>
              <div className="flex flex-col gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`flex items-center gap-2.5 p-[12px_14px] rounded-lg cursor-pointer border-[1.5px] bg-white transition-all w-full text-left hover:enabled:border-[#0991B2] hover:enabled:bg-[#F0FAFD] disabled:opacity-60 disabled:cursor-not-allowed ${
                      jd.status === opt.value ? "border-[#0991B2] bg-[#E6F7FA]" : "border-[#E5E7EB]"
                    }`}
                    onClick={() => { clearError(); updateStatus(opt.value); }}
                    disabled={isUpdating}
                    aria-pressed={jd.status === opt.value}
                  >
                    <span className="text-[18px] shrink-0">{opt.icon}</span>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      jd.status === opt.value ? "border-[#0991B2] bg-[#0991B2]" : "border-[#E5E7EB]"
                    }`}>
                      {jd.status === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#0A0A0A]">{opt.label}</div>
                      <div className="text-[11px] text-[#6B7280] mt-px">{opt.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 빠른 액션 */}
            <div className={`${cardCls} p-[22px_20px]`}>
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>🚀</span> 빠른 액션
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/interview" className="flex items-center gap-2.5 p-[12px_14px] rounded-lg border border-[#E5E7EB] bg-white cursor-pointer text-[13px] font-semibold text-[#0A0A0A] transition-all no-underline hover:bg-[#F9FAFB] hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>🎤</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-extrabold">꼬리질문 면접</div>
                    <div className="text-[11px] text-[#6B7280] mt-px">심화 질문 집중 연습</div>
                  </div>
                  <span className="text-[#9CA3AF] text-base">›</span>
                </Link>
                <Link to="/interview" className="flex items-center gap-2.5 p-[12px_14px] rounded-lg border border-[#E5E7EB] bg-white cursor-pointer text-[13px] font-semibold text-[#0A0A0A] transition-all no-underline hover:bg-[#F9FAFB] hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>📋</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-extrabold">전체 프로세스</div>
                    <div className="text-[11px] text-[#6B7280] mt-px">처음부터 끝까지 연습</div>
                  </div>
                  <span className="text-[#9CA3AF] text-base">›</span>
                </Link>
                <Link to={`/jd/edit/${jd.id}`} className="flex items-center gap-2.5 p-[12px_14px] rounded-lg border border-[#E5E7EB] bg-white cursor-pointer text-[13px] font-semibold text-[#0A0A0A] transition-all no-underline hover:bg-[#F9FAFB] hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0" style={{ background: "linear-gradient(135deg,#60A5FA,#2563EB)" }}>✏️</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-extrabold">공고 정보 수정</div>
                    <div className="text-[11px] text-[#6B7280] mt-px">제목·상태 변경</div>
                  </div>
                  <span className="text-[#9CA3AF] text-base">›</span>
                </Link>
              </div>
            </div>

            {/* 등록 정보 */}
            <div className={`${cardCls} p-[22px_20px]`}>
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>ℹ️</span> 등록 정보
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px]">
                <span className="text-[#6B7280] font-semibold">등록일</span>
                <span className="text-[#0A0A0A] font-medium text-right">{jd.registeredAt}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px]">
                <span className="text-[#6B7280] font-semibold">분석 완료</span>
                <span className="text-[#0A0A0A] font-medium text-right">
                  {jd.analyzed
                    ? <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[3px] px-2.5 rounded-full bg-[#D1FAE5] text-[#047857]">✓ 완료</span>
                    : <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[3px] px-2.5 rounded-full bg-[#FEF3C7] text-[#D97706]">분석 중</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px]">
                <span className="text-[#6B7280] font-semibold">면접 횟수</span>
                <span className="text-[#0A0A0A] font-medium text-right">{jd.interviewCount}회 진행</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-[#6B7280] font-semibold">AI 활성화</span>
                <span className="text-[#0A0A0A] font-medium text-right">
                  {jd.interviewActive
                    ? <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[3px] px-2.5 rounded-full bg-[#D1FAE5] text-[#047857]">활성</span>
                    : <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[3px] px-2.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">비활성</span>}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function NavBar() {
  const { user } = useSessionStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] py-[14px] px-8 flex justify-center max-sm:py-3 max-sm:px-4">
      <div className="flex items-center justify-between w-full max-w-container-lg bg-white/[.92] backdrop-blur-[20px] border border-[#E5E7EB] rounded-lg p-[8px_8px_8px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
        <Link to="/home" className="flex items-center">
          <img src="/logo-korean.png" alt="미핏" className="h-[34px] w-auto" />
        </Link>
        <ul className="flex gap-1 list-none">
          <li><Link to="/home" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">홈</Link></li>
          <li><Link to="/jd" className="text-[13px] font-bold text-[#0991B2] bg-[#E6F7FA] no-underline py-2 px-3.5 rounded-lg">채용공고</Link></li>
          <li><Link to="/interview" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">면접 시작</Link></li>
          <li><Link to="/resume" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">이력서</Link></li>
        </ul>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-[13px] font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer">
          {user?.initial || "U"}
        </div>
      </div>
    </nav>
  );
}
