import { Link } from "react-router-dom";

interface HomeNavbarProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
}

export function HomeNavbar({ menuOpen, onMenuToggle }: HomeNavbarProps) {
  return (
    <nav className="hp-nav">
      <button 
        className={`hp-menu-btn${menuOpen ? " open" : ""}`}
        onClick={onMenuToggle}
        aria-label="메뉴"
      >
        <div className="hp-menu-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      <Link to="/" className="hp-nav-logo flex items-center">
        <img src="/logo-korean.png" alt="미핏" className="h-[36px] w-auto" />
      </Link>
      <Link to="/home" className="hp-nav-link active">홈</Link>
      <Link to="/resume" className="hp-nav-link">이력서</Link>
      <Link to="/jd" className="hp-nav-link">채용공고</Link>
      <Link to="/interview/setup" className="hp-btn-primary">면접 시작 →</Link>
    </nav>
  );
}
