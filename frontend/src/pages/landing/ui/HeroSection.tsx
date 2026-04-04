const STATS = [
  { value: "98%", label: "면접 만족도" },
  { value: "3배", label: "합격률 향상" },
  { value: "15분", label: "최단 면접" },
  { value: "24/7", label: "언제든 가능" },
];

export function HeroSection() {
  return (
    <section id="hero" className="hero-section">

      <div className="hero-inner">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="hero-dot" />
            수천 명이 meFit으로 면접 준비 중
          </div>
          <h1 className="hero-title">
            아직 핏이<br />
            <span className="hero-accent">맞지 않아도</span><br />
            괜찮아.
          </h1>
          <p className="hero-desc">
            未fit, meFit. 이력서 기반 AI 면접부터<br />시선 분석까지. 면접에 맞는 나로.
          </p>
          <div className="hero-btns">
            <a href="/sign-up" className="btn-primary">무료 면접 시작하기 →</a>
            <a href="#features" className="btn-secondary">데모 보기</a>
          </div>
        </div>

        <div className="hero-stats">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hero-section {
          min-height: 100svh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 80px 20px 48px;
          position: relative; overflow: hidden;
          background: #FFFFFF;
        }
        .hero-inner {
          position: relative; z-index: 1;
          max-width: 1080px; width: 100%;
          display: flex; flex-direction: column; align-items: center; gap: 40px;
        }
        .hero-text {
          display: flex; flex-direction: column; align-items: center; width: 100%;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 100px; padding: 6px 14px;
          font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 24px;
        }
        .hero-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #059669;
          display: inline-block; flex-shrink: 0;
        }
        .hero-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(44px, 13vw, 80px);
          font-weight: 900; line-height: 1.05;
          color: #0A0A0A; margin-bottom: 16px; letter-spacing: -2px;
        }
        .hero-accent {
          background: linear-gradient(135deg, #0991B2, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-desc {
          font-size: 14px; color: #6B7280; line-height: 1.7;
          max-width: 320px; margin-bottom: 32px;
        }
        .hero-btns {
          display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 320px;
        }
        .btn-primary {
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          color: #fff; background: #0A0A0A;
          text-decoration: none; padding: 15px 0; border-radius: 8px;
          display: block; text-align: center;
          transition: opacity 0.2s;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-secondary {
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          color: #0A0A0A; background: #FFFFFF;
          text-decoration: none; padding: 15px 0; border-radius: 8px;
          border: 1.5px solid #0A0A0A;
          display: block; text-align: center;
          transition: background 0.2s;
        }
        .btn-secondary:hover { background: #F9FAFB; }
        .hero-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          max-width: 480px; width: 100%;
        }
        .stat-card {
          background: #F9FAFB; border-radius: 8px; padding: 20px 16px; text-align: center;
          border: 1px solid #E5E7EB;
        }
        .stat-value {
          font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 900;
          color: #0A0A0A; line-height: 1; margin-bottom: 4px;
        }
        .stat-label { font-size: 12px; color: #6B7280; font-weight: 500; }

        @media (min-width: 768px) {
          .hero-section { padding: 100px 40px 64px; }
          .hero-inner { gap: 48px; }
          .hero-desc { font-size: 15px; max-width: 420px; margin-bottom: 36px; }
          .hero-btns { flex-direction: row; max-width: none; width: auto; gap: 12px; }
          .btn-primary { padding: 15px 32px; display: inline-block; }
          .btn-secondary { padding: 15px 32px; display: inline-block; }
          .hero-stats { grid-template-columns: repeat(4, 1fr); gap: 48px; max-width: 680px; }
          .stat-card {
            background: none; border: none; border-radius: 0; padding: 0;
          }
          .stat-value { font-size: 38px; margin-bottom: 6px; }
          .stat-label { font-size: 13px; }
        }
      `}</style>
    </section>
  );
}
