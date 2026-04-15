/** on/off를 전환하는 스위치. label과 description을 함께 표시할 수 있다. */
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-[14px] px-4 bg-white border border-mefit-gray-200 rounded-lg">
      {(label || description) && (
        <div className="flex-1">
          {label && <div className="text-sm font-bold text-mefit-black">{label}</div>}
          {description && <div className="text-2xs text-mefit-gray-500 mt-0.5">{description}</div>}
        </div>
      )}
      <label className="relative w-11 h-6 shrink-0 cursor-pointer" aria-label={label}>
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0 absolute"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {/* 트랙 */}
        <div className={`absolute inset-0 rounded-full transition-colors duration-[250ms] ${
          checked ? "bg-mefit-primary" : "bg-mefit-gray-200"
        }`} />
        {/* 썸 */}
        <div className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-toggle transition-transform duration-[250ms] pointer-events-none ${
          checked ? "translate-x-5" : "translate-x-0"
        }`} />
      </label>
    </div>
  );
}
