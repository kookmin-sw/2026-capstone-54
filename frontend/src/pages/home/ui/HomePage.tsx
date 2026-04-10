import { useEffect, useState } from "react";
import { useHomeStore } from "@/features/home";
import {
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

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <div className="hp-main">
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
    </div>
  );
}
