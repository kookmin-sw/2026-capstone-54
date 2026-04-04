const SERVICE_LINKS = ["면접 시작", "이력서 관리", "채용공고 연동", "스트릭", "요금제"];
const COMPANY_LINKS = ["소개", "채용", "블로그", "문의"];
const LEGAL_LINKS = ["개인정보처리방침", "이용약관", "쿠키 정책", "데이터 수집 동의"];

export function FooterSection() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* 브랜드 */}
          <div className="footer-brand">
            <div className="footer-logo">me<span style={{ color: "#0991B2" }}>Fit</span></div>
            <p className="footer-tagline">
              未fit → meFit. 아직 면접 핏이 맞지 않는 나를,<br />AI와 함께 완성해가는 플랫폼.
            </p>
            <div className="footer-sns">
              {["Twitter", "LinkedIn"].map((sns) => (
                <a key={sns} href="#" className="footer-sns-link">{sns}</a>
              ))}
            </div>
          </div>

          {[
            { title: "서비스", links: SERVICE_LINKS },
            { title: "회사", links: COMPANY_LINKS },
            { title: "법적 고지", links: LEGAL_LINKS },
          ].map(({ title, links }) => (
            <div key={title} className="footer-col">
              <div className="footer-col-title">{title}</div>
              <ul className="footer-links">
                {links.map((link) => (
                  <li key={link}><a href="#" className="footer-link">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">© 2026 meFit(미핏). All rights reserved.</span>
          <div className="footer-legal">
            {["개인정보", "이용약관", "쿠키"].map((item) => (
              <a key={item} href="#" className="footer-legal-link">{item}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          background: #0A0A0A;
          padding: 48px 20px 24px;
          display: flex; justify-content: center;
        }
        .footer-inner { max-width: 480px; width: 100%; }
        .footer-grid {
          display: flex; flex-direction: column; gap: 32px; margin-bottom: 36px;
        }
        .footer-brand {}
        .footer-logo {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900;
          color: #fff; margin-bottom: 10px;
        }
        .footer-tagline {
          font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.7; margin-bottom: 16px;
        }
        .footer-sns { display: flex; gap: 8px; }
        .footer-sns-link {
          font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5);
          text-decoration: none; padding: 5px 12px; border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.12);
          transition: border-color 0.2s, color 0.2s;
        }
        .footer-sns-link:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .footer-col {}
        .footer-col-title {
          font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); margin-bottom: 12px;
        }
        .footer-links {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 8px;
        }
        .footer-link {
          font-size: 12px; color: rgba(255,255,255,0.35); text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: rgba(255,255,255,0.7); }
        .footer-bottom {
          padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; flex-direction: column; gap: 10px;
        }
        .footer-copy { font-size: 11px; color: rgba(255,255,255,0.22); }
        .footer-legal { display: flex; gap: 14px; }
        .footer-legal-link {
          font-size: 11px; color: rgba(255,255,255,0.22); text-decoration: none;
          transition: color 0.2s;
        }
        .footer-legal-link:hover { color: rgba(255,255,255,0.5); }

        @media (min-width: 768px) {
          .footer { padding: 64px 40px 32px; }
          .footer-inner { max-width: 1080px; }
          .footer-grid {
            display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px;
          }
          .footer-logo { font-size: 22px; margin-bottom: 12px; }
          .footer-tagline { font-size: 13px; margin-bottom: 20px; }
          .footer-sns-link { font-size: 12px; padding: 6px 14px; }
          .footer-col-title { font-size: 13px; margin-bottom: 16px; }
          .footer-links { gap: 10px; }
          .footer-link { font-size: 13px; }
          .footer-bottom {
            padding-top: 24px; flex-direction: row;
            justify-content: space-between; align-items: center;
          }
          .footer-copy { font-size: 12px; }
          .footer-legal { gap: 16px; }
          .footer-legal-link { font-size: 12px; }
        }
      `}</style>
    </footer>
  );
}
