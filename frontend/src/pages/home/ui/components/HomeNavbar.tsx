import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/features/auth";

interface HomeNavbarProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
}

// 프론트 확인용 더미 알림 데이터
const DUMMY_NOTIFICATIONS = [
  { id: 1, message: "새로운 채용공고가 등록되었습니다.", time: "방금 전", read: false },
  { id: 2, message: "이력서 분석이 완료되었습니다.", time: "10분 전", read: false },
  { id: 3, message: "면접 연습 결과를 확인해보세요.", time: "1시간 전", read: true },
];

export function HomeNavbar({ menuOpen, onMenuToggle }: HomeNavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

  const profileRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setNotiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotiOpen = () => {
    setNotiOpen((v) => !v);
    setProfileOpen(false);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

      {/* Notification bell */}
      <div className="relative" ref={notiRef}>
        <button
          onClick={handleNotiOpen}
          className="relative p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
          aria-label="알림"
        >
          <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {notiOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#E5E7EB] z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <span className="text-sm font-semibold text-[#0A0A0A]">
                알림 {unreadCount > 0 && <span className="text-[#0991B2]">({unreadCount})</span>}
              </span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#6B7280] hover:text-[#0991B2] transition-colors">
                  모두 읽음
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="px-4 py-6 text-sm text-center text-[#9CA3AF]">알림이 없습니다.</li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[#F3F4F6] last:border-0 ${!n.read ? "bg-[#F0F9FF]" : ""}`}
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? "bg-[#0991B2]" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0A0A0A]">{n.message}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{n.time}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* User Profile Dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => { setProfileOpen((v) => !v); setNotiOpen(false); }}
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
