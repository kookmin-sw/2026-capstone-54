import { useState } from "react";
import { useLocation } from "react-router-dom";
import { HomeNavbar } from "@/pages/home/ui/components/HomeNavbar";
import { HomeSidebar } from "@/pages/home/ui/components/HomeSidebar";
import { SettingsSidebar } from "@/pages/home/ui/components/SettingsSidebar";
import { useHomeStore } from "@/features/home";
import { useNotificationToast } from "@/features/notifications";
import "@/pages/home/ui/HomePage.css";

interface AppLayoutProps {
  children: React.ReactNode;
}

/** Pages that use their own full-screen layout (no nav/sidebar) */
const FULL_SCREEN_PREFIXES = ["/interview/session/", "/interview/precheck/", "/verify-email", "/onboarding"];

export function AppLayout({ children }: AppLayoutProps) {
  useNotificationToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { data } = useHomeStore();

  const isSettingsArea = location.pathname.startsWith("/settings") || location.pathname.startsWith("/notifications");

  // Full-screen pages bypass the shared layout entirely
  if (FULL_SCREEN_PREFIXES.some((p) => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
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
          />
        )}
        <main className="hp-page-main">{children}</main>
      </div>
    </div>
  );
}
