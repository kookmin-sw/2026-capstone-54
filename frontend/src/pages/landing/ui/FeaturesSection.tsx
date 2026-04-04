const FEATURES = [
  { emoji: "🎥", title: "AI 화상 면접", desc: "실시간 화상으로 AI 면접관과 대화. 꼬리질문 방식과 전체 프로세스 방식 중 선택하세요.", badge: "Pro 핵심 기능" },
  { emoji: "📄", title: "이력서 분석", desc: "PDF·DOCX 업로드 즉시 AI가 분석해 맞춤 면접 질문을 생성합니다." },
  { emoji: "👁️", title: "시선 추적 분석", desc: "면접 중 시선 이탈 횟수와 집중도를 분석해 자신감 있는 태도를 만들어드립니다." },
  { emoji: "📊", title: "AI 리뷰 리포트", desc: "발음·전달력, 논리적 구성, 태도·자신감, 전문 용어 4개 영역 점수를 상세 분석합니다." },
  { emoji: "🔥", title: "스트릭 & 통계", desc: "연속 면접 일수와 연간 활동 기록으로 꾸준한 습관을 만들고 성장을 시각화하세요." },
];

const [featured, ...rest] = FEATURES;

export function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <div className="features-inner">
        <div className="features-header">
          <div className="section-badge">핵심 기능</div>
          <h2 className="features-title">면접 준비의 모든 것.</h2>
          <p className="features-subtitle">이력서 분석부터 실전 화상 면접, AI 피드백까지 한 플랫폼에서.</p>
        </div>

        {/* 모바일: 세로 스택 / 데스크탑: 좌우 2컬럼 */}
        <div className="features-layout">
          {/* 첫 번째 카드 (다크) */}
          <div className="feature-card-featured">
            <span className="feature-badge-pro">{featured.badge}</span>
            <div className="feature-icon-wrap feature-icon-dark">{featured.emoji}</div>
            <h3 className="feature-card-title feature-card-title-white">{featured.title}</h3>
            <p className="feature-card-desc feature-card-desc-white">{featured.desc}</p>
          </div>

          {/* 나머지 카드들 */}
          <div className="features-rest">
            {rest.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon-wrap feature-icon-light">{f.emoji}</div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .features-section {
          padding: 56px 20px;
          display: flex; justify-content: center;
          background: #FFFFFF;
        }
        .features-inner { max-width: 480px; width: 100%; }
        .features-header { text-align: center; margin-bottom: 32px; }
        .section-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
        }
        .features-title {
          font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 800;
          color: #0A0A0A; margin-bottom: 10px;
        }
        .features-subtitle { font-size: 14px; color: #6B7280; line-height: 1.6; }
        .features-layout { display: flex; flex-direction: column; gap: 12px; }
        .feature-card-featured {
          background: #0A0A0A;
          border-radius: 8px; padding: 24px 20px; position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
          transition: transform 0.2s;
        }
        .feature-card-featured:hover { transform: translateY(-2px); }
        .feature-badge-pro {
          position: absolute; top: 16px; right: 16px;
          font-size: 11px; font-weight: 700; color: #0A0A0A;
          background: #FFFFFF; border-radius: 4px; padding: 3px 10px;
        }
        .features-rest { display: flex; flex-direction: column; gap: 12px; }
        .feature-card {
          background: #F9FAFB; border-radius: 8px; padding: 24px 20px;
          border: 1px solid #E5E7EB;
          transition: transform 0.2s;
        }
        .feature-card:hover { transform: translateY(-2px); }
        .feature-icon-wrap {
          width: 40px; height: 40px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 14px;
        }
        .feature-icon-dark { background: rgba(255,255,255,0.12); }
        .feature-icon-light { background: #FFFFFF; border: 1px solid #E5E7EB; }
        .feature-card-title {
          font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700;
          color: #0A0A0A; margin-bottom: 8px;
        }
        .feature-card-title-white { color: #fff; }
        .feature-card-desc { font-size: 13px; color: #6B7280; line-height: 1.65; }
        .feature-card-desc-white { color: rgba(255,255,255,0.72); }

        @media (min-width: 768px) {
          .features-section { padding: 80px 40px; }
          .features-inner { max-width: 1080px; }
          .features-header { margin-bottom: 48px; }
          .section-badge { font-size: 13px; padding: 6px 18px; }
          .features-title { font-size: clamp(32px, 4vw, 48px); }
          .features-subtitle { font-size: 15px; }
          .features-layout {
            flex-direction: row; gap: 16px; align-items: stretch;
          }
          .feature-card-featured {
            flex: 1; border-radius: 8px; padding: 40px 36px;
            display: flex; flex-direction: column; justify-content: flex-end;
            min-height: 480px;
          }
          .feature-card-title { font-size: 18px; }
          .feature-card-featured .feature-card-title { font-size: 22px; }
          .feature-card-desc { font-size: 14px; }
          .features-rest {
            flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          }
          .feature-card { border-radius: 8px; padding: 28px 24px; }
        }
      `}</style>
    </section>
  );
}
