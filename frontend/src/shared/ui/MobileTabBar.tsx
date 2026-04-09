import { useNavigate } from "react-router-dom";

interface TabItem {
  icon: string;
  label: string;
  path: string;
}

interface MobileTabBarProps {
  activeTab: "home" | "interview" | "resume" | "jd" | "settings";
}

const TAB_ITEMS: TabItem[] = [
  { icon: "🏠", label: "홈", path: "/home" },
  { icon: "🎤", label: "면접", path: "/interview/setup" },
  { icon: "📄", label: "이력서", path: "/resume" },
  { icon: "📢", label: "공고", path: "/jd" },
  { icon: "👤", label: "프로필", path: "/settings" },
];

const TAB_MAP: Record<string, string> = {
  home: "/home",
  interview: "/interview/setup",
  resume: "/resume",
  jd: "/jd",
  settings: "/settings",
};

export function MobileTabBar({ activeTab }: MobileTabBarProps) {
  const navigate = useNavigate();
  const activePath = TAB_MAP[activeTab];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-[rgba(255,255,255,.95)] backdrop-blur-[24px] border-t border-[#E5E7EB] flex items-center pb-[max(20px,env(safe-area-inset-bottom))] pt-2 md:hidden">
      {TAB_ITEMS.map((tab) => {
        const isActive = tab.path === activePath;
        return (
          <button
            key={tab.label}
            className="flex-1 flex flex-col items-center gap-[3px] cursor-pointer border-none bg-none py-1"
            onClick={() => navigate(tab.path)}
          >
            <span className="text-[20px] leading-none">{tab.icon}</span>
            <span
              className={`text-[10px] font-semibold ${
                isActive ? "text-[#0991B2]" : "text-[#9CA3AF]"
              }`}
            >
              {tab.label}
            </span>
            <div
              className={`w-1 h-1 rounded-full bg-[#0991B2] mx-auto ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
