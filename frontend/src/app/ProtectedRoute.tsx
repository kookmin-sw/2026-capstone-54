import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth";
import { AppLayout } from "./AppLayout";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuthStore();
  const toastFired = useRef(false);

  useEffect(() => {
    if (authReady && !user && !toastFired.current) {
      toastFired.current = true;
      toast.error("로그인해주세요.", { duration: 3000 });
    }
  }, [authReady, user]);

  if (!authReady) return null;
  if (!user) return <Navigate to="/" replace />;

  return <AppLayout>{children}</AppLayout>;
}
