"use client";

export function FooterSection() {
  return (
    <footer className="landing-footer" id="contact">
      <div className="footer-grid">
        <div className="footer-column">
          <div className="footer-column__title">SECTIONS</div>
          <ul>
            <li>
              <a href="#">HOME</a>
            </li>
            <li>
              <a href="#about">ABOUT</a>
            </li>
            <li>
              <a href="#features">FEATURES</a>
            </li>
            <li>
              <a href="#markets">MAJOR MARKETS</a>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          <div className="footer-column__title">CONNECT</div>
          <ul>
            <li>
              <a href="#">CONTACT</a>
            </li>
            <li>
              <a href="#">X</a>
            </li>
            <li>
              <a href="#">LINKEDIN</a>
            </li>
            <li>
              <a href="#">PRESS KIT</a>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          <div className="footer-column__title">LEGAL</div>
          <ul>
            <li>
              <a href="#">TERMS</a>
            </li>
            <li>
              <a href="#">DISCLOSURES</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
