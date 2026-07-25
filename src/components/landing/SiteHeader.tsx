"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ApiHealthDashboard } from "@/components/health/ApiHealthDashboard";

const menuItems = [
  { index: "01", label: "ABOUT", href: "/#about" },
  { index: "02", label: "FEATURES", href: "/#features" },
  { index: "03", label: "MAJOR MARKETS", href: "/#markets" },
  { index: "04", label: "START ONBOARDING", href: "/portal/onboarding" },
  { index: "05", label: "ENTER PORTAL", href: "/portal/agency" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  return (
    <>
      {/* Top Right API Health Menu */}
      <div style={{ position: "fixed", top: "12px", right: "16px", zIndex: 90 }}>
        <ApiHealthDashboard />
      </div>

      {/* Nav Pill */}
      <nav className="nav-pill">
        <div className="nav-pill__main" onClick={toggleMenu}>
          <div>
            <span className="df-label" style={{ cursor: "pointer" }}>
              &gt;|&lt;
            </span>
          </div>
          <div>
            <div className="df-dots">
              {[...Array(5)].map((_, i) => (
                <span key={i} />
              ))}
            </div>
          </div>
          <div>
            <span className="df-label" style={{ cursor: "pointer" }}>
              {menuOpen ? "CLOSE" : "MENU"}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="nav-menu active"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <ul>
                {menuItems.map((item) => (
                  <li key={item.index}>
                    <Link
                      className="nav-menu__item"
                      href={item.href}
                      data-index={item.index}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="nav-footer">
                <a className="nav-footer__link" href="#">
                  TERMS
                </a>
                <a className="nav-footer__link" href="#">
                  DISCLOSURES
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
