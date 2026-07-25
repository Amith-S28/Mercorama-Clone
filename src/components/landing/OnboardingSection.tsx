"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export function OnboardingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const INDUSTRIES = [
    "Technology & Electronics",
    "Food, Beverage & Agriculture",
    "Automotive & Transportation",
    "Textiles & Apparel",
    "Chemicals & Plastics",
    "Machinery & Equipment",
    "Healthcare & Pharmaceuticals",
    "Consumer Goods (FMCG)",
    "Metals & Minerals",
    "Defence, Dual-Use & Critical Supply Chains",
    "Other / Unsure"
  ];

  const [formData, setFormData] = useState({
    name: "",
    province: "Ontario",
    industry: "Other / Unsure",
    productDescription: "",
    hsCode: "",
    exportQuantity: 1000,
    productionCost: 50,
    unitPrice: 100,
    targetProfitMargin: 20,
    targetCountry: "USA",
    targetCountryName: "United States",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["exportQuantity", "productionCost", "unitPrice", "targetProfitMargin"].includes(name) 
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/sme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const sme = await res.json();
        router.push(`/portal/agency/report?id=${sme.id}`);
      } else {
        console.error("Failed to create SME");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="onboarding" className="df-section" ref={sectionRef}>
      <div className="df-section__header">
        <span className="df-section__number">02</span>
        <h2 className="df-section__title">ONBOARDING</h2>
      </div>

      <span className="df-section__label">SEC-02</span>

      <div className="onboarding-container">
        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="onboarding-form__group">
            <h3 className="onboarding-form__title">SME Details</h3>
            <div className="onboarding-form__fields">
              <input type="text" name="name" placeholder="Company Name" required value={formData.name} onChange={handleChange} className="onboarding-input" />
              <input type="text" name="province" placeholder="Province/State (e.g. Ontario)" required value={formData.province} onChange={handleChange} className="onboarding-input" />
              
              {/* Custom Translucent Select */}
              <div className="relative" style={{ position: "relative" }}>
                <div 
                  className="onboarding-input flex items-center justify-between cursor-pointer" 
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>{formData.industry}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{ 
                        position: "absolute", 
                        top: "calc(100% + 4px)", 
                        left: 0, 
                        width: "100%", 
                        zIndex: 50,
                        backgroundColor: "rgba(10, 10, 10, 0.65)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        maxHeight: "220px",
                        overflowY: "auto",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
                      }}
                    >
                      {INDUSTRIES.map((ind) => (
                        <div 
                          key={ind}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, industry: ind }));
                            setDropdownOpen(false);
                          }}
                          style={{
                            padding: "10px 16px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: formData.industry === ind ? "var(--accent)" : "rgba(255, 255, 255, 0.8)",
                            backgroundColor: formData.industry === ind ? "rgba(255, 255, 255, 0.05)" : "transparent",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = formData.industry === ind ? "rgba(255, 255, 255, 0.05)" : "transparent" }}
                        >
                          {ind}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="onboarding-form__group">
            <h3 className="onboarding-form__title">Exporting Product & Market</h3>
            <div className="onboarding-form__fields">
              <input type="text" name="productDescription" placeholder="Product Name" required value={formData.productDescription} onChange={handleChange} className="onboarding-input" />
              <input type="text" name="hsCode" placeholder="HS Code (e.g. 190590)" required value={formData.hsCode} onChange={handleChange} className="onboarding-input" />
              <input type="number" name="exportQuantity" placeholder="Export Quantity" required value={formData.exportQuantity} onChange={handleChange} className="onboarding-input" />
              <input type="number" name="productionCost" placeholder="Production Cost ($)" required value={formData.productionCost} onChange={handleChange} className="onboarding-input" />
              <input type="number" name="unitPrice" placeholder="Target Unit Price ($)" required value={formData.unitPrice} onChange={handleChange} className="onboarding-input" />
              <input type="number" name="targetProfitMargin" placeholder="Target Profit Margin (%)" required value={formData.targetProfitMargin} onChange={handleChange} className="onboarding-input" />
              <input type="text" name="targetCountry" placeholder="Target Country ISO3 (e.g. USA, GBR)" required value={formData.targetCountry} onChange={handleChange} className="onboarding-input" maxLength={3} />
              <input type="text" name="targetCountryName" placeholder="Target Country Name" required value={formData.targetCountryName} onChange={handleChange} className="onboarding-input" />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="onboarding-submit">
            {loading ? "INITIALIZING..." : "INITIALIZE READINESS CHECK"}
          </button>
        </form>
      </div>
    </section>
  );
}
