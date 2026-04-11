/** 아이콘과 굵은 제목과 설명으로 구성된 안내 행. 환경 점검 팁 등에 사용한다. */
interface InfoTipProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export function InfoTip({ icon, title, description, className = "" }: InfoTipProps) {
  return (
    <div className={`flex items-start gap-[9px] p-[10px_12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg ${className}`}>
      <span className="text-[13px] shrink-0 mt-px">{icon}</span>
      <div className="text-[12px] text-[#6B7280] leading-[1.45]">
        <strong className="text-[#0A0A0A] font-bold">{title}</strong>
        {description}
      </div>
    </div>
  );
}
