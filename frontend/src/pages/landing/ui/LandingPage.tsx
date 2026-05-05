import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { Navbar } from "@/widgets/landing-navbar";
import { HeroSection } from "./HeroSection";
import { StatsSection } from "./StatsSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowToSection } from "./HowToSection";
import { ReviewReportSection } from "./ReviewReportSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { PricingSection } from "./PricingSection";
import { WhySection } from "./WhySection";
import { CtaSection } from "./CtaSection";
import { FooterSection } from "./FooterSection";
import { Cursor } from "./Cursor";
import { ScrollProgress } from "./ScrollProgress";
import { useAuthStore } from "@/features/auth";
import { AppLayout } from "@/app/AppLayout";
import { HomeContent } from "@/pages/home/ui/HomeContent";
import {
  gsap,
  registerGsapPlugins,
  ScrollTrigger,
  useLenisScroll,
  useReducedMotion,
} from "@/shared/lib/animation";

function LandingContent() {
  useLenisScroll({
    pageSnapSelector: "main[data-landing-main] > section",
  });
  const mainRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const headers = mainRef.current?.querySelectorAll<HTMLElement>(
        "[data-section-header]",
      );
      if (!headers?.length) return;

      const triggers = ScrollTrigger.batch(Array.from(headers), {
        start: "top 90%",
        onEnter: (els) =>
          gsap.from(els, {
            y: 28,
            opacity: 0,
            duration: 0.7,
            stagger: 0.06,
            ease: "power3.out",
            overwrite: "auto",
          }),
      });

      return () => {
        triggers.forEach((t) => t.kill());
      };
    },
    { scope: mainRef, dependencies: [reduced] },
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#0A0A0A] focus:text-white focus:no-underline focus:outline focus:outline-2 focus:outline-[#0991B2]"
      >
        본문으로 건너뛰기
      </a>
      <ScrollProgress />
      <Cursor />
      <Navbar />
      <main id="main-content" ref={mainRef} data-landing-main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowToSection />
        <ReviewReportSection />
        <PricingSection />
        <WhySection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <FooterSection />
    </>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user, authReady } = useAuthStore();

  useEffect(() => {
    if (!authReady || !user) return;
    if (!user.isEmailConfirmed) {
      navigate("/verify-email", { replace: true });
    } else if (!user.isProfileCompleted) {
      navigate("/onboarding", { replace: true });
    }
  }, [authReady, user, navigate]);

  if (!authReady) return null;

  if (user?.isEmailConfirmed && user?.isProfileCompleted) {
    return (
      <AppLayout>
        <HomeContent />
      </AppLayout>
    );
  }

  return <LandingContent />;
}
