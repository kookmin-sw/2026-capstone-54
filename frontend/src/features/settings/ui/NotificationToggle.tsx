interface NotificationToggleProps {
  title: string;
  desc: string;
  checked: boolean;
  onClick: () => void;
}

export function NotificationToggle({ title, desc, checked, onClick }: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between px-4 py-[13px] bg-white border border-[#E5E7EB] rounded-[10px] mb-2 last:mb-0 transition-all duration-150 cursor-default hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-px">
      <div>
        <div className="font-plex-sans-kr text-[13px] font-bold mb-0.5 text-[#0A0A0A]">{title}</div>
        <div className="text-[11px] text-[#6B7280] leading-[1.45]">{desc}</div>
      </div>
      <button
        className={`w-10 h-[22px] rounded-full cursor-pointer relative transition-[background] duration-[250ms] shrink-0 border-none after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-[0_1px_4px_rgba(0,0,0,0.15)] after:transition-transform after:duration-[250ms] after:[cubic-bezier(0.34,1.56,0.64,1)] ${checked ? "bg-[#0991B2] after:translate-x-[18px]" : "bg-[#E5E7EB]"}`}
        onClick={onClick}
        aria-label={title}
      />
    </div>
  );
}