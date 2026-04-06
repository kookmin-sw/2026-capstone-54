import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStreakStore } from "@/features/streak";
import { StreakHero } from "./components/StreakHero";
import { StreakStats } from "./components/StreakStats";
import { StreakCalendar } from "./components/StreakCalendar";
import { RewardHistory } from "./components/RewardHistory";
import { NextReward } from "./components/NextReward";
import { Milestones } from "./components/Milestones";

export function StreakPage() {
  const { data, loading, fetchStreak } = useStreakStore();

  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <>
      {/* NAV */}
      <nav className="sticky top-0 z-[200] bg-white/[.92] backdrop-blur-[20px] border-b border-[#E5E7EB] h-[60px] flex items-center px-8 gap-3 max-sm:px-4">
        <Link
          to="/home"
          className="text-[20px] font-black text-[#0A0A0A] no-underline tracking-[-0.4px] mr-auto"
        >
          me<span className="text-[#0991B2]">Fit</span>
        </Link>
        <Link
          to="/home"
          className="text-[13px] font-semibold text-[#6B7280] no-underline py-1.5 px-3 rounded-lg transition-colors hover:text-[#0A0A0A] hover:bg-[#F9FAFB]"
        >
          ← 홈으로
        </Link>
        <Link
          to="/interview/setup"
          className="text-[13px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg py-[9px] px-[18px] cursor-pointer no-underline whitespace-nowrap inline-flex items-center gap-[5px] transition-[opacity,transform] hover:opacity-85 hover:-translate-y-px"
        >
          면접 시작 →
        </Link>
      </nav>

      <div className="bg-white min-h-[calc(100vh-60px)] p-8 max-w-container mx-auto max-sm:p-[20px_16px]">
        {loading && !data ? (
          <div className="flex flex-col gap-4">
            <div className="skeleton-gray rounded-lg" style={{ height: 180 }} />
            <div className="grid grid-cols-3 gap-3.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-gray rounded-lg" style={{ height: 110 }} />
              ))}
            </div>
            <div className="grid grid-cols-[1fr_340px] gap-5">
              <div className="skeleton-gray rounded-lg" style={{ height: 360 }} />
              <div className="skeleton-gray rounded-lg" style={{ height: 360 }} />
            </div>
          </div>
        ) : data ? (
          <>
            <StreakHero
              currentStreak={data.currentStreak}
              bestStreak={data.bestStreak}
              totalDays={data.totalDays}
              rewardsCount={data.rewardsCount}
              todayCompleted={data.todayCompleted}
            />

            <StreakStats
              bestStreak={data.bestStreak}
              totalDays={data.totalDays}
              rewardsCount={data.rewardsCount}
              revealed={revealed}
            />

            <div className="grid grid-cols-[1fr_340px] gap-5 items-start max-[960px]:grid-cols-1">
              <div className="flex flex-col gap-4">
                <StreakCalendar
                  calendarDoneMap={data.calendarDoneMap}
                  revealed={revealed}
                  todayYear={todayY}
                  todayMonth={todayM}
                  todayDay={todayD}
                />

                <RewardHistory rewardHistory={data.rewardHistory} revealed={revealed} />
              </div>

              <div className="flex flex-col gap-4">
                <NextReward
                  nextReward={data.nextReward}
                  currentStreak={data.currentStreak}
                  revealed={revealed}
                />

                <Milestones milestones={data.milestones} revealed={revealed} />

                <div
                  className={`bg-[#0A0A0A] rounded-xl p-[24px_26px] flex items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,.14)] relative overflow-hidden max-sm:flex-col max-sm:items-start sk-rv${
                    revealed ? " sk-rv-in" : ""
                  }`}
                  style={{ transitionDelay: "200ms" }}
                >
                  <div className="absolute w-[160px] h-[160px] bg-[rgba(9,145,178,.1)] blur-[50px] rounded-full -top-[50px] right-20 pointer-events-none" />
                  <div className="relative z-[1]">
                    <div className="text-base font-black text-white mb-1">오늘의 면접 시작하기</div>
                    <div className="text-[12px] text-white/45 leading-[1.55]">
                      {data.nextReward.daysRemaining}일만 더 하면 보상이 기다려요.
                      <br />
                      지금 바로 이어가세요 🔥
                    </div>
                  </div>
                  <Link
                    to="/interview/setup"
                    className="relative z-[1] text-[13px] font-bold text-[#0A0A0A] bg-white border-none rounded-lg py-[11px] px-5 cursor-pointer whitespace-nowrap no-underline transition-all hover:bg-[#F3F4F6] hover:-translate-y-0.5 inline-block max-sm:w-full max-sm:text-center"
                  >
                    면접 시작 →
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
