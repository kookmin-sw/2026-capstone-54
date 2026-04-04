const FREE_ITEMS = [
  { ok: true, text: "월 5회 면접" },
  { ok: true, text: "기본 AI 리뷰 리포트" },
  { ok: true, text: "스트릭 기능" },
  { ok: true, text: "이력서 등록 (최대 2개)" },
  { ok: false, text: "시선 추적 분석" },
  { ok: false, text: "상세 AI 리뷰 리포트" },
];

const PRO_ITEMS = [
  { ok: true, text: "무제한 면접" },
  { ok: true, text: "상세 AI 리뷰 리포트" },
  { ok: true, text: "시선 추적 분석" },
  { ok: true, text: "스트릭 보상 2배" },
  { ok: true, text: "이력서 무제한 등록" },
  { ok: true, text: "채용공고 연동" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-inner">
        <div className="pricing-header">
          <div className="pricing-badge">요금제</div>
          <h2 className="pricing-title">나에게 맞는 플랜을 선택하세요.</h2>
          <p className="pricing-subtitle">숨겨진 비용 없음. 언제든지 업그레이드 또는 취소 가능합니다.</p>
        </div>

        <div className="pricing-cards">
          {/* Free */}
          <div className="plan-card plan-free">
            <div className="plan-name">Free</div>
            <div className="plan-price">₩0</div>
            <div className="plan-period">월 요금 없음</div>
            <ul className="plan-items">
              {FREE_ITEMS.map((item) => (
                <li key={item.text} className={`plan-item ${item.ok ? "" : "plan-item-off"}`}>
                  <span className={item.ok ? "check-ok" : "check-no"}>{item.ok ? "✓" : "✕"}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <button className="plan-btn plan-btn-free">현재 플랜</button>
            <div className="plan-note">기본 기능 무료 사용</div>
          </div>

          {/* Pro */}
          <div className="plan-card plan-pro">
            <span className="plan-recommend">추천</span>
            <div className="plan-name plan-name-white">Pro</div>
            <div className="plan-price plan-price-white">
              ₩19,900<span className="plan-price-unit">/월</span>
            </div>
            <div className="plan-period plan-period-white">월 구독</div>
            <ul className="plan-items">
              {PRO_ITEMS.map((item) => (
                <li key={item.text} className="plan-item plan-item-white">
                  <span className="check-pro">✓</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <button className="plan-btn plan-btn-pro">Pro 업그레이드</button>
            <div className="plan-note plan-note-white">언제든지 취소 가능</div>
          </div>
        </div>
      </div>

      <style>{`
        .pricing-section {
          padding: 64px 20px;
          display: flex; justify-content: center;
          background: #FFFFFF;
        }
        .pricing-inner { max-width: 480px; width: 100%; }
        .pricing-header { text-align: center; margin-bottom: 40px; }
        .pricing-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
        }
        .pricing-title {
          font-family: 'Inter', sans-serif; font-size: clamp(24px, 7vw, 36px);
          font-weight: 800; color: #0A0A0A; margin-bottom: 12px;
        }
        .pricing-subtitle { font-size: 14px; color: #6B7280; }
        .pricing-cards { display: flex; flex-direction: column; gap: 16px; }
        .plan-card {
          border-radius: 8px; padding: 36px 28px;
        }
        .plan-free {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
        }
        .plan-pro {
          background: #0A0A0A;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        }
        .plan-recommend {
          position: absolute; top: 20px; right: 20px;
          font-size: 11px; font-weight: 700; color: #0A0A0A;
          background: #FFFFFF; border-radius: 4px; padding: 4px 12px;
        }
        .plan-name {
          font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 800;
          color: #0A0A0A; margin-bottom: 8px;
        }
        .plan-name-white { color: #fff; }
        .plan-price {
          font-family: 'Inter', sans-serif; font-size: 44px; font-weight: 900;
          color: #0A0A0A; margin-bottom: 4px;
        }
        .plan-price-white { color: #fff; }
        .plan-price-unit { font-size: 18px; }
        .plan-period { font-size: 13px; color: #6B7280; margin-bottom: 24px; }
        .plan-period-white { color: rgba(255,255,255,0.55); }
        .plan-items {
          list-style: none; padding: 0; margin: 0 0 28px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .plan-item {
          font-size: 14px; color: #0A0A0A;
          display: flex; align-items: center; gap: 10px;
        }
        .plan-item-off { color: #9CA3AF; }
        .plan-item-white { color: rgba(255,255,255,0.9); }
        .check-ok { color: #059669; font-weight: 700; }
        .check-no { color: #D1D5DB; font-weight: 700; }
        .check-pro { color: #6EE7B7; font-weight: 700; }
        .plan-btn {
          width: 100%; padding: 14px 0; border-radius: 8px; border: none;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s;
        }
        .plan-btn:hover { opacity: 0.85; }
        .plan-btn-free {
          background: #0A0A0A; color: #FFFFFF;
        }
        .plan-btn-pro { background: #FFFFFF; color: #0A0A0A; }
        .plan-note { text-align: center; font-size: 12px; color: #6B7280; margin-top: 10px; }
        .plan-note-white { color: rgba(255,255,255,0.45); }

        @media (min-width: 768px) {
          .pricing-section { padding: 100px 40px; }
          .pricing-inner { max-width: 1080px; }
          .pricing-header { margin-bottom: 64px; }
          .pricing-badge { font-size: 14px; padding: 8px 20px; margin-bottom: 20px; }
          .pricing-title { font-size: clamp(32px, 4vw, 48px); margin-bottom: 18px; }
          .pricing-subtitle { font-size: 17px; }
          .pricing-cards {
            flex-direction: row; gap: 20px;
            max-width: 760px; margin: 0 auto;
          }
          .plan-card { flex: 1; border-radius: 8px; padding: 44px 40px; }
          .plan-name { font-size: 20px; margin-bottom: 10px; }
          .plan-price { font-size: 48px; margin-bottom: 6px; }
          .plan-price-unit { font-size: 20px; }
          .plan-period { font-size: 14px; margin-bottom: 32px; }
          .plan-items { gap: 14px; margin-bottom: 36px; }
          .plan-item { font-size: 15px; gap: 12px; }
          .plan-btn { padding: 16px 0; border-radius: 8px; font-size: 16px; }
          .plan-note { font-size: 13px; margin-top: 12px; }
          .plan-recommend { top: 24px; right: 24px; font-size: 12px; padding: 5px 14px; }
        }
      `}</style>
    </section>
  );
}
