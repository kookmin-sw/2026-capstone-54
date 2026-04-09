import { useEffect, useState } from "react";
import { useHomeStore } from "@/features/home";
import {
  HomeNavbar,
  HomeSidebar,
  HomeHeader,
  QuickStartHero,
  StatsGrid,
  RecentSessions,
  StreakCalendar,
  JobStatus,
  LoadingSkeleton,
} from "./components";
import "./HomePage.css";

export function HomePage() {
  const { data, loading, fetchHome } = useHomeStore();
  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <>
      <div className="hp-wrap">
        <HomeNavbar menuOpen={menuOpen} onMenuToggle={() => setMenuOpen(!menuOpen)} />

        <div 
          className={`hp-sidebar-overlay${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        <div className="hp-shell">
          <HomeSidebar 
            menuOpen={menuOpen} 
            currentStreak={data?.currentStreak ?? 0}
            jdCount={data?.jobs.length ?? 0}
          />

          <main className="hp-main">
            {loading && !data ? (
              <LoadingSkeleton />
            ) : data ? (
              <>
                <HomeHeader
                  greeting={data.user.greeting}
                  userName={data.user.name}
                  lastInterviewDaysAgo={data.user.lastInterviewDaysAgo}
                />

                <QuickStartHero revealed={revealed} />

                <StatsGrid stats={data.stats} revealed={revealed} />

                <RecentSessions sessions={data.recentSessions} revealed={revealed} />

                <div className="hp-bottom">
                  <StreakCalendar streakData={data.streakData} revealed={revealed} />
                  <JobStatus jobs={data.jobs} revealed={revealed} />
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>

      {/* ── MOBILE TAB BAR ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-[rgba(255,255,255,.95)] backdrop-blur-[24px] border-t border-[#E5E7EB] flex items-center pb-[max(20px,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {[
          { icon: "🏠", label: "홈",    path: "/home", active: true },
          { icon: "🎤", label: "면접",  path: "/interview/setup" },
          { icon: "📄", label: "이력서", path: "/resume" },
          { icon: "📢", label: "공고",  path: "/jd" },
          { icon: "👤", label: "프로필", path: "#" },
        ].map((t) => (
          <a
            key={t.label}
            href={t.path}
            className="flex-1 flex flex-col items-center gap-[3px] cursor-pointer border-none bg-none py-1 no-underline"
          >
            <span className="text-[20px] leading-none">{t.icon}</span>
            <span className={`text-[10px] font-semibold ${t.active ? "text-[#0991B2]" : "text-[#9CA3AF]"}`}>{t.label}</span>
            <div className={`w-1 h-1 rounded-full bg-[#0991B2] mx-auto ${t.active ? "opacity-100" : "opacity-0"}`} />
          </a>
        ))}
      </nav>
    </>
  );
}
