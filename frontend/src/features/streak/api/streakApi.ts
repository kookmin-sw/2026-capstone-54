import { apiRequest } from "@/shared/api/client";

/* ── Types ── */
export interface StreakMilestone {
  days: number;
  reward: string;
  rewardIcon: string;
  status: "achieved" | "next" | "locked";
  daysRemaining: number;
}

export interface StreakRewardHistory {
  id: string;
  icon: string;
  iconBg: "cyan" | "green" | "amber";
  title: string;
  description: string;
  date: string;
}

export interface StreakNextReward {
  targetDays: number;
  daysRemaining: number;
  progress: number;
  reward: string;
  rewardDetail: string;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  rewardsCount: number;
  todayCompleted: boolean;
  /** key: "YYYY-M", value: array of completed day numbers */
  calendarDoneMap: Record<string, number[]>;
  nextReward: StreakNextReward;
  milestones: StreakMilestone[];
  rewardHistory: StreakRewardHistory[];
}

/* ── API Response Types ── */
interface StreakStatisticsResponse {
  currentStreak: number;
  longestStreak: number;
  lastParticipatedDate: string | null;
}

interface StreakLogEntry {
  date: string; // "YYYY-MM-DD"
  interviewResultsCount: number;
}

/* ── Helpers ── */
function buildCalendarDoneMap(logs: StreakLogEntry[]): Record<string, number[]> {
  const map: Record<string, number[]> = {};
  for (const log of logs) {
    if (log.interviewResultsCount < 1) continue;
    const [year, month, day] = log.date.split("-").map(Number);
    const key = `${year}-${month}`;
    if (!map[key]) map[key] = [];
    map[key].push(day);
  }
  return map;
}

function buildMilestones(currentStreak: number): StreakMilestone[] {
  const MILESTONES = [
    { days: 7,  reward: "시선 추적 5회 제공",       rewardIcon: "👁️" },
    { days: 14, reward: "시선 추적 3회 제공",        rewardIcon: "🔥" },
    { days: 30, reward: "실전 모드 5회 제공",        rewardIcon: "⚡" },
    { days: 60, reward: "상세 리포트 PDF 10회 제공", rewardIcon: "📄" },
  ];
  return MILESTONES.map((m) => {
    const daysRemaining = Math.max(0, m.days - currentStreak);
    const status: StreakMilestone["status"] =
      currentStreak >= m.days ? "achieved" : daysRemaining === m.days - currentStreak && daysRemaining <= 7 ? "next" : "locked";
    return { ...m, status: currentStreak >= m.days ? "achieved" : status, daysRemaining };
  });
}

function buildNextReward(currentStreak: number): StreakNextReward {
  const TARGETS = [7, 14, 30, 60];
  const REWARDS = [
    { reward: "시선 추적 5회", detail: "7일 연속 달성 시 시선 추적 분석 5회를 무료로 받을 수 있어요." },
    { reward: "시선 추적 3회", detail: "14일 연속 달성 시 시선 추적 분석 3회를 무료로 받을 수 있어요." },
    { reward: "실전 모드 5회", detail: "30일 연속 달성 시 실전 모드 5회를 무료로 받을 수 있어요." },
    { reward: "상세 리포트 PDF 10회", detail: "60일 연속 달성 시 상세 리포트 PDF 10회를 무료로 받을 수 있어요." },
  ];
  const idx = TARGETS.findIndex((t) => currentStreak < t);
  const target = idx === -1 ? TARGETS[TARGETS.length - 1] : TARGETS[idx];
  const info = idx === -1 ? REWARDS[REWARDS.length - 1] : REWARDS[idx];
  const daysRemaining = Math.max(0, target - currentStreak);
  const progress = Math.min(100, Math.round((currentStreak / target) * 100));
  return { targetDays: target, daysRemaining, progress, reward: info.reward, rewardDetail: info.detail };
}

/* ── Fetch Streak Data ── */
export async function fetchStreakApi(): Promise<{ success: boolean; data?: StreakData; error?: string }> {
  try {
    // 통계 + 최근 6개월 로그 병렬 조회
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = now.toISOString().slice(0, 10);

    const [stats, logs] = await Promise.all([
      apiRequest<StreakStatisticsResponse>("/api/v1/streaks/statistics/", { auth: true }),
      apiRequest<StreakLogEntry[]>(`/api/v1/streaks/logs/?start_date=${startStr}&end_date=${endStr}`, { auth: true }),
    ]);

    const logsArray = Array.isArray(logs) ? logs : [];
    const today = now.toISOString().slice(0, 10);
    const todayLog = logsArray.find((l) => l.date === today);
    const todayCompleted = (todayLog?.interviewResultsCount ?? 0) > 0;
    const totalDays = logsArray.filter((l) => l.interviewResultsCount > 0).length;

    const data: StreakData = {
      currentStreak: stats.currentStreak,
      bestStreak: stats.longestStreak,
      totalDays,
      rewardsCount: 0,
      todayCompleted,
      calendarDoneMap: buildCalendarDoneMap(logsArray),
      nextReward: buildNextReward(stats.currentStreak),
      milestones: buildMilestones(stats.currentStreak),
      rewardHistory: [],
    };

    return { success: true, data };
  } catch {
    return { success: false, error: "스트릭 정보를 불러오지 못했습니다." };
  }
}
