const PAYMENT_METHODS = [
  { emoji: "💚", name: "네이버페이", share: "51.5%" },
  { emoji: "💛", name: "카카오페이", share: "25.1%" },
  { emoji: "💙", name: "토스페이", share: "13.2%" },
  { emoji: "💳", name: "신용·체크카드", share: "기타" },
];

export function PaymentMethods() {
  return (
    <div className="max-w-container-md mx-auto mb-12 text-center" style={{ transitionDelay: "100ms" }}>
      <h2 className="text-xl font-black tracking-[-0.3px] mb-1.5 text-[#0A0A0A]">결제 수단</h2>
      <p className="text-[13px] text-[#6B7280] mb-5">익숙한 방법으로 간편하게 결제하세요</p>
      <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
        {PAYMENT_METHODS.map((pm) => (
          <div
            key={pm.name}
            className="flex flex-col items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-[14px] sm:px-[22px] py-[14px] sm:py-[18px] shadow-[var(--sc)] transition-all duration-200 cursor-pointer min-w-[100px] sm:min-w-[120px] hover:shadow-[var(--sc-hover)] hover:-translate-y-[3px] hover:border-[rgba(9,145,178,.3)]"
          >
            <span className="text-[26px]">{pm.emoji}</span>
            <span className="text-[13px] font-extrabold text-[#0A0A0A]">{pm.name}</span>
            <span className="text-[11px] text-[#6B7280] font-semibold">{pm.share}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
