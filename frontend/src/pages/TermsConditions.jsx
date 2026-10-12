import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import "./LegalPages.css";

export default function TermsConditions() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Terms & Conditions — Safed Rang";
  }, []);

  return (
    <div className="legal-page">
      {/* ── 1. Hero ── */}
      <section className="legal-hero">
        <div className="container">
          <nav className="legal-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="legal-breadcrumb-sep">/</span>
            <span>Terms and Conditions</span>
          </nav>
          <h1 className="legal-hero-title">Terms & Conditions</h1>
          <div className="legal-hero-meta">
            <MapPin size={14} />
            <span>Aliganj, Lucknow, Uttar Pradesh – 226026</span>
          </div>
        </div>
      </section>

      {/* ── 2. Content ── */}
      <main className="legal-content-container">
        <article className="legal-card">
          <p className="legal-intro">
            The Website Owner, including subsidiaries and affiliates (“SafedRang” or “we” or “us” or
            “our”) provides the information contained on the website or any of the pages comprising the
            website (“website”) to visitors (“visitors”) (collectively referred to as “you” or “your”
            hereinafter) subject to the terms and conditions set out in these Website Terms and
            Conditions, the Privacy Policy, and any other relevant terms, policies, and notices which may
            apply to specific sections of the website.
          </p>

          <p className="legal-text">
            Welcome to <strong>SafedRang.com</strong>. If you continue to browse and use this website, you
            are agreeing to comply with and be bound by the following Terms and Conditions of use, which
            together with our Privacy Policy govern SafedRang.com’s relationship with you in relation to
            this website.
          </p>

          <div className="legal-highlight-box">
            <p>
              The term <strong>‘SafedRang’</strong>, <strong>‘us’</strong>, or <strong>‘we’</strong> refers
              to the owner of the website whose registered office is:
              <br />
              <strong>SafedRang, Aliganj, Lucknow, Uttar Pradesh – 226026</strong>
              <br />
              <br />
              The term <strong>‘you’</strong> refers to the user or viewer of our website.
            </p>
          </div>

          {/* Use of This Website */}
          <section className="legal-section">
            <h2 className="legal-section-title">Use of This Website</h2>
            <p className="legal-text">
              The content of the pages of this website is for your general information and use only. It
              is subject to change without notice.
            </p>
            <ul className="legal-list">
              <li className="legal-list-item">
                Neither we nor any third parties provide any warranty or guarantee as to the accuracy,
                timeliness, performance, completeness, or suitability of the information and materials
                found or offered on this website for any particular purpose.
              </li>
              <li className="legal-list-item">
                You acknowledge that such information and materials may contain inaccuracies or errors,
                and we expressly exclude liability for any such inaccuracies or errors to the fullest
                extent permitted by law.
              </li>
              <li className="legal-list-item">
                Your use of any information or materials on this website is entirely at your own risk,
                for which we shall not be liable. It shall be your own responsibility to ensure that any
                products, services, or information available through this website meet your specific
                requirements.
              </li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="legal-section">
            <h2 className="legal-section-title">Intellectual Property</h2>
            <p className="legal-text">
              This website contains material which is owned by or licensed to us. This material includes,
              but is not limited to, the design, layout, look, appearance, and graphics.
            </p>
            <p className="legal-text">
              Reproduction is prohibited other than in accordance with the copyright notice, which forms
              part of these Terms and Conditions.
            </p>
            <p className="legal-text">
              All trademarks reproduced on this website which are not the property of, or licensed to,
              the operator are acknowledged on the website.
            </p>
          </section>

          {/* Unauthorized Use */}
          <section className="legal-section">
            <h2 className="legal-section-title">Unauthorized Use</h2>
            <p className="legal-text">
              Unauthorized use of this website may give rise to a claim for damages and/or be a criminal
              offence.
            </p>
          </section>

          {/* External Links */}
          <section className="legal-section">
            <h2 className="legal-section-title">External Links</h2>
            <p className="legal-text">
              From time to time, this website may also include links to other websites. These links are
              provided for your convenience to provide further information. They do not signify that we
              endorse the linked website. We have no responsibility for the content of the linked
              websites.
            </p>
            <p className="legal-text">
              You may not create a link to this website from another website or document without
              SafedRang’s prior written consent.
            </p>
          </section>

          {/* Governing Law */}
          <section className="legal-section">
            <h2 className="legal-section-title">Governing Law</h2>
            <div className="legal-highlight-box">
              <p>
                Your use of this website and any dispute arising out of such use of the website is
                subject to the laws of <strong>India</strong> or other relevant regulatory authorities.
              </p>
            </div>
          </section>

          {/* Contact Details */}
          <section className="legal-section" style={{ marginBottom: "1rem" }}>
            <h2 className="legal-section-title">Contact Information</h2>
            <p className="legal-text">
              For any legal or contractual inquiries, please write to:
            </p>
            <div className="legal-highlight-box">
              <p>
                <strong>Safed Rang Heritage Studio</strong>
                <br />
                Aliganj, Lucknow, Uttar Pradesh – 226026
                <br />
                Email: <a href="mailto:houseofsushmaa@gmail.com">houseofsushmaa@gmail.com</a>
              </p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="legal-footer-badge">
            <span>Review our customer privacy framework:</span>
            <Link to="/privacy" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              Privacy Policy <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
