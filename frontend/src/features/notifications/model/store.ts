import { create } from "zustand";

export interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
  category: "interview" | "resume" | "jd" | "system";
}

// 프론트 확인용 더미 데이터
const DUMMY_NOTIFICATIONS: Notification[] = [
  { id: 1, message: "새로운 채용공고가 등록되었습니다.", time: "방금 전", read: false, category: "jd" },
  { id: 2, message: "이력서 분석이 완료되었습니다.", time: "10분 전", read: false, category: "resume" },
  { id: 3, message: "면접 연습 결과를 확인해보세요.", time: "1시간 전", read: true, category: "interview" },
  { id: 4, message: "스트릭 7일 달성! 보상이 지급되었습니다.", time: "어제", read: true, category: "system" },
  { id: 5, message: "채용공고 '카카오 프론트엔드' 마감이 3일 남았습니다.", time: "2일 전", read: true, category: "jd" },
  { id: 6, message: "AI 면접 리포트가 생성되었습니다.", time: "3일 전", read: true, category: "interview" },
];

interface NotificationState {
  notifications: Notification[];
  markAllRead: () => void;
  markRead: (id: number) => void;
  deleteNotification: (id: number) => void;
  deleteAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: DUMMY_NOTIFICATIONS,
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  deleteNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  deleteAll: () => set({ notifications: [] }),
}));
