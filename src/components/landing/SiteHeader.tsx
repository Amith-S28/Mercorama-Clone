"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

const menuItems = [
  { index: "01", label: "ABOUT", href: "#about" },
  { index: "02", label: "FEATURES", href: "#features" },
  { index: "03", label: "MAJOR MARKETS", href: "#markets" },
  { index: "04", label: "CONTACT", href: "#contact" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"orange" | "pink" | "purple">(
    "orange",
  );

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  const handleThemeChange = useCallback(
    (theme: "orange" | "pink" | "purple") => {
      setActiveTheme(theme);
      if (theme === "orange")
        document.documentElement.removeAttribute("data-accent-theme");
      else document.documentElement.setAttribute("data-accent-theme", theme);
    },
    [],
  );

  return (
    <>
      {/* Corner Letters */}
      <div className="corner-letters">
        <span className="corner-letter corner-letter--tl">M</span>
        <span
          className="corner-letter corner-letter--tr"
          style={{ transform: "scaleX(-1)" }}
        >
          A
        </span>
        <span className="corner-letter corner-letter--bl">R</span>
        <span className="corner-letter corner-letter--br">A</span>
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
                    <a
                      className="nav-menu__item"
                      href={item.href}
                      data-index={item.index}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                    </a>
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

              <div className="nav-themes">
                <div
                  className={activeTheme === "orange" ? "active" : ""}
                  onClick={() => handleThemeChange("orange")}
                />
                <div
                  className={activeTheme === "pink" ? "active" : ""}
                  onClick={() => handleThemeChange("pink")}
                />
                <div
                  className={activeTheme === "purple" ? "active" : ""}
                  onClick={() => handleThemeChange("purple")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
