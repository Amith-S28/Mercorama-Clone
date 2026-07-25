"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Loader2,
  Package,
} from "@/components/ui/icons";
import type { IndustrySector, SmeRecord } from "@/types";
import { SectorSelector } from "@/components/onboarding/SectorSelector";
import { CountrySelect } from "@/components/onboarding/CountrySelect";
import { HsCodeSearch } from "@/components/onboarding/HsCodeSearch";
import { cn } from "@/lib/utils";
import { buttonSpring, snappy } from "@/lib/animation/presets";
import { SiteHeader } from "@/components/landing";

export interface SmeOnboardingPayload {
  name: string;
  province: string;
  industry: IndustrySector | string;
  productDescription: string;
  hsCode: string;
  exportQuantity: number;
  productionCost: number;
  unitPrice: number;
  targetProfitMargin: number;
  contactEmail: string | null;
  primaryContact: string | null;
  website: string | null;
  hasLocalAgent: boolean;
  employeeRange: string | null;
  revenueRange: string | null;
  targetCountry: string;
  targetCountryName: string;
}

const STEPS = [
  { id: "profile", label: "Company Profile", icon: Building2 },
  { id: "sector", label: "Sector", icon: Building2 },
  { id: "product", label: "Product & Market", icon: Package },
  { id: "hscode", label: "HS Code", icon: Package },
] as const;

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

const EMPLOYEE_RANGES = ["1-9", "10-49", "50-199", "200+"];
const REVENUE_RANGES = ["Under $1M", "$1M–$5M", "$5M–$20M", "$20M+"];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

function emptyForm(): SmeOnboardingPayload {
  return {
    name: "",
    province: "",
    industry: "",
    productDescription: "",
    hsCode: "",
    exportQuantity: 0,
    productionCost: 0,
    unitPrice: 0,
    targetProfitMargin: 15,
    contactEmail: null,
    primaryContact: null,
    website: null,
    hasLocalAgent: false,
    employeeRange: null,
    revenueRange: null,
    targetCountry: "",
    targetCountryName: "",
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<SmeOnboardingPayload>(emptyForm);
  const [hsConfirmed, setHsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<SmeOnboardingPayload>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return form.name.trim().length > 1 && form.province.length > 0;
      case 1:
        return Boolean(form.industry);
      case 2:
        return (
          form.productDescription.trim().length > 5 &&
          form.targetCountry.length === 3 &&
          form.exportQuantity > 0 &&
          form.productionCost > 0 &&
          form.unitPrice > 0
        );
      case 3:
        return form.hsCode.length >= 4 && hsConfirmed;
      default:
        return false;
    }
  }, [step, form, hsConfirmed]);

  const goNext = () => {
    if (!canAdvance || step >= STEPS.length - 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step <= 0) {
      router.push("/");
      return;
    }
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!canAdvance) return;
    setSubmitting(true);
    setSubmitError(null);

    const submissionForm = { ...form };
    if (submissionForm.website) {
      let urlStr = submissionForm.website.trim();
      if (urlStr && !/^https?:\/\//i.test(urlStr)) {
        urlStr = `https://${urlStr}`;
      }
      submissionForm.website = urlStr;
    }

    try {
      const res = await fetch("/api/sme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionForm),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: { fieldErrors?: Record<string, string[]> };
        };
        let msg = body.error ?? "Failed to create SME profile";
        if (body.details?.fieldErrors) {
          const detailsStr = Object.entries(body.details.fieldErrors)
            .map(([field, errs]) => `${field}: ${errs.join(", ")}`)
            .join("; ");
          msg += ` (${detailsStr})`;
        }
        throw new Error(msg);
      }
      const sme = (await res.json()) as SmeRecord;
      router.push(`/portal/agency/report?id=${sme.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#ff5500] focus:outline-none focus:ring-1 focus:ring-[#ff5500] tracking-wide";

  const labelClass =
    "mb-1.5 block text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]";

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">
      {/* Navigation Bar */}
      <SiteHeader />

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        src="/ascii-magic-1.mp4"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      {/* Black translucent overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Main Content wrapper */}
      <div className="flex flex-col md:flex-row w-full flex-1 min-h-0 relative z-10 pt-14 overflow-hidden">
        
        {/* Left Panel — Visual steps and brand info with smooth entrance animations */}
        <motion.div
          className="hidden md:flex md:w-5/12 text-white p-8 flex-col justify-between border-r border-[rgba(255,255,255,0.1)] relative overflow-hidden h-full"
          style={{ background: "transparent" }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <motion.p
              className="font-mono"
              style={{
                color: "var(--text-tertiary)",
                letterSpacing: "0.2em",
                marginBottom: "1.5rem",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Trade Intelligence Portal
            </motion.p>
            <motion.h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                marginBottom: "0.75rem",
                fontFamily: "var(--font-sans)",
                textTransform: "uppercase",
                color: "#ffffff",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              SME Onboarding Hub
            </motion.h1>
            <motion.p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                lineHeight: "1.5",
                letterSpacing: "0.03em",
                maxWidth: "24rem",
                marginBottom: "2rem",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Provide details about your enterprise profile, pricing
              structures, and export goals to construct a custom market
              readiness brief.
            </motion.p>

            {/* Steps guide */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {STEPS.map((s, i) => {
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <motion.div
                    key={s.id}
                    style={{
                      display: "flex",
                      gap: "1.25rem",
                      alignItems: "flex-start",
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  >
                    <motion.div
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "var(--radius-interactive)",
                        border:
                          "1px solid " +
                          (isActive
                            ? "#ff5500"
                            : isDone
                              ? "#ff5500"
                              : "var(--border)"),
                        background: isActive
                          ? "rgba(255, 85, 0, 0.2)"
                          : isDone
                            ? "#ff5500"
                            : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isActive
                          ? "#ff5500"
                          : isDone
                            ? "#ffffff"
                            : "var(--text-secondary)",
                        transition: "all 0.3s var(--ease-spring)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        boxShadow: isActive ? "0 0 16px rgba(255, 85, 0, 0.4)" : "none",
                      }}
                      animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={isActive ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : {}}
                    >
                      {isDone ? "✓" : i + 1}
                    </motion.div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "1rem",
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          color: isActive
                            ? "#ffffff"
                            : "var(--text-secondary)",
                        }}
                      >
                        {s.label}
                      </p>
                      <p
                        style={{
                          margin: "0.25rem 0 0 0",
                          fontSize: "0.8125rem",
                          letterSpacing: "0.03em",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {i === 0 && "Legal name and region"}
                        {i === 1 && "SME industry domain classification"}
                        {i === 2 && "Pricing margins and volume targets"}
                        {i === 3 && "Commodity HS matching classification"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div
            style={{
              position: "relative",
              zIndex: 1,
              borderTop: "1px solid var(--border)",
              paddingTop: "2rem",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontStyle: "italic",
                lineHeight: "1.6",
                letterSpacing: "0.03em",
              }}
            >
              &quot;Precise pricing inputs and HS commodity details allow the
              analysis engine to compute exact landed margins and trade
              flows.&quot;
            </p>
          </motion.div>
        </motion.div>

        {/* Right Panel — Form wizard */}
        <div className="flex flex-col flex-1 h-full overflow-hidden relative" style={{ background: "transparent" }}>
          <header className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] px-8 py-3 flex-shrink-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-mono">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2
              id="onboarding-title"
              className="text-xl font-semibold text-[var(--text-primary)] mt-0.5 tracking-wider"
            >
              {STEPS[step].label}
            </h2>
          </div>
        </header>

        {/* Top Steps Progress Bar */}
        <div className="flex gap-1 px-8 pt-3 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-[var(--radius-pill)] transition-colors",
                i <= step
                  ? "bg-[#ff5500]"
                  : "bg-[var(--border-low-contrast)]",
              )}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={snappy}
              className="max-w-2xl"
            >
              {step === 0 && (
                <div className="grid gap-6">
                  <div>
                    <label className={labelClass}>Company name</label>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      placeholder="Atlantic Maple Foods Inc."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Province / territory
                    </label>
                    <select
                      className={inputClass}
                      value={form.province}
                      onChange={(e) => patch({ province: e.target.value })}
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Primary contact</label>
                      <input
                        className={inputClass}
                        value={form.primaryContact ?? ""}
                        onChange={(e) =>
                          patch({ primaryContact: e.target.value || null })
                        }
                        placeholder="Claire Beaumont"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Contact email</label>
                      <input
                        type="email"
                        className={inputClass}
                        value={form.contactEmail ?? ""}
                        onChange={(e) =>
                          patch({ contactEmail: e.target.value || null })
                        }
                        placeholder="exports@company.ca"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input
                      type="url"
                      className={inputClass}
                      value={form.website ?? ""}
                      onChange={(e) =>
                        patch({ website: e.target.value || null })
                      }
                      placeholder="https://www.company.ca"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Employees</label>
                      <select
                        className={inputClass}
                        value={form.employeeRange ?? ""}
                        onChange={(e) =>
                          patch({ employeeRange: e.target.value || null })
                        }
                      >
                        <option value="">Select range</option>
                        {EMPLOYEE_RANGES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Annual revenue</label>
                      <select
                        className={inputClass}
                        value={form.revenueRange ?? ""}
                        onChange={(e) =>
                          patch({ revenueRange: e.target.value || null })
                        }
                      >
                        <option value="">Select range</option>
                        {REVENUE_RANGES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-[var(--text-primary)] mt-2">
                    <input
                      type="checkbox"
                      checked={form.hasLocalAgent}
                      onChange={(e) =>
                        patch({ hasLocalAgent: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-[var(--border-medium-contrast)] accent-[#ff5500]"
                    />
                    We have a local agent or distributor in the target
                    market
                  </label>
                </div>
              )}

              {step === 1 && (
                <SectorSelector
                  value={form.industry as string}
                  onChange={(industry) => patch({ industry })}
                />
              )}

              {step === 2 && (
                <div className="grid gap-6">
                  <div>
                    <label className={labelClass}>
                      Product description
                    </label>
                    <textarea
                      className={cn(inputClass, "min-h-32 resize-y")}
                      value={form.productDescription}
                      onChange={(e) =>
                        patch({ productDescription: e.target.value })
                      }
                      placeholder="Describe your export product in detail for classification and market analysis…"
                    />
                  </div>
                  <CountrySelect
                    value={form.targetCountry}
                    onChange={(iso3, name) =>
                      patch({
                        targetCountry: iso3,
                        targetCountryName: name,
                      })
                    }
                  />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        Annual export quantity (units)
                      </label>
                      <input
                        type="number"
                        min={1}
                        className={inputClass}
                        value={form.exportQuantity || ""}
                        onChange={(e) =>
                          patch({
                            exportQuantity: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Target profit margin (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        className={inputClass}
                        value={form.targetProfitMargin || ""}
                        onChange={(e) =>
                          patch({
                            targetProfitMargin: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Production cost (CAD / unit)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={inputClass}
                        value={form.productionCost || ""}
                        onChange={(e) =>
                          patch({
                            productionCost: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Unit price (CAD)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={inputClass}
                        value={form.unitPrice || ""}
                        onChange={(e) =>
                          patch({ unitPrice: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <HsCodeSearch
                  productDescription={form.productDescription}
                  value={form.hsCode}
                  onChange={(code) => {
                    patch({ hsCode: code });
                    setHsConfirmed(false);
                  }}
                  onConfirmedChange={setHsConfirmed}
                  showComplianceWarning={
                    form.industry ===
                    "Defence, Dual-Use & Critical Supply Chains"
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>

          {step === 3 && form.hsCode && !hsConfirmed && (
            <p className="mt-4 text-sm text-[var(--text-muted)] max-w-2xl">
              Confirm your HS code selection before finishing onboarding.
            </p>
          )}
        </div>

        {submitError && (
          <div className="absolute bottom-24 left-10 right-10">
            <p
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-card)] text-sm text-[var(--accent-danger)]"
              role="alert"
            >
              {submitError}
            </p>
          </div>
        )}

        <footer className="flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.1)] px-8 py-3 flex-shrink-0 relative z-10" style={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(10px)" }}>
          <motion.button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-[var(--radius-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors tracking-wider uppercase"
            {...buttonSpring}
          >
            <ArrowLeft size={16} />
            {step === 0 ? "Cancel" : "Back"}
          </motion.button>

          {step < STEPS.length - 1 ? (
            <motion.button
              type="button"
              onClick={goNext}
              disabled={!canAdvance}
              className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-[#ff5500] px-5 py-2 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-40 transition-opacity tracking-wider uppercase"
              {...buttonSpring}
            >
              Continue
              <ArrowRight size={16} />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canAdvance || submitting}
              className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-[#ff5500] px-5 py-2 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-40 transition-opacity tracking-wider uppercase"
              {...buttonSpring}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              Complete onboarding
            </motion.button>
          )}
        </footer>
        </div>
      </div>
    </div>
  );
}
