/** 아이콘과 라벨과 설명이 있는 옵션 목록에서 하나를 선택하는 카드 그룹. */
interface StatusCardOption<T = string> {
  value: T;
  icon: string;
  label: string;
  desc: string;
}

interface StatusCardProps<T = string> {
  options: StatusCardOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  columns?: 1 | 2 | 3;
}

export function StatusCard<T extends string | number = string>({ options, selected, onSelect, columns = 3 }: StatusCardProps<T>) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-2 max-sm:grid-cols-1`}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={`py-[14px] px-3 rounded-lg border cursor-pointer text-center transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:border-[#0991B2] ${
            selected === opt.value
              ? "border-[#0991B2] bg-[#E6F7FA] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
              : "border-[#E5E7EB] bg-white"
          }`}
          onClick={() => onSelect(opt.value)}
          aria-pressed={selected === opt.value}
        >
          <span className="text-[22px] mb-1.5 block">{opt.icon}</span>
          <div className={`text-[12px] font-extrabold ${selected === opt.value ? "text-[#0991B2]" : "text-[#0A0A0A]"}`}>
            {opt.label}
          </div>
          <div className="text-[10px] text-[#9CA3AF] mt-0.5">{opt.desc}</div>
        </button>
      ))}
    </div>
  );
}
