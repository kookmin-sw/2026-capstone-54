import { Link } from "react-router-dom";

interface QuickStartHeroProps {
  revealed: boolean;
}

export function QuickStartHero({ revealed }: QuickStartHeroProps) {
  return (
    <Link
      to="/interview/setup"
      className={`hp-qs-hero hp-rv${revealed ? " hp-rv-in" : ""}`}
      style={{ transitionDelay: "0ms" }}
    >
      <div>
        <div className="hp-qsh-tag">
          <span className="dot" />빠른 시작
        </div>
        <div className="hp-qsh-title">AI 면접 바로 시작하기</div>
        <div className="hp-qsh-sub">이전 설정을 불러와 바로 준비를 이어갈 수 있어요.</div>
        <div className="hp-qsh-btns">
          <span className="hp-qsh-btn-w">이어서 준비하기 →</span>
          <span className="hp-qsh-btn-g">새 면접 설정</span>
        </div>
      </div>
      <div className="hp-qs-visual">
        <div className="hp-qsv-icon">🎙️</div>
        <div className="hp-qsv-text">AI 면접관 대기 중</div>
      </div>
    </Link>
  );
}
