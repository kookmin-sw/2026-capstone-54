import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Overview from "./components/Overview";
import Features from "./components/Features";
import HowTo from "./components/HowTo";
import WhySection from "./components/WhySection";
import Flow from "./components/Flow";
import Architecture from "./components/Architecture";
import TechStack from "./components/TechStack";
import Team from "./components/Team";
import Cta from "./components/Cta";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <a href="#main" className="skip-link sr-only">
        본문으로 건너뛰기
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Overview />
        <Features />
        <HowTo />
        <WhySection />
        <Flow />
        <Architecture />
        <TechStack />
        <Team />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
