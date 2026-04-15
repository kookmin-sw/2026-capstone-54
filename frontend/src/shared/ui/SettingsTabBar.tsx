/** 설정 화면 전용 모바일 하단 탭 바. 설정 패널 간 이동에 사용한다. */
import { useNavigate, useLocation } from "react-router-dom";
import { useSettingsStore } from "@/features/settings";
import type { SettingsPanel } from "@/features/settings";

const SETTING_TABS: { key: SettingsPanel; icon: string; label: string }[] = [
  { key: "profile",       icon: "👤", label: "프로필"    },
  { key: "password",      icon: "🔑", label: "비밀번호"  },
  { key: "notifications", icon: "🔔", label: "알림 설정" },
  { key: "subscription",  icon: "💎", label: "요금제"    },
  { key: "consent",       icon: "📋", label: "동의 관리" },
];

export function SettingsTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activePanel, setActivePanel } = useSettingsStore();

  const isNotifications = location.pathname.startsWith("/notifications");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-[rgba(255,255,255,.95)] backdrop-blur-[24px] border-t border-[#E5E7EB] flex items-center pb-[max(20px,env(safe-area-inset-bottom))] pt-2 md:hidden overflow-x-auto">
      {SETTING_TABS.map((tab) => {
        const isActive = !isNotifications && activePanel === tab.key;
        return (
          <button
            key={tab.key}
            className="flex-1 min-w-[60px] flex flex-col items-center gap-[3px] cursor-pointer border-none bg-none py-1"
            onClick={() => { setActivePanel(tab.key); navigate("/settings"); }}
          >
            <span className="text-[20px] leading-none">{tab.icon}</span>
            <span className={`text-[10px] font-semibold whitespace-nowrap ${isActive ? "text-[#0991B2]" : "text-[#9CA3AF]"}`}>
              {tab.label}
            </span>
            <div className={`w-1 h-1 rounded-full bg-[#0991B2] mx-auto ${isActive ? "opacity-100" : "opacity-0"}`} />
          </button>
        );
      })}
      {/* 알림 내역 탭 */}
      <button
        className="flex-1 min-w-[60px] flex flex-col items-center gap-[3px] cursor-pointer border-none bg-none py-1"
        onClick={() => navigate("/notifications")}
      >
        <span className="text-[20px] leading-none">🔔</span>
        <span className={`text-[10px] font-semibold whitespace-nowrap ${isNotifications ? "text-[#0991B2]" : "text-[#9CA3AF]"}`}>
          알림 내역
        </span>
        <div className={`w-1 h-1 rounded-full bg-[#0991B2] mx-auto ${isNotifications ? "opacity-100" : "opacity-0"}`} />
      </button>
    </nav>
  );
}
