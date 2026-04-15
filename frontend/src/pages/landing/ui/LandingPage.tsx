import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/widgets/landing-navbar";
import { HeroSection } from "./HeroSection";
import { StatsSection } from "./StatsSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowToSection } from "./HowToSection";
import { ReviewReportSection } from "./ReviewReportSection";
// import { TestimonialsSection } from "./TestimonialsSection";
import { PricingSection } from "./PricingSection";
import { WhySection } from "./WhySection";
import { CtaSection } from "./CtaSection";
import { FooterSection } from "./FooterSection";
import { useAuthStore } from "@/features/auth";
import { AppLayout } from "@/app/AppLayout";
import { HomeContent } from "@/pages/home/ui/HomeContent";

export function LandingPage() {
  const navigate = useNavigate();
  const { user, authReady } = useAuthStore();

  useEffect(() => {
    if (!authReady || !user) return;
    // 이메일 미인증 또는 프로필 미완성 사용자는 해당 페이지로 이동
    if (!user.isEmailConfirmed) {
      navigate("/verify-email", { replace: true });
    } else if (!user.isProfileCompleted) {
      navigate("/onboarding", { replace: true });
    }
  }, [authReady, user, navigate]);

  if (!authReady) return null;

  // 로그인 완료된 사용자: 홈 대시보드를 AppLayout 안에서 렌더
  if (user?.isEmailConfirmed && user?.isProfileCompleted) {
    return (
      <AppLayout>
        <HomeContent />
      </AppLayout>
    );
  }

  // 비로그인 사용자 또는 인증 대기 중: 랜딩 페이지
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowToSection />
        <ReviewReportSection />
        <PricingSection />
        <WhySection />
        {/* <TestimonialsSection /> */}
        <CtaSection />
      </main>
      <FooterSection />
    </>
  );
}
