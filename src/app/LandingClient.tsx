"use client";

import {
  AsciiCanvas,
  SiteHeader,
  HeroSection,
  AboutSection,
  FeaturesSection,
  PortfolioSection,
  FooterSection,
} from "@/components/landing";

export function LandingPage() {
  return (
    <div className="landing-page bg-black text-white selection:bg-white selection:text-black">
      <AsciiCanvas />
      <SiteHeader />
      <div className="landing-content">
        <HeroSection />
        <div className="landing-content-bg">
          <AboutSection />
          <FeaturesSection />
          <PortfolioSection />
          <FooterSection />
        </div>
      </div>
    </div>
  );
}
