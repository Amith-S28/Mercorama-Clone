"use client";
import { useRef } from "react";
import { motion } from "motion/react";

export function OnboardingSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="onboarding" className="df-section" ref={sectionRef}>
      <div className="df-section__header">
        <span className="df-section__number">02</span>
        <h2 className="df-section__title">ONBOARDING</h2>
      </div>

      <span className="df-section__label">SEC-02</span>

      <div className="onboarding-container">
        <form className="onboarding-form" onSubmit={(e) => e.preventDefault()}>
          <div className="onboarding-form__group">
            <h3 className="onboarding-form__title">SME Details</h3>
            <div className="onboarding-form__fields">
              <input type="text" placeholder="Company Name" className="onboarding-input" />
              <input type="text" placeholder="Registration Number" className="onboarding-input" />
              <input type="text" placeholder="Country of Origin" className="onboarding-input" />
              <input type="text" placeholder="Industry Sector" className="onboarding-input" />
            </div>
          </div>
          
          <div className="onboarding-form__group">
            <h3 className="onboarding-form__title">Exporting Product</h3>
            <div className="onboarding-form__fields">
              <input type="text" placeholder="Product Name" className="onboarding-input" />
              <input type="text" placeholder="HS Code" className="onboarding-input" />
              <input type="text" placeholder="Annual Production Volume" className="onboarding-input" />
              <input type="text" placeholder="Target Markets (e.g. EU, US)" className="onboarding-input" />
            </div>
          </div>
          
          <button type="submit" className="onboarding-submit">
            INITIALIZE READINESS CHECK
          </button>
        </form>
      </div>
    </section>
  );
}
