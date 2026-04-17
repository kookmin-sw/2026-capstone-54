import { create } from "zustand";
import { RealtimeClient } from "@/shared/api/realtimeApi";
import type { WsNotificationMessage } from "@/shared/api/realtimeApi";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
  clearAllNotifications,
} from "../api/notificationsApi";

export interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
  category: "interview" | "resume" | "jd" | "system";
  notifiableType: string | null;
  notifiableId: string | null;
}

function formatTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 172800) return "어제";
  return `${Math.floor(diff / 86400)}일 전`;
}

function wsMessageToNotification(msg: WsNotificationMessage): Notification {
  return {
    id: msg.id,
    message: msg.message,
    time: formatTime(msg.createdAt),
    read: false,
    category: msg.category,
    notifiableType: msg.notifiableType,
    notifiableId: msg.notifiableId,
  };
}

interface NotificationState {
  notifications: Notification[];
  connected: boolean;
  fetchInitial: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAll: () => Promise<void>;
  connectWs: () => void;
  disconnectWs: () => void;
}

let _client: RealtimeClient | null = null;

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  connected: false,

  fetchInitial: async () => {
    const notifications = await fetchNotifications();
    set({ notifications });
  },

  markAllRead: async () => {
    await markAllNotificationsRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  markRead: async (id) => {
    await markNotificationRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  deleteNotification: async (id) => {
    await apiDeleteNotification(id);
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    }));
  },

  deleteAll: async () => {
    await clearAllNotifications();
    set({ notifications: [] });
  },

  connectWs: () => {
    if (_client) return; // 이미 연결 중
    _client = new RealtimeClient({
      onMessage: (msg) => {
        set((s) => ({
          notifications: [wsMessageToNotification(msg), ...s.notifications],
        }));
      },
      onClose: () => set({ connected: false }),
    });
    _client.connect().then(() => {
      set({ connected: true });
      // WS 연결 성공 시 서버에서 초기 알림 목록 로드
      get().fetchInitial();
    });
  },

  disconnectWs: () => {
    _client?.disconnect();
    _client = null;
    set({ connected: false });
  },
}));
