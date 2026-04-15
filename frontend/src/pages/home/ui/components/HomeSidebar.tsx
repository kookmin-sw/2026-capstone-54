import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/features/settings";

interface HomeSidebarProps {
  menuOpen: boolean;
  currentStreak: number;
  jdCount?: number;
  /** grid 밖에서 렌더될 때 항상 fixed position으로 동작 */
  floating?: boolean;
  activeItem?: "home" | "results";
}

export function HomeSidebar({ menuOpen, currentStreak, jdCount = 0, floating = false, activeItem }: HomeSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActivePanel } = useSettingsStore();
  const path = location.pathname;

  const isActive = (prefix: string) => {
    if (activeItem === "results" && prefix === "/interview/results") return true;
    if (activeItem === "home" && prefix === "/") return true;
    if (prefix === "/") return path === "/";
    return path === prefix || path.startsWith(prefix + "/");
  };

  const cls = `hp-sidebar${floating ? " hp-sidebar--floating" : ""}${menuOpen ? " open" : ""}`;
  return (
    <aside className={cls}>
      <div className="hp-sb-sep">메인</div>
      <Link to="/" className={`hp-sb-item${isActive("/") ? " active" : ""}`}>
        <span className="hp-sb-icon">🏠</span>홈
      </Link>
      <Link to="/interview/setup" className={`hp-sb-item${isActive("/interview/setup") ? " active" : ""}`}>
        <span className="hp-sb-icon">🎥</span>면접 시작
      </Link>
      <div className="hp-sb-sep">관리</div>
      <Link to="/resume" className={`hp-sb-item${isActive("/resume") ? " active" : ""}`}>
        <span className="hp-sb-icon">📄</span>이력서
      </Link>
      <Link to="/jd" className={`hp-sb-item${isActive("/jd") ? " active" : ""}`}>
        <span className="hp-sb-icon">🏢</span>채용공고
        {jdCount > 0 && <span className="hp-sb-badge">{jdCount}</span>}
      </Link>
      <div className="hp-sb-sep">분석</div>
      <Link to="/interview/results" className={`hp-sb-item${isActive("/interview/results") ? " active" : ""}`}>
        <span className="hp-sb-icon">📊</span>면접 결과
      </Link>
      <Link to="/streak" className={`hp-sb-item${isActive("/streak") ? " active" : ""}`}>
        <span className="hp-sb-icon">🔥</span>스트릭
      </Link>
      <div className="hp-sb-sep">설정</div>
      <Link to="/subscription" className={`hp-sb-item${isActive("/subscription") ? " active" : ""}`}>
        <span className="hp-sb-icon">💳</span>요금제
      </Link>
      <Link to="/settings" className={`hp-sb-item${isActive("/settings") ? " active" : ""}`}>
        <span className="hp-sb-icon">⚙️</span>계정 설정
      </Link>
      <div className="hp-sb-sep">알림</div>
      <button
        className="hp-sb-item w-full text-left border-none bg-transparent"
        onClick={() => { setActivePanel("notifications"); if (location.pathname !== "/settings") navigate("/settings"); }}
      >
        <span className="hp-sb-icon">🔔</span>알림 설정
      </button>
      <Link to="/notifications" className={`hp-sb-item${isActive("/notifications") ? " active" : ""}`}>
        <span className="hp-sb-icon">📬</span>알림 내역
      </Link>
      <div className="hp-sb-streak-card">
        <div className="hp-ssc-label">스트릭</div>
        <div className="hp-ssc-num">{currentStreak}</div>
        <div className="hp-ssc-unit">연속 일수</div>
      </div>
    </aside>
  );
}
