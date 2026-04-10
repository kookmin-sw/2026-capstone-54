import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "@/features/auth";
import { ProtectedRoute } from "./ProtectedRoute";

import { LandingPage } from "@/pages/landing";
import { SignUpPage } from "@/pages/sign-up";
import { LoginPage } from "@/pages/login";
import { VerifyEmailPage } from "@/pages/verify-email";
import { OnboardingPage } from "@/pages/onboarding";
import { HomePage } from "@/pages/home";
import { JdAddPage } from "@/pages/jd-add";
import { JdAnalyzingPage } from "@/pages/jd-analyzing";
import { JdDetailPage } from "@/pages/jd-detail";
import { JdEditPage } from "@/pages/jd-edit";
import { JdListPage } from "@/pages/jd-list";
import { ResumeInputPage } from "@/pages/resume-input";
import { ResumeUploadPage } from "@/pages/resume-upload";
import { ResumeListPage } from "@/pages/resume-list";
import { InterviewSetupPage } from "@/pages/interview-setup";
import { InterviewPreCheckPage } from "@/pages/interview-precheck";
import { SettingsPage } from "@/pages/settings";
import { StreakPage } from "@/pages/streak";
import { SubscriptionPage } from "@/pages/subscription";
import { NotificationsPage } from "@/pages/notifications";

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/jd/add" element={<ProtectedRoute><JdAddPage /></ProtectedRoute>} />
        <Route path="/jd/analyzing" element={<ProtectedRoute><JdAnalyzingPage /></ProtectedRoute>} />
        <Route path="/jd/detail/:id" element={<ProtectedRoute><JdDetailPage /></ProtectedRoute>} />
        <Route path="/jd/edit/:id" element={<ProtectedRoute><JdEditPage /></ProtectedRoute>} />
        <Route path="/jd" element={<ProtectedRoute><JdListPage /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeListPage /></ProtectedRoute>} />
        <Route path="/resume/input" element={<ProtectedRoute><ResumeInputPage /></ProtectedRoute>} />
        <Route path="/resume/upload" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
        <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
        <Route path="/interview/precheck" element={<ProtectedRoute><InterviewPreCheckPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/streak" element={<ProtectedRoute><StreakPage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
