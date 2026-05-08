interface PasswordChecklistProps {
  password: string;
}

const CHECKS = [
  { label: "8자 이상",   test: (pw: string) => pw.length >= 8 },
  { label: "대문자",     test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "소문자",     test: (pw: string) => /[a-z]/.test(pw) },
  { label: "숫자",       test: (pw: string) => /[0-9]/.test(pw) },
  { label: "특수문자",   test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export function PasswordChecklist({ password }: PasswordChecklistProps) {
  const pw = password ?? "";

  return (
    <div className="flex flex-wrap gap-[6px] mt-[10px]">
      {CHECKS.map(({ label, test }) => {
        const met = pw.length > 0 && test(pw);
        return (
          <span
            key={label}
            className="inline-flex items-center gap-[4px] px-[9px] py-[4px] rounded-full text-[11px] font-semibold transition-all duration-200"
            style={
              met
                ? { background: "#ECFDF5", color: "#059669", border: "1px solid #BBF7D0" }
                : { background: "#F3F4F6", color: "#9CA3AF", border: "1px solid #E5E7EB" }
            }
          >
            {met ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5.2L4 7.2L8 3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <circle cx="5" cy="5" r="3" fill="#D1D5DB" />
              </svg>
            )}
            {label}
          </span>
        );
      })}
    </div>
  );
}
