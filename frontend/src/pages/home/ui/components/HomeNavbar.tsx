import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/features/auth";

interface HomeNavbarProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
}

export function HomeNavbar({ menuOpen, onMenuToggle }: HomeNavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
      
      {/* User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
          aria-label="프로필 메뉴"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0991B2] to-[#06B6D4] flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-sm font-semibold text-[#0A0A0A] hidden md:block">
            {user?.name || "사용자"}
          </span>
          <svg
            className={`w-4 h-4 text-[#6B7280] transition-transform ${profileOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-[#E5E7EB] py-2 z-50">
            <Link
              to="/settings"
              className="block px-4 py-2.5 text-sm text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors"
              onClick={() => setProfileOpen(false)}
            >
              ⚙️ 설정
            </Link>
            <div className="h-px bg-[#E5E7EB] my-1" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
            >
              🚪 로그아웃
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
