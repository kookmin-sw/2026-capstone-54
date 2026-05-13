import { userApi } from "@/shared/api/userApi";
import { getTimeBasedGreeting } from "@/shared/lib/format/greeting";

import { fetchDashboardStatisticsApi, type DashboardStatistics } from "./dashboardApi";

export interface HomeUser {
  name: string;
  greeting: string;
  lastInterviewDaysAgo: number | null;
}

export interface HomeStat {
  icon: string;
  value: string | number;
  unit?: string;
  label: string;
}

export interface HomeSession {
  id: string;
  icon: string;
  company: string;
  badgeLabel: string;
  badgeType: "accent" | "neutral";
  role: string;
  round: string;
  date: string;
  score: number;
}

export interface HomeJob {
  id: string;
  company: string;
  role: string;
  stage: string;
  dday: number;
  dotColor: "cyan" | "dark" | "gray";
}

export interface HomeData {
  user: HomeUser;
  stats: HomeStat[];
  recentSessions: HomeSession[];
  streakData: number[];
  currentStreak: number;
  jobs: HomeJob[];
}

const PLACEHOLDER_STATS: HomeStat[] = [
  { icon: "target", value: 0, label: "총 면접 횟수" },
  { icon: "trending-up", value: "-", unit: "점", label: "평균 점수" },
  { icon: "flame", value: 0, unit: "일", label: "현재 스트릭" },
  { icon: "timer", value: 0, unit: "h", label: "총 연습 시간" },
];

const MOCK_DATA: HomeData = {
  user: {
    name: "사용자",
    greeting: getTimeBasedGreeting(),
    lastInterviewDaysAgo: 0,
  },
  stats: PLACEHOLDER_STATS,
  recentSessions: [
    { id: "s1", icon: "🏦", company: "카카오뱅크", badgeLabel: "꼬리질문",    badgeType: "accent",  role: "백엔드 개발자",    round: "1차 면접", date: "어제 오후 3:24",    score: 88 },
    { id: "s2", icon: "🛒", company: "쿠팡",       badgeLabel: "전체 프로세스", badgeType: "neutral", role: "서버 개발자",     round: "임원 면접", date: "3일 전 오전 11:10", score: 74 },
    { id: "s3", icon: "🟢", company: "네이버",     badgeLabel: "꼬리질문",    badgeType: "accent",  role: "플랫폼 개발",     round: "2차 면접", date: "5일 전 오후 7:45",   score: 79 },
  ],
  streakData: [0,0,1,0,2,1,0,3,2,1,3,4,0,0,3,4,4,3,2,1,4,4,3,0,0,1,2,3],
  currentStreak: 0,
  jobs: [
    { id: "j1", company: "카카오뱅크", role: "백엔드 개발자",  stage: "1차 면접 준비 중", dday: 3,  dotColor: "cyan" },
    { id: "j2", company: "토스",       role: "서버 개발자",    stage: "서류 심사 중",     dday: 7,  dotColor: "dark" },
    { id: "j3", company: "네이버",     role: "플랫폼 개발",    stage: "지원 완료",        dday: 12, dotColor: "gray" },
  ],
};

function formatPracticeTime(seconds: number): { value: number; unit: string } {
  if (seconds <= 0) return { value: 0, unit: "h" };
  if (seconds < 3600) {
    return { value: Math.round(seconds / 60), unit: "분" };
  }
  return { value: Math.round((seconds / 3600) * 10) / 10, unit: "h" };
}

function calcDaysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function buildStatsFromDashboard(stats: DashboardStatistics): HomeStat[] {
  const practice = formatPracticeTime(stats.totalPracticeTimeSeconds);

  return [
    {
      icon: "target",
      value: stats.totalCompletedInterviews,
      label: "총 면접 횟수",
    },
    {
      icon: "trending-up",
      value: stats.averageScore ?? "-",
      unit: "점",
      label: "평균 점수",
    },
    {
      icon: "flame",
      value: stats.currentStreakDays,
      unit: "일",
      label: "현재 스트릭",
    },
    {
      icon: "timer",
      value: practice.value,
      unit: practice.unit,
      label: "총 연습 시간",
    },
  ];
}

export async function fetchHomeDataApi(): Promise<{ success: boolean; data?: HomeData; error?: string }> {
  let userName = MOCK_DATA.user.name;
  let stats: HomeStat[] = PLACEHOLDER_STATS;
  let currentStreak = 0;
  let lastInterviewDaysAgo: number | null = null;
  const errorMessages: string[] = [];

  try {
    const userData = await userApi.getMe();
    userName = userData.name || MOCK_DATA.user.name;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    errorMessages.push(error instanceof Error ? error.message : "사용자 정보를 불러오지 못했습니다.");
  }

  try {
    const dashboardStats = await fetchDashboardStatisticsApi();
    stats = buildStatsFromDashboard(dashboardStats);
    currentStreak = dashboardStats.currentStreakDays;
    lastInterviewDaysAgo = calcDaysAgo(dashboardStats.lastParticipatedDate);
  } catch (error) {
    console.error("Failed to fetch dashboard statistics:", error);
    errorMessages.push(error instanceof Error ? error.message : "대시보드 통계를 불러오지 못했습니다.");
  }

  return {
    success: errorMessages.length === 0,
    data: {
      ...MOCK_DATA,
      user: { ...MOCK_DATA.user, name: userName, lastInterviewDaysAgo },
      stats,
      currentStreak,
    },
    error: errorMessages.length > 0 ? errorMessages.join(" / ") : undefined,
  };
}
