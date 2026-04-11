const inputCls = "w-full py-[10px] px-[13px] rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[13px] text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,.1)] placeholder:text-[#9CA3AF]";

interface JdDirectTabProps {
  directCompany: string;
  directRole: string;
  directStage: string;
  directUrl: string;
  onDirectField: (field: string, value: string) => void;
}

export function JdDirectTab({ directCompany, directRole, directStage, directUrl, onDirectField }: JdDirectTabProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-2.5 max-sm:grid-cols-1">
        <div>
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">기업명</div>
          <input className={inputCls} placeholder="예: 카카오뱅크" value={directCompany} onChange={(e) => onDirectField("directCompany", e.target.value)} />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">지원 직무</div>
          <input className={inputCls} placeholder="예: 백엔드 개발자" value={directRole} onChange={(e) => onDirectField("directRole", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
        <div>
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">면접 단계</div>
          <select className={inputCls + " cursor-pointer"} value={directStage} onChange={(e) => onDirectField("directStage", e.target.value)}>
            <option>1차 면접</option><option>2차 면접</option><option>임원 면접</option><option>최종 면접</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">채용공고 URL (선택)</div>
          <input className={inputCls} placeholder="https://..." value={directUrl} onChange={(e) => onDirectField("directUrl", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
