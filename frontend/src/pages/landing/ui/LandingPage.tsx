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

export function LandingPage() {
  const navigate = useNavigate();
  const { user, authReady } = useAuthStore();

  useEffect(() => {
    if (!authReady || !user) return;
    // 이미 로그인된 사용자를 적절한 화면으로 리다이렉트
    if (!user.isEmailConfirmed) {
      navigate("/verify-email", { replace: true });
    } else if (!user.isProfileCompleted) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [authReady, user, navigate]);

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
