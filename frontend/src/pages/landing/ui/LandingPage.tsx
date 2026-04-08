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

export function LandingPage() {
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
