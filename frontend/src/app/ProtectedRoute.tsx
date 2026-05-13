import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth";
import { AppLayout } from "./AppLayout";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuthStore();
  const toastFired = useRef(false);
  // 마운트 시점에 user가 있었는지 기록 — 있었다가 null이 된 경우(세션 만료)에만 토스트
  const hadUser = useRef(false);

  useEffect(() => {
    if (user) {
      hadUser.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (authReady && !user && hadUser.current && !toastFired.current) {
      toastFired.current = true;
      toast.error("로그인해주세요.", { duration: 3000 });
    }
  }, [authReady, user]);

  if (!authReady) return null;
  if (!user) return <Navigate to="/" replace />;

  return <AppLayout>{children}</AppLayout>;
}
