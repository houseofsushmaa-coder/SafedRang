import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, Calendar, ArrowRight } from "lucide-react";
import "./LegalPages.css";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Privacy Policy — Safed Rang";
  }, []);

  return (
    <div className="legal-page">
      {/* ── 1. Hero ── */}
      <section className="legal-hero">
        <div className="container">
          <nav className="legal-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="legal-breadcrumb-sep">/</span>
            <span>Privacy Policy</span>
          </nav>
          <h1 className="legal-hero-title">Privacy Policy</h1>
          <div className="legal-hero-meta">
            <Calendar size={14} />
            <span>Effective Date: 6 Nov, 2025</span>
          </div>
        </div>
      </section>

      {/* ── 2. Content ── */}
      <main className="legal-content-container">
        <article className="legal-card">
          <p className="legal-intro">
            At <strong>SafedRang.com</strong>, we value your privacy and are committed to protecting your
            personal information. This Privacy Policy explains how we collect, use, share, and
            safeguard your data when you interact with our website.
          </p>

          {/* Section 1 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">1.</span> Information We Collect
            </h2>
            <p className="legal-text">We may collect the following types of information:</p>
            <ul className="legal-list">
              <li className="legal-list-item">
                <strong>Personal Information:</strong> Name, email address, phone number,
                shipping/billing address (only when provided voluntarily).
              </li>
              <li className="legal-list-item">
                <strong>Usage Data:</strong> IP address, browser type, pages visited, time spent on the
                site, and referring URL.
              </li>
              <li className="legal-list-item">
                <strong>Cookies:</strong> Small data files used to improve user experience and analyze
                website traffic.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">2.</span> How We Use Your Information
            </h2>
            <p className="legal-text">We use the collected information for purposes such as:</p>
            <ul className="legal-list">
              <li className="legal-list-item">Providing and managing our services</li>
              <li className="legal-list-item">Processing orders and transactions (if applicable)</li>
              <li className="legal-list-item">
                Sending updates, newsletters, or promotional content (with consent)
              </li>
              <li className="legal-list-item">
                Improving website functionality and user experience
              </li>
              <li className="legal-list-item">Responding to your queries or feedback</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">3.</span> Data Sharing & Disclosure
            </h2>
            <p className="legal-text">
              We do not sell your personal data to third parties. However, we may share limited
              information with:
            </p>
            <ul className="legal-list">
              <li className="legal-list-item">
                Service providers who help us operate the website (e.g., payment gateways, shipping
                partners)
              </li>
              <li className="legal-list-item">
                Legal authorities if required by law or to protect our rights
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">4.</span> Data Security
            </h2>
            <p className="legal-text">
              We implement industry-standard security measures to protect your data. However, no
              method of data transmission over the internet or electronic storage is 100% secure, and
              we cannot guarantee absolute protection.
            </p>
          </section>

          {/* Section 5 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">5.</span> Cookies
            </h2>
            <p className="legal-text">
              We use cookies to enhance your browsing experience. You may disable cookies through your
              browser settings, but some website features may not function properly as a result.
            </p>
          </section>

          {/* Section 6 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">6.</span> Your Rights
            </h2>
            <p className="legal-text">You have the right to:</p>
            <ul className="legal-list">
              <li className="legal-list-item">Access or request a copy of your personal data</li>
              <li className="legal-list-item">Request correction or deletion of your information</li>
              <li className="legal-list-item">Withdraw consent for marketing communications at any time</li>
            </ul>
            <div className="legal-highlight-box">
              <p>
                To make a request, please contact us at{" "}
                <a href="mailto:houseofsushmaa@gmail.com">houseofsushmaa@gmail.com</a>.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">7.</span> Third-Party Links
            </h2>
            <p className="legal-text">
              Our website may include links to external websites. We are not responsible for the privacy
              practices or content of those third-party sites and encourage you to review their privacy
              policies.
            </p>
          </section>

          {/* Section 8 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">8.</span> Children’s Privacy
            </h2>
            <p className="legal-text">
              SafedRang.com does not knowingly collect personal data from individuals under the age of
              13. If we become aware that we have inadvertently collected such information, we will delete
              it promptly.
            </p>
          </section>

          {/* Section 9 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">9.</span> Changes to This Policy
            </h2>
            <p className="legal-text">
              We may update this Privacy Policy from time to time. Any updates will be posted on this page
              with a revised “Effective Date.” Please review this page periodically for any changes.
            </p>
          </section>

          {/* Section 10 */}
          <section className="legal-section" style={{ marginBottom: "1rem" }}>
            <h2 className="legal-section-title">
              <span className="legal-section-num">10.</span> Contact Us
            </h2>
            <p className="legal-text">
              If you have any questions or concerns regarding this Privacy Policy, please contact us at:
            </p>
            <div className="legal-highlight-box">
              <p>
                <strong>Safed Rang</strong>
                <br />
                Email: <a href="mailto:houseofsushmaa@gmail.com">houseofsushmaa@gmail.com</a>
                <br />
                Location: Aliganj, Lucknow, Uttar Pradesh – 226026
              </p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="legal-footer-badge">
            <span>Also see our governing terms:</span>
            <Link to="/terms" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              Terms & Conditions <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
