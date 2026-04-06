import { Link } from "react-router-dom";

interface HomeSidebarProps {
  menuOpen: boolean;
  currentStreak: number;
}

export function HomeSidebar({ menuOpen, currentStreak }: HomeSidebarProps) {
  return (
    <aside className={`hp-sidebar${menuOpen ? " open" : ""}`}>
      <div className="hp-sb-sep">메인</div>
      <Link to="/home" className="hp-sb-item active">
        <span className="hp-sb-icon">🏠</span>홈
      </Link>
      <Link to="/interview/setup" className="hp-sb-item">
        <span className="hp-sb-icon">🎥</span>면접 시작
      </Link>
      <div className="hp-sb-sep">관리</div>
      <Link to="/resume" className="hp-sb-item">
        <span className="hp-sb-icon">📄</span>이력서
      </Link>
      <Link to="/jd" className="hp-sb-item">
        <span className="hp-sb-icon">🏢</span>채용공고
        <span className="hp-sb-badge">3</span>
      </Link>
      <div className="hp-sb-sep">분석</div>
      <Link to="#" className="hp-sb-item">
        <span className="hp-sb-icon">📊</span>리뷰 리포트
      </Link>
      <Link to="/streak" className="hp-sb-item">
        <span className="hp-sb-icon">🔥</span>스트릭
      </Link>
      <div className="hp-sb-sep">설정</div>
      <Link to="/subscription" className="hp-sb-item">
        <span className="hp-sb-icon">💳</span>요금제
      </Link>
      <Link to="/settings" className="hp-sb-item">
        <span className="hp-sb-icon">⚙️</span>계정 설정
      </Link>
      <div className="hp-sb-streak-card">
        <div className="hp-ssc-label">스트릭</div>
        <div className="hp-ssc-num">{currentStreak}</div>
        <div className="hp-ssc-unit">연속 일수</div>
      </div>
    </aside>
  );
}
