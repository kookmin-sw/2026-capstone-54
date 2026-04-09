import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/features/auth";
import { LandingPage } from "@/pages/landing";
import { InterviewPreCheckPage } from "@/pages/interview-precheck";
import { SignUpPage } from "@/pages/sign-up";
import { LoginPage } from "@/pages/login";
import { VerifyEmailPage } from "@/pages/verify-email";
import { OnboardingPage } from "@/pages/onboarding";
import { JdAddPage } from "@/pages/jd-add";
import { JdAnalyzingPage } from "@/pages/jd-analyzing";
import { JdDetailPage } from "@/pages/jd-detail";
import { JdEditPage } from "@/pages/jd-edit";
import { JdListPage } from "@/pages/jd-list";
import { ResumeInputPage } from "@/pages/resume-input";
import { ResumeUploadPage } from "@/pages/resume-upload";
import { ResumeListPage } from "@/pages/resume-list";
import { HomePage } from "@/pages/home";
import { InterviewSetupPage } from "@/pages/interview-setup";
import { SettingsPage } from "@/pages/settings";
import { StreakPage } from "@/pages/streak";
import { SubscriptionPage } from "@/pages/subscription";

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/jd/add" element={<JdAddPage />} />
        <Route path="/jd/analyzing" element={<JdAnalyzingPage />} />
        <Route path="/jd/detail/:id" element={<JdDetailPage />} />
        <Route path="/jd/edit/:id" element={<JdEditPage />} />
        <Route path="/jd" element={<JdListPage />} />
        <Route path="/resume" element={<ResumeListPage />} />
        <Route path="/resume/input" element={<ResumeInputPage />} />
        <Route path="/resume/upload" element={<ResumeUploadPage />} />
        <Route path="/interview/setup" element={<InterviewSetupPage />} />
        <Route path="/interview/precheck" element={<InterviewPreCheckPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/streak" element={<StreakPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
