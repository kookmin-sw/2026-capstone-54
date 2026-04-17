import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Gem, ClipboardList, Bell, Inbox } from "lucide-react";
import { useSettingsStore } from "@/features/settings";
import { useAuthStore } from "@/features/auth";
import type { SettingsPanel } from "@/features/settings";

interface SettingsSidebarProps {
  menuOpen: boolean;
}

export function SettingsSidebar({ menuOpen }: SettingsSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, activePanel, consentBadge, setActivePanel } = useSettingsStore();
  const { user } = useAuthStore();

  const settingsItems: { key: SettingsPanel; icon: React.ReactNode; label: string; badge?: boolean }[] = [
    { key: "account",       icon: <User size={18} />,          label: "계정 정보 수정" },
    { key: "subscription",  icon: <Gem size={18} />,           label: "요금제"         },
    { key: "consent",       icon: <ClipboardList size={18} />, label: "동의 관리", badge: consentBadge },
  ];

  const cls = `hp-sidebar${menuOpen ? " open" : ""}`;

  return (
    <aside className={cls}>
      {/* 유저 프로필 카드 */}
      <div className="bg-[#0A0A0A] rounded-lg px-4 py-[14px] mb-4 flex items-center gap-[10px]">
        <div className="w-9 h-9 rounded-full bg-[#0991B2] flex items-center justify-center font-black text-[14px] text-white shrink-0">
          {(data?.profile.avatarInitial ?? user?.name?.[0] ?? "U").toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-plex-sans-kr text-[13px] font-extrabold text-white truncate">
            {data?.profile.name ?? user?.name ?? "사용자"}
          </div>
          <div className="text-[11px] text-white/45 mt-0.5 truncate max-w-[130px]">
            {data?.profile.email ?? user?.email ?? ""}
          </div>
        </div>
      </div>

      {/* 설정 메뉴 */}
      <div className="hp-sb-sep">설정</div>
      {settingsItems.map((item) => (
        <button
          key={item.key}
          className={`hp-sb-item w-full text-left border-none bg-transparent${location.pathname === "/settings" && activePanel === item.key ? " active" : ""}`}
          onClick={() => {
            setActivePanel(item.key);
            if (location.pathname !== "/settings") navigate("/settings");
          }}
        >
          <span className="hp-sb-icon">{item.icon}</span>
          {item.label}
          {item.badge && item.key !== activePanel && (
            <span className="hp-sb-badge">1</span>
          )}
        </button>
      ))}

      {/* 알림 */}
      <div className="hp-sb-sep">알림</div>
      <button
        className={`hp-sb-item w-full text-left border-none bg-transparent${location.pathname === "/settings" && activePanel === "notifications" ? " active" : ""}`}
        onClick={() => { setActivePanel("notifications"); if (location.pathname !== "/settings") navigate("/settings"); }}
      >
        <span className="hp-sb-icon"><Bell size={18} /></span>알림 설정
      </button>
      <Link to="/notifications" className={`hp-sb-item${location.pathname.startsWith("/notifications") ? " active" : ""}`}>
        <span className="hp-sb-icon"><Inbox size={18} /></span>알림 내역
      </Link>
    </aside>
  );
}
