import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MobileTabBar, SettingsTabBar } from "@/shared/ui";
import { HomeNavbar } from "@/pages/home/ui/components/HomeNavbar";
import { HomeSidebar } from "@/pages/home/ui/components/HomeSidebar";
import { SettingsSidebar } from "@/pages/home/ui/components/SettingsSidebar";
import { useHomeStore } from "@/features/home";
import "@/pages/home/ui/HomePage.css";

type ActiveTab = "home" | "interview" | "resume" | "jd" | "settings";

function getActiveTab(pathname: string): ActiveTab {
  if (pathname.startsWith("/interview")) return "interview";
  if (pathname.startsWith("/resume")) return "resume";
  if (pathname.startsWith("/jd")) return "jd";
  if (pathname.startsWith("/settings")) return "settings";
  return "home";
}

interface AppLayoutProps {
  children: React.ReactNode;
}

/** Pages that use their own full-screen layout (no nav/sidebar) */
const FULL_SCREEN_PREFIXES = ["/interview/session/"];

export function AppLayout({ children }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { data } = useHomeStore();

  const activeTab = getActiveTab(location.pathname);
  const isSettingsArea = location.pathname.startsWith("/settings") || location.pathname.startsWith("/notifications");

  // Full-screen pages bypass the shared layout entirely
  if (FULL_SCREEN_PREFIXES.some((p) => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="hp-wrap">
        <HomeNavbar
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((v) => !v)}
        />
        <div
          className={`hp-sidebar-overlay${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(false)}
        />
        <div className="hp-shell">
          {isSettingsArea ? (
            <SettingsSidebar menuOpen={menuOpen} />
          ) : (
            <HomeSidebar
              menuOpen={menuOpen}
              currentStreak={data?.currentStreak ?? 0}
              jdCount={data?.jobs.length ?? 0}
            />
          )}
          <main className="hp-page-main">{children}</main>
        </div>
      </div>
      {isSettingsArea ? <SettingsTabBar /> : <MobileTabBar activeTab={activeTab} />}
    </>
  );
}
