const WHY_STYLES = `
        .why-section {
          padding: 64px 20px;
          display: flex; justify-content: center;
          background: #FFFFFF;
        }
        .why-inner { max-width: 480px; width: 100%; }
        .why-header { margin-bottom: 32px; }
        .why-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 12px;
        }
        .why-title {
          font-family: 'Inter', sans-serif; font-size: clamp(28px, 8vw, 40px);
          font-weight: 800; color: #0A0A0A;
        }
        .why-featured {
          background: #0A0A0A;
          border-radius: 8px; padding: 32px 28px; margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
          display: flex; gap: 24px; align-items: center;
          transition: transform 0.2s;
        }
        .why-featured:hover { transform: translateY(-2px); }
        .why-featured-content { flex: 1; }
        .why-featured-spacer { display: none; }
        .why-featured-icon {
          width: 44px; height: 44px; border-radius: 8px;
          background: rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 16px;
        }
        .why-featured-title {
          font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 800;
          color: #fff; margin-bottom: 10px;
        }
        .why-featured-desc { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.7; }
        .why-grid { display: flex; flex-direction: column; gap: 8px; }
        .why-card {
          background: #F9FAFB; border-radius: 8px; padding: 24px 20px;
          border: 1px solid #E5E7EB;
          transition: transform 0.2s;
        }
        .why-card:hover { transform: translateY(-2px); }
        .why-card-icon { font-size: 22px; margin-bottom: 12px; }
        .why-card-title {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          color: #0A0A0A; margin-bottom: 6px;
        }
        .why-card-desc { font-size: 13px; color: #6B7280; line-height: 1.65; }

        @media (min-width: 768px) {
          .why-section { padding: 100px 40px; }
          .why-inner { max-width: 1080px; }
          .why-header { margin-bottom: 56px; }
          .why-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .why-title { font-size: clamp(32px, 4vw, 52px); }
          .why-featured {
            border-radius: 8px; padding: 44px 40px; margin-bottom: 16px;
            display: grid; grid-template-columns: 1fr 2fr; gap: 32px;
          }
          .why-featured-spacer { display: block; }
          .why-featured-icon { width: 52px; height: 52px; border-radius: 8px; font-size: 26px; margin-bottom: 20px; }
          .why-featured-title { font-size: 22px; margin-bottom: 12px; }
          .why-featured-desc { font-size: 14px; }
          .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .why-card { border-radius: 8px; padding: 32px 28px; }
          .why-card-icon { font-size: 26px; margin-bottom: 14px; }
          .why-card-title { font-size: 16px; margin-bottom: 8px; }
          .why-card-desc { font-size: 13px; line-height: 1.7; }
        }
`;

const REASONS = [
  {
    emoji: "🎯",
    title: "이력서 기반 맞춤 질문",
    desc: "이력서를 업로드하면 AI가 직무와 경력에 맞는 맞춤형 질문을 생성합니다. 일반적인 예상 질문이 아닌, 나에게 딱 맞는 질문으로 준비하세요.",
    featured: true,
  },
  { emoji: "🔄", title: "꼬리질문 AI", desc: "답변 내용에 따라 AI가 실시간으로 꼬리질문을 생성해 실제 면접과 똑같은 긴장감을 경험할 수 있습니다." },
  { emoji: "👁️", title: "시선 추적 분석", desc: "면접 중 시선 이탈 횟수를 측정해 자신감 있는 면접 태도를 만들 수 있도록 구체적인 피드백을 제공합니다." },
  { emoji: "📊", title: "영역별 점수 리포트", desc: "발음·전달력, 논리적 구성, 태도·자신감, 전문 용어 활용 총 4개 영역을 수치로 확인하고 개선하세요." },
  { emoji: "🔥", title: "스트릭으로 습관 형성", desc: "연속 면접 일수와 연간 활동 기록으로 꾸준한 면접 연습 습관을 만들고 성장 과정을 시각화하세요." },
  { emoji: "⚡", title: "24/7 언제든 면접", desc: "면접관 일정에 맞출 필요 없이 내가 원하는 시간에, 원하는 장소에서 면접 연습을 시작하세요." },
  { emoji: "🏢", title: "채용공고 연동", desc: "지원하는 채용공고를 등록하면 해당 직무에 최적화된 면접 질문으로 연습할 수 있습니다." },
];

const [featured, ...rest] = REASONS;

export function WhySection() {
  return (
    <section id="why" className="why-section">
      <div className="why-inner">
        <div className="why-header">
          <div className="why-badge">왜 MEFIT</div>
          <h2 className="why-title">선택해야 할 이유.</h2>
        </div>

        {/* Featured 카드 */}
        <div className="why-featured">
          <div className="why-featured-content">
            <div className="why-featured-icon">{featured.emoji}</div>
            <h3 className="why-featured-title">{featured.title}</h3>
            <p className="why-featured-desc">{featured.desc}</p>
          </div>
          <div className="why-featured-spacer" />
        </div>

        {/* 나머지 카드 */}
        <div className="why-grid">
          {rest.map((r) => (
            <div key={r.title} className="why-card">
              <div className="why-card-icon">{r.emoji}</div>
              <h3 className="why-card-title">{r.title}</h3>
              <p className="why-card-desc">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{WHY_STYLES}</style>
    </section>
  );
}
