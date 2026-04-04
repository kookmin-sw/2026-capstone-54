// Streak API — Mocked (set USE_MOCK = false when backend is ready)

const USE_MOCK = true;

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
  progress: number; // 0–100
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

/* ── Mock Data ── */
const getMockData = (): StreakData => ({
  currentStreak: 12,
  bestStreak: 28,
  totalDays: 43,
  rewardsCount: 3,
  todayCompleted: true,
  calendarDoneMap: {
    "2026-4": [1, 2, 3],
    "2026-3": [1, 3, 4, 5, 6, 7, 8, 10, 12, 14, 15, 16, 17, 18, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31],
    "2026-2": [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21],
    "2025-12": [10, 11, 12, 15, 16, 17, 20, 21, 22, 23, 24],
  },
  nextReward: {
    targetDays: 14,
    daysRemaining: 2,
    progress: 86,
    reward: "시선 추적 3회",
    rewardDetail: "14일 연속 달성 시 시선 추적 분석 3회를 무료로 받을 수 있어요. 오늘도 면접 연습으로 스트릭을 이어가세요!",
  },
  milestones: [
    { days: 7,  reward: "시선 추적 5회 제공",       rewardIcon: "👁️", status: "achieved", daysRemaining: 0  },
    { days: 14, reward: "시선 추적 3회 제공",        rewardIcon: "🔥", status: "next",     daysRemaining: 2  },
    { days: 30, reward: "실전 모드 5회 제공",        rewardIcon: "🔒", status: "locked",   daysRemaining: 18 },
    { days: 60, reward: "상세 리포트 PDF 10회 제공", rewardIcon: "🔒", status: "locked",   daysRemaining: 48 },
  ],
  rewardHistory: [
    {
      id: "r1",
      icon: "👁️",
      iconBg: "cyan",
      title: "시선 추적 5회 제공",
      description: "7일 스트릭 달성",
      date: "2026.04.01",
    },
    {
      id: "r2",
      icon: "⚡",
      iconBg: "green",
      title: "실전 모드 3회 제공",
      description: "30일 스트릭 달성",
      date: "2026.03.20",
    },
    {
      id: "r3",
      icon: "📄",
      iconBg: "amber",
      title: "상세 리포트 PDF 3회 제공",
      description: "7일 스트릭 달성",
      date: "2026.02.14",
    },
  ],
});

/* ── Fetch Streak Data ── */
export async function fetchStreakApi(): Promise<{ success: boolean; data?: StreakData; error?: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 380));
    return { success: true, data: getMockData() };
  }
  try {
    const res = await fetch("/api/v1/streak/", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return { success: true, data: getMockData() };
    const json = await res.json();
    return { success: true, data: json };
  } catch {
    return { success: true, data: getMockData() };
  }
}
