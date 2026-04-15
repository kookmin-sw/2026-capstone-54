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
    <div className="flex items-center justify-between py-[14px] px-4 bg-white border border-[#E5E7EB] rounded-lg">
      {(label || description) && (
        <div className="flex-1">
          {label && <div className="text-[13px] font-bold text-[#0A0A0A]">{label}</div>}
          {description && <div className="text-[11px] text-[#6B7280] mt-0.5">{description}</div>}
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
        <div
          className="absolute inset-0 rounded-full transition-[background] duration-[250ms]"
          style={{ background: checked ? "#0991B2" : "#E5E7EB" }}
        />
        <div
          className="absolute left-[3px] top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-[250ms] pointer-events-none"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </label>
    </div>
  );
}
