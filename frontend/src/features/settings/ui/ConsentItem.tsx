import { TriangleAlert } from "lucide-react";

interface ConsentItemProps {
  title: string;
  required: boolean;
  description: string;
  version?: string;
  agreedAt?: string;
  checked?: boolean;
  onToggle?: () => void;
}

export function ConsentItem({ title, required, description, version, agreedAt, checked, onToggle }: ConsentItemProps) {
  return (
    <div
      className={`flex gap-3 px-4 py-[14px] bg-white border rounded-[10px] mb-2 last:mb-0 transition-all duration-150 ${
        title.includes("AI")
          ? "border-[rgba(9,145,178,0.3)] bg-[rgba(9,145,178,0.02)]"
          : "border-[#E5E7EB]"
      }`}
    >
      <button
        className={`w-[22px] h-[22px] rounded-[6px] shrink-0 flex items-center justify-center text-[10px] font-extrabold border-none mt-0.5 transition-all duration-200 ${
          title.includes("AI")
            ? checked
              ? "bg-[#0991B2] text-white shadow-[0_2px_8px_rgba(9,145,178,0.3)] cursor-pointer"
              : "bg-[#E6F7FA] text-[#0991B2]"
            : "bg-[#0991B2] text-white shadow-[0_2px_8px_rgba(9,145,178,0.3)] cursor-not-allowed opacity-70"
        }`}
        onClick={onToggle}
        disabled={!title.includes("AI")}
      >
        {checked ? "✓" : "+"}
      </button>
      <div style={{ flex: 1 }}>
        <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
          <span className="font-plex-sans-kr text-[13px] font-bold text-[#0A0A0A]">{title}</span>
          <span className={`text-[10px] font-bold ${required ? "text-[#EF4444]" : "text-[#0991B2]"}`}>
            ({required ? "필수" : "선택"})
          </span>
        </div>
        <p className="text-[12px] text-[#6B7280] leading-[1.55]">{description}</p>
        {version && agreedAt ? (
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0991B2] bg-[#E6F7FA] px-2 py-0.5 rounded-full mt-[5px]">
            {version} · {agreedAt} 동의
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full mt-[5px]">
            {title.includes("AI") ? <><TriangleAlert size={10} /> {version || "재동의 필요"}</> : "동의 정보 없음"}
          </div>
        )}
      </div>
    </div>
  );
}