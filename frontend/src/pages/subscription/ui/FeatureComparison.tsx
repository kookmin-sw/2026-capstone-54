const COMPARE_ROWS: {
  icon: string;
  label: string;
  free: "yes" | "no" | string;
  pro: "yes" | string;
}[] = [
  { icon: "🎥", label: "꼬리질문 방식 면접", free: "yes", pro: "yes" },
  { icon: "🎬", label: "전체 프로세스 방식 면접", free: "no", pro: "yes" },
  { icon: "📄", label: "이력서 등록", free: "최대 3개", pro: "무제한" },
  { icon: "🏢", label: "채용공고 등록", free: "최대 5개", pro: "무제한" },
  { icon: "📊", label: "AI 리뷰 리포트", free: "yes", pro: "yes" },
  { icon: "👁️", label: "시선 추적 분석", free: "yes", pro: "yes" },
  { icon: "⚡", label: "실전 모드", free: "no", pro: "yes" },
  { icon: "🎞️", label: "분석 리포트 녹화 영상 확인", free: "no", pro: "yes" },
  { icon: "🤫", label: "침묵 감지 분석", free: "yes", pro: "yes" },
  { icon: "🗂️", label: "면접 세션 아카이브", free: "최근 7일", pro: "전체" },
  { icon: "🔥", label: "스트릭 & 보상", free: "yes", pro: "yes" },
  { icon: "💬", label: "고객 지원", free: "이메일", pro: "우선 지원" },
];

export function FeatureComparison() {
  return (
    <div className="max-w-container-md mx-auto mb-[52px]" style={{ transitionDelay: "60ms" }}>
      <h2 className="text-[24px] font-black tracking-[-0.4px] mb-[18px] text-center text-[#0A0A0A]">
        상세 기능 비교
      </h2>
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden shadow-[var(--sc)]">
        <div className="grid grid-cols-[1fr_90px_90px] sm:grid-cols-[1fr_130px_130px] bg-white px-[14px] sm:px-6 py-[14px] border-b border-[#E5E7EB]">
          <div className="text-[11px] font-bold text-[#9CA3AF] tracking-[.5px] uppercase">기능</div>
          <div className="text-[13px] font-black text-center text-[#0A0A0A]">Free</div>
          <div className="text-[13px] font-black text-center text-white bg-[#0991B2] rounded-lg px-[10px] py-1">Pro</div>
        </div>
        {COMPARE_ROWS.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_90px_90px] sm:grid-cols-[1fr_130px_130px] px-[14px] sm:px-6 py-3 border-b border-[#E5E7EB] last:border-b-0 transition-colors hover:bg-[rgba(9,145,178,.03)]"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0A0A0A]">
              <span className="text-sm w-5">{row.icon}</span>
              {row.label}
            </div>
            <div className="flex items-center justify-center text-xs font-semibold text-[#6B7280]">
              {row.free === "yes" ? (
                <span className="w-5 h-5 rounded-full bg-[#059669] text-white inline-flex items-center justify-center text-[9px] font-extrabold">✓</span>
              ) : row.free === "no" ? (
                <span className="w-5 h-5 rounded-full bg-[#E5E7EB] text-[#9CA3AF] inline-flex items-center justify-center text-[9px] font-extrabold">✕</span>
              ) : (
                row.free
              )}
            </div>
            <div className="flex items-center justify-center text-xs font-bold text-[#0991B2]">
              {row.pro === "yes" ? (
                <span className="w-5 h-5 rounded-full bg-[#0991B2] text-white inline-flex items-center justify-center text-[9px] font-extrabold">✓</span>
              ) : (
                row.pro
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
