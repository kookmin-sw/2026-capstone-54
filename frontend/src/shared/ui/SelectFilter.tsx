interface SelectFilterOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  value: string;
  options: SelectFilterOption[];
  onChange: (value: string) => void;
}

export function SelectFilter({ value, options, onChange }: SelectFilterProps) {
  return (
    <div className="inline-flex items-center bg-[#F3F4F6] rounded-full p-[3px] gap-[2px]">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all whitespace-nowrap cursor-pointer border-none ${
              isActive
                ? "bg-white text-[#0991B2] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                : "bg-transparent text-[#6B7280] hover:text-[#374151]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
