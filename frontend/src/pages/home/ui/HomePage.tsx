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
    </>
  );
}
