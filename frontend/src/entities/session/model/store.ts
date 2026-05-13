import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  initial: string; // 아바타에 표시할 이니셜 (예: "김", "이")
}

interface SessionState {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
      
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: "session-storage",
    }
  )
);
