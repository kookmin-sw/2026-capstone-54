export function CtaSection() {
  return (
    <section className="cta-section">
      <div className="cta-card">
        <h2 className="cta-title">
          未fit에서<br />meFit으로.
        </h2>
        <p className="cta-desc">
          아직 핏이 맞지 않아도 괜찮아요. 지금 바로 시작해서<br />
          면접에 맞는 나로 완성해가세요.
        </p>
        <div className="cta-btns">
          <a href="/sign-up" className="cta-btn-primary">무료 면접 시작하기 →</a>
          <a href="#pricing" className="cta-btn-secondary">요금제 보기</a>
        </div>
      </div>

      <style>{`
        .cta-section {
          padding: 48px 20px;
          display: flex; justify-content: center;
          background: #FFFFFF;
        }
        .cta-card {
          max-width: 480px; width: 100%;
          background: #0A0A0A;
          border-radius: 8px; padding: 48px 28px; text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        }
        .cta-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(32px, 10vw, 48px);
          font-weight: 900; color: #fff; margin-bottom: 16px; line-height: 1.1;
        }
        .cta-desc {
          font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.7; margin-bottom: 32px;
        }
        .cta-btns {
          display: flex; flex-direction: column; gap: 10px; align-items: center;
        }
        .cta-btn-primary {
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          color: #0A0A0A; background: #fff;
          text-decoration: none; padding: 15px 32px; border-radius: 8px;
          display: inline-block; width: 100%; text-align: center;
          transition: opacity 0.2s;
        }
        .cta-btn-primary:hover { opacity: 0.9; }
        .cta-btn-secondary {
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          color: rgba(255,255,255,0.8); background: transparent;
          text-decoration: none; padding: 15px 32px; border-radius: 8px;
          display: inline-block; border: 1.5px solid rgba(255,255,255,0.2);
          width: 100%; text-align: center;
          transition: border-color 0.2s, color 0.2s;
        }
        .cta-btn-secondary:hover { border-color: rgba(255,255,255,0.4); color: #fff; }

        @media (min-width: 768px) {
          .cta-section { padding: 80px 40px; }
          .cta-card {
            max-width: 1080px; border-radius: 8px; padding: 88px 80px;
          }
          .cta-title { font-size: clamp(36px, 5vw, 56px); margin-bottom: 24px; }
          .cta-desc { font-size: 17px; margin-bottom: 48px; }
          .cta-btns { flex-direction: row; justify-content: center; gap: 14px; }
          .cta-btn-primary { width: auto; padding: 18px 36px; font-size: 17px; }
          .cta-btn-secondary { width: auto; padding: 18px 36px; font-size: 17px; }
        }
      `}</style>
    </section>
  );
}
