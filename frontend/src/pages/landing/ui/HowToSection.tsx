const HOWTO_STYLES = `
        .howto-section {
          padding: 64px 20px;
          display: flex; justify-content: center;
          background: #FFFFFF;
        }
        .howto-inner {
          max-width: 480px; width: 100%;
          display: flex; flex-direction: column; gap: 24px;
        }
        .howto-left { display: flex; flex-direction: column; }
        .howto-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
          align-self: flex-start;
        }
        .howto-title {
          font-family: 'Inter', sans-serif; font-size: clamp(28px, 8vw, 40px);
          font-weight: 800; color: #0A0A0A; margin-bottom: 12px; line-height: 1.1;
        }
        .howto-desc { font-size: 14px; color: #6B7280; line-height: 1.65; margin-bottom: 24px; }
        .howto-steps { display: flex; flex-direction: column; gap: 8px; }
        .howto-step {
          display: flex; align-items: center; gap: 14px;
          background: #F9FAFB; border-radius: 8px; padding: 16px 18px;
          border: 1px solid #E5E7EB;
          transition: transform 0.2s;
        }
        .howto-step:hover { transform: translateY(-2px); }
        .step-num {
          width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
          background: #0A0A0A;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #fff;
        }
        .step-content { flex: 1; }
        .step-title { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: #0A0A0A; margin-bottom: 2px; }
        .step-desc { font-size: 12px; color: #6B7280; }
        .step-label {
          font-size: 11px; font-weight: 600; color: #0991B2;
          background: #E6F7FA; border-radius: 4px; padding: 4px 10px; flex-shrink: 0;
        }
        .howto-card {
          background: #0A0A0A;
          border-radius: 8px; padding: 32px 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        }
        .howto-card-icon { font-size: 32px; margin-bottom: 16px; }
        .howto-card-title {
          font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800;
          color: #fff; margin-bottom: 12px; line-height: 1.25;
        }
        .howto-card-desc { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.7; margin-bottom: 20px; }
        .howto-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .howto-tag {
          font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.1); border-radius: 4px; padding: 5px 12px;
          border: 1px solid rgba(255,255,255,0.12);
        }

        @media (min-width: 768px) {
          .howto-section { padding: 100px 40px; }
          .howto-inner {
            max-width: 1080px; flex-direction: column; gap: 40px; align-items: stretch;
          }
          .howto-left { flex: none; }
          .howto-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .howto-title { font-size: clamp(32px, 4vw, 52px); margin-bottom: 16px; }
          .howto-desc { font-size: 15px; margin-bottom: 40px; }
          .howto-step { gap: 18px; border-radius: 8px; padding: 20px 24px; }
          .step-num { width: 40px; height: 40px; border-radius: 8px; font-size: 13px; }
          .step-title { font-size: 15px; margin-bottom: 3px; }
          .step-desc { font-size: 13px; }
          .step-label { font-size: 12px; padding: 4px 12px; }
          .howto-card { flex: none; border-radius: 8px; padding: 48px 44px; }
          .howto-card-icon { font-size: 36px; margin-bottom: 20px; }
          .howto-card-title { font-size: 26px; margin-bottom: 16px; }
          .howto-card-desc { font-size: 14px; margin-bottom: 28px; }
          .howto-tag { font-size: 12px; padding: 6px 14px; }
        }
`;

const STEPS = [
  { num: "01", title: "면접 설정", desc: "이력서 선택, 면접 유형·시간·모드 설정", label: "1 설정" },
  { num: "02", title: "사전 환경 점검", desc: "카메라·마이크·네트워크 자동 점검", label: "2 점검" },
  { num: "03", title: "면접 진행 & 결과 확인", desc: "AI 면접 후 즉시 영역별 점수 리포트 제공", label: "3 면접" },
];

const TAGS = ["꼬리질문 방식", "전체 프로세스 방식", "연습 / 실전 모드", "15분 ~ 60분"];

export function HowToSection() {
  return (
    <section id="how-to" className="howto-section">
      <div className="howto-inner">
        {/* 좌측 */}
        <div className="howto-left">
          <div className="howto-badge">이용 방법</div>
          <h2 className="howto-title">3단계로 끝나는<br />AI 면접.</h2>
          <p className="howto-desc">복잡한 설정 없이, 이력서 업로드부터 결과 확인까지 15분이면 충분합니다.</p>
          <div className="howto-steps">
            {STEPS.map((step) => (
              <div key={step.num} className="howto-step">
                <div className="step-num">{step.num}</div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                </div>
                <div className="step-label">{step.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 다크 카드 */}
        <div className="howto-card">
          <div className="howto-card-icon">🎙️</div>
          <h3 className="howto-card-title">연습 모드부터<br />실전 모드까지.</h3>
          <p className="howto-card-desc">
            준비 완료 버튼을 눌러 시작하는 연습 모드, 5~30초 랜덤 대기 후 자동 시작되는 실전 모드. 나에게 맞는 방식으로 연습하세요.
          </p>
          <div className="howto-tags">
            {TAGS.map((tag) => (
              <span key={tag} className="howto-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{HOWTO_STYLES}</style>
    </section>
  );
}
