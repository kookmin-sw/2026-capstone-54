const TRUST_ITEMS = [
  { icon: "🔒", text: "SSL 암호화 결제" },
  { icon: "↩️", text: "언제든 취소" },
  { icon: "🎁", text: "첫 7일 무료" },
  { icon: "🧾", text: "세금계산서 발행" },
  { icon: "🛡️", text: "개인정보 보호" },
];

export function TrustRow() {
  return (
    <div className="flex items-center justify-center gap-[14px] sm:gap-7 flex-wrap max-w-[680px] mx-auto mb-[52px]" style={{ transitionDelay: "130ms" }}>
      {TRUST_ITEMS.map((t) => (
        <div key={t.text} className="flex items-center gap-[7px] text-[13px] font-semibold text-[#6B7280]">
          <span className="text-base">{t.icon}</span> {t.text}
        </div>
      ))}
    </div>
  );
}
