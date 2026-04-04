const REPORTS = [
  {
    num: "01",
    badge: "발음 / 전달력",
    title: "말하는 방식까지 분석",
    desc: "답변 명확성, 발음, 속도, 전달력을 점수화해 구체적인 개선 방향을 제시합니다.",
  },
  {
    num: "02",
    title: "영역별 점수 리포트",
    desc: "발음·전달력 / 논리적 구성 / 태도·자신감 / 전문 용어 활용 4개 영역을 세밀하게 평가합니다.",
  },
  {
    num: "03",
    title: "꼬리질문 AI 대화",
    desc: "답변에 따라 실시간으로 꼬리질문을 생성. 실제 면접관처럼 자연스러운 대화 흐름을 만듭니다.",
  },
];

export function ReviewReportSection() {
  return (
    <section className="review-section">
      <div className="review-inner">
        <div className="review-header">
          <div className="review-badge">AI 리뷰 리포트</div>
          <h2 className="review-title">면접 후, 더 정확한 피드백.</h2>
        </div>
        <div className="review-grid">
          {REPORTS.map((r) => (
            <div key={r.num} className="review-card">
              <div className="review-card-top">
                <span className="review-num">{r.num}</span>
                {r.badge && <span className="review-card-badge">{r.badge}</span>}
              </div>
              <h3 className="review-card-title">{r.title}</h3>
              <p className="review-card-desc">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .review-section {
          padding: 64px 20px;
          display: flex; justify-content: center;
          background: #F9FAFB;
        }
        .review-inner { max-width: 480px; width: 100%; }
        .review-header { text-align: center; margin-bottom: 32px; }
        .review-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
        }
        .review-title {
          font-family: 'Inter', sans-serif; font-size: clamp(24px, 7vw, 36px);
          font-weight: 800; color: #0A0A0A;
        }
        .review-grid { display: flex; flex-direction: column; gap: 12px; }
        .review-card {
          background: #FFFFFF; border-radius: 8px; padding: 28px 24px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: transform 0.2s;
        }
        .review-card:hover { transform: translateY(-2px); }
        .review-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .review-num { font-size: 12px; font-weight: 700; color: #D1D5DB; }
        .review-card-badge {
          font-size: 11px; font-weight: 700; color: #059669;
          background: #ECFDF5;
          border-radius: 4px; padding: 3px 10px;
        }
        .review-card-title {
          font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700;
          color: #0A0A0A; margin-bottom: 8px;
        }
        .review-card-desc { font-size: 13px; color: #6B7280; line-height: 1.7; }

        @media (min-width: 768px) {
          .review-section { padding: 100px 40px; }
          .review-inner { max-width: 1080px; }
          .review-header { margin-bottom: 56px; }
          .review-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .review-title { font-size: clamp(32px, 4vw, 52px); }
          .review-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .review-card { border-radius: 8px; padding: 36px 32px; }
          .review-card-top { margin-bottom: 20px; }
          .review-num { font-size: 13px; }
          .review-card-badge { font-size: 11px; padding: 4px 12px; }
          .review-card-title { font-size: 18px; margin-bottom: 12px; }
          .review-card-desc { font-size: 14px; }
        }
      `}</style>
    </section>
  );
}
