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
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label="Toggle Navigation Menu"
          className="nav-pill__main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={toggleMenu}
        >
          <div className="flex items-center justify-start">
            <span className="font-mono text-xs font-bold tracking-widest text-slate-200 hover:text-white">
              &gt;|&lt;
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500]"
              />
            ))}
          </div>
          <div className="flex items-center justify-end">
            <span className="font-mono text-xs font-bold tracking-widest text-slate-200 hover:text-white">
              {menuOpen ? "CLOSE" : "MENU"}
            </span>
          </div>
        </button>

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
