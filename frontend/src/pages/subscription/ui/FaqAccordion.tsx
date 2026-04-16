const FAQ_ITEMS = [
  {
    q: "무료 체험 후 자동으로 결제되나요?",
    a: "7일 무료 체험 기간이 끝나면 선택하신 요금제로 자동 결제됩니다. 체험 기간 중 언제든 마이페이지 → 요금제에서 취소할 수 있으며, 취소 시 과금되지 않습니다.",
  },
  {
    q: "스트릭 보상으로 받은 기능은 Pro 구독 없이도 쓸 수 있나요?",
    a: "네! 스트릭 보상으로 지급된 기능 사용권(시선 추적, 실전 모드 등)은 구독 여부와 관계없이 지급된 횟수만큼 자유롭게 사용할 수 있습니다.",
  },
  {
    q: "중간에 요금제를 취소하면 데이터가 삭제되나요?",
    a: "구독을 취소해도 기존에 저장된 이력서, 면접 리포트, 스트릭 기록은 삭제되지 않습니다. 다만 이력서·채용공고가 Free 한도(각 3개, 5개)를 초과한 경우 초과분은 접근이 제한됩니다.",
  },
  {
    q: "연간 결제 시 환불이 가능한가요?",
    a: "결제일로부터 7일 이내에 고객센터로 문의하시면 전액 환불해드립니다. 7일 이후에는 잔여 기간에 대한 비례 환불이 적용됩니다.",
  },
  {
    q: "법인 세금계산서 발행이 가능한가요?",
    a: "가능합니다. 결제 완료 후 고객센터(support@mefit.kr)로 사업자등록번호와 이메일을 보내주시면 세금계산서를 발행해드립니다.",
  },
];

interface FaqAccordionProps {
  openFaqIndex: number | null;
  onToggleFaq: (index: number) => void;
}

export function FaqAccordion({ openFaqIndex, onToggleFaq }: FaqAccordionProps) {
  return (
    <div className="max-w-[640px] mx-auto mb-14" style={{ transitionDelay: "160ms" }}>
      <h2 className="text-[22px] font-black tracking-[-0.3px] mb-5 text-center text-[#0A0A0A]">
        자주 묻는 질문
      </h2>
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openFaqIndex === i;
        return (
          <div
            key={i}
            className={`bg-[#F9FAFB] border rounded-xl mb-2 overflow-hidden transition-[box-shadow] duration-200 ${isOpen ? "shadow-[var(--sc-hover)] border-[rgba(9,145,178,.2)]" : "border-[#E5E7EB]"}`}
          >
            <button
              className="flex items-center justify-between w-full px-5 py-4 cursor-pointer text-sm font-bold text-[#0A0A0A] gap-3 bg-none border-none text-left transition-colors hover:bg-[rgba(9,145,178,.03)]"
              onClick={() => onToggleFaq(i)}
            >
              {item.q}
              <span
                className="text-[11px] text-[#0991B2] transition-transform duration-[250ms] flex-shrink-0"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                ▼
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-[13px] text-[#6B7280] leading-[1.7] animate-[subSlideDown_.2s_ease]">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
