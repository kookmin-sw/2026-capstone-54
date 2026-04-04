// Home API - Real backend integration with mock fallback

import { apiRequest } from "@/shared/api/client";

const USE_MOCK = true; // Set to false when backend is ready

export interface HomeUser {
  name: string;
  greeting: string;
  lastInterviewDaysAgo: number;
}

export interface HomeStat {
  icon: string;
  value: string | number;
  unit?: string;
  label: string;
  delta: string;
  deltaType: "up" | "down" | "neutral";
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
  streakData: number[];       // 0~4 intensity, 28 cells
  currentStreak: number;
  jobs: HomeJob[];
}

// Mock data fallback
const MOCK_DATA: HomeData = {
  user: {
    name: "김현준",
    greeting: "Good morning ☀️",
    lastInterviewDaysAgo: 2,
  },
  stats: [
    { icon: "🎯", value: 24,           label: "총 면접 횟수",    delta: "↑ 이번 주 +3",     deltaType: "up" },
    { icon: "📈", value: 82, unit: "점", label: "평균 점수",      delta: "↑ 지난주 대비 +7", deltaType: "up" },
    { icon: "🔥", value: 12, unit: "일", label: "현재 스트릭",    delta: "🏆 최장 기록!",     deltaType: "neutral" },
    { icon: "⏱️", value: 8,  unit: "h", label: "총 연습 시간",   delta: "↓ 목표 -2h",        deltaType: "down" },
  ],
  recentSessions: [
    { id: "s1", icon: "🏦", company: "카카오뱅크", badgeLabel: "꼬리질문",    badgeType: "accent",  role: "백엔드 개발자",    round: "1차 면접", date: "어제 오후 3:24",    score: 88 },
    { id: "s2", icon: "🛒", company: "쿠팡",       badgeLabel: "전체 프로세스", badgeType: "neutral", role: "서버 개발자",     round: "임원 면접", date: "3일 전 오전 11:10", score: 74 },
    { id: "s3", icon: "🟢", company: "네이버",     badgeLabel: "꼬리질문",    badgeType: "accent",  role: "플랫폼 개발",     round: "2차 면접", date: "5일 전 오후 7:45",   score: 79 },
  ],
  streakData: [0,0,1,0,2,1,0,3,2,1,3,4,0,0,3,4,4,3,2,1,4,4,3,0,0,1,2,3],
  currentStreak: 12,
  jobs: [
    { id: "j1", company: "카카오뱅크", role: "백엔드 개발자",  stage: "1차 면접 준비 중", dday: 3,  dotColor: "cyan" },
    { id: "j2", company: "토스",       role: "서버 개발자",    stage: "서류 심사 중",     dday: 7,  dotColor: "dark" },
    { id: "j3", company: "네이버",     role: "플랫폼 개발",    stage: "지원 완료",        dday: 12, dotColor: "gray" },
  ],
};

/**
 * Fetch home dashboard data from backend
 * GET /api/v1/home/dashboard/
 */
export async function fetchHomeDataApi(): Promise<{ success: boolean; data?: HomeData; error?: string }> {
  // Use mock data if backend is not ready
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true, data: MOCK_DATA };
  }

  try {
    const data = await apiRequest<Record<string, unknown>>(
      "/api/v1/home/dashboard/",
      { method: "GET", auth: true }
    );
    
    return {
      success: true,
      data: {
        user: {
          name: data.user?.name || "사용자",
          greeting: data.user?.greeting || "Good morning ☀️",
          lastInterviewDaysAgo: data.user?.last_interview_days_ago ?? 0,
        },
        stats: data.stats?.map((stat: { icon?: string; value?: number; unit?: string; label?: string; delta?: string; delta_type?: string }) => ({
          icon: stat.icon || "📊",
          value: stat.value ?? 0,
          unit: stat.unit,
          label: stat.label || "",
          delta: stat.delta || "",
          deltaType: stat.delta_type || "neutral",
        })) || [],
        recentSessions: data.recent_sessions?.map((session: { id?: string; icon?: string; company?: string; badge_label?: string; badge_type?: string; role?: string; round?: string; date?: string; score?: number }) => ({
          id: session.id || "",
          icon: session.icon || "🏢",
          company: session.company || "",
          badgeLabel: session.badge_label || "",
          badgeType: session.badge_type || "neutral",
          role: session.role || "",
          round: session.round || "",
          date: session.date || "",
          score: session.score ?? 0,
        })) || [],
        streakData: data.streak_data || Array(28).fill(0),
        currentStreak: data.current_streak ?? 0,
        jobs: data.jobs?.map((job: { id?: string; company?: string; role?: string; stage?: string; dday?: number; dot_color?: string }) => ({
          id: job.id || "",
          company: job.company || "",
          role: job.role || "",
          stage: job.stage || "",
          dday: job.dday ?? 0,
          dotColor: job.dot_color || "gray",
        })) || [],
      },
    };
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return { success: true, data: MOCK_DATA };
  }
}
