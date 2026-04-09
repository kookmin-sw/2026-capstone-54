import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth";

/**
 * 인증이 필요한 라우트를 감싸는 가드 컴포넌트.
 * - initAuth() 완료 전(authReady=false)에는 아무것도 렌더하지 않음
 * - 비로그인 상태면 토스트 메시지 + 소개 페이지(/)로 리다이렉트
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuthStore();
  const toastFired = useRef(false);

  useEffect(() => {
    if (authReady && !user && !toastFired.current) {
      toastFired.current = true;
      toast.error("로그인해주세요.", { duration: 3000 });
    }
  }, [authReady, user]);

  // 아직 초기화 중이면 빈 화면 유지
  if (!authReady) return null;

  // 비로그인 → 소개 페이지로
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
}
