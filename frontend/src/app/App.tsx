import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "@/features/auth";
import { useNotificationStore } from "@/features/notifications";
import { setOnRefreshFailed } from "@/shared/api/client";
import { ProtectedRoute } from "./ProtectedRoute";

import { LandingPage } from "@/pages/landing";
import { SignUpPage } from "@/pages/sign-up";
import { LoginPage } from "@/pages/login";
import { VerifyEmailPage } from "@/pages/verify-email";
import { OnboardingPage } from "@/pages/onboarding";
import { JdAddPage } from "@/pages/jd-add";
import { JdDetailPage } from "@/pages/jd-detail";
import { JdListPage } from "@/pages/jd-list";
import { ResumeNewPage } from "@/pages/resume-new";
import { ResumeListPage } from "@/pages/resume-list";
import { ResumeDetailPage } from "@/pages/resume-detail";
import { InterviewSetupPage } from "@/pages/interview-setup";
import { InterviewPreCheckPage } from "@/pages/interview-precheck";
import { InterviewSessionPage } from "@/pages/interview-session";
import { InterviewReportPage } from "@/pages/interview-report";
import { InterviewResultsPage } from "@/pages/interview-results";
import { SettingsPage } from "@/pages/settings";
import { StreakPage } from "@/pages/streak";
import { SubscriptionPage } from "@/pages/subscription";
import { NotificationsPage } from "@/pages/notifications";

function App() {
  const { initAuth, logout, user } = useAuthStore();
  const { connectWs, disconnectWs } = useNotificationStore();

  useEffect(() => {
    setOnRefreshFailed(() => logout());
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 로그인 상태 변화에 따라 WebSocket 연결/해제
  useEffect(() => {
    if (user) {
      connectWs();
    } else {
      disconnectWs();
    }
  }, [user, connectWs, disconnectWs]);

  return (
    <BrowserRouter>
      {/* 전역 토스트 컨테이너 */}
      <Toaster position="bottom-right" richColors />

      <Routes>
        {/* ── 공개 라우트 (로그인 불필요) ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* ── 보호 라우트 (로그인 필요) ── */}
        <Route path="/jd/add" element={<ProtectedRoute><JdAddPage /></ProtectedRoute>} />
        <Route path="/jd/:uuid" element={<ProtectedRoute><JdDetailPage /></ProtectedRoute>} />
        <Route path="/jd" element={<ProtectedRoute><JdListPage /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeListPage /></ProtectedRoute>} />
        <Route path="/resume/new" element={<ProtectedRoute><ResumeNewPage /></ProtectedRoute>} />
        <Route path="/resume/:uuid" element={<ProtectedRoute><ResumeDetailPage /></ProtectedRoute>} />
        <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
        <Route path="/interview/precheck/:interviewSessionUuid" element={<ProtectedRoute><InterviewPreCheckPage /></ProtectedRoute>} />
        <Route path="/interview/session/:interviewSessionUuid" element={<ProtectedRoute><InterviewSessionPage /></ProtectedRoute>} />
        <Route path="/interview/session/:interviewSessionUuid/report" element={<ProtectedRoute><InterviewReportPage /></ProtectedRoute>} />
        <Route path="/interview/results" element={<ProtectedRoute><InterviewResultsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/streak" element={<ProtectedRoute><StreakPage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
