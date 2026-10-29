import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

/*
  Safed Rang Footer
  - Desktop Background: /footer-bg.png
  - Mobile Background:  /footer-mobile-bg.png (compact luxury accordion layout)
  - Logo:               /favicon.png (desktop) / /logo.png (mobile wordmark)
*/

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Sarees", to: "/shop?category=Sarees" },
      { label: "One-of-One", to: "/one-of-one" },
      { label: "Chikankari", to: "/shop?craft=chikankari" },
      { label: "Zardozi", to: "/shop?craft=zardozi" },
      { label: "Bridal Sets", to: "/shop?category=bridal" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Our Story", to: "/about" },
      { label: "The Craft", to: "/craft" },
      { label: "Artisans", to: "/artisans" },
      { label: "Journey", to: "/journey" },
      { label: "Archive", to: "/archive" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "Shipping", to: "/shipping" },
      { label: "Care Guide", to: "/care" },
      { label: "Returns & Exchange", to: "/returns" },
      { label: "FAQs", to: "/faq" },
    ],
  },
];

const MOBILE_SECTIONS = [
  {
    id: "shop",
    title: "Shop",
    links: [
      { label: "Sarees", to: "/shop?category=Sarees" },
      { label: "One-of-One", to: "/one-of-one" },
      { label: "Chikankari", to: "/shop?craft=chikankari" },
      { label: "Zardozi", to: "/shop?craft=zardozi" },
      { label: "Bridal Sets", to: "/shop?category=bridal" },
    ],
  },
  {
    id: "discover",
    title: "Discover",
    links: [
      { label: "Our Story", to: "/about" },
      { label: "The Craft", to: "/craft" },
      { label: "Artisans", to: "/artisans" },
      { label: "Journey", to: "/journey" },
      { label: "Archive", to: "/archive" },
    ],
  },
  {
    id: "care",
    title: "Customer Care",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "Shipping", to: "/shipping" },
      { label: "Care Guide", to: "/care" },
      { label: "Returns & Exchange", to: "/returns" },
      { label: "FAQs", to: "/faq" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms" },
    ],
  },
  {
    id: "follow",
    title: "Follow",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "Facebook", href: "https://www.facebook.com/" },
      { label: "Pinterest", href: "https://www.pinterest.com/" },
      { label: "YouTube", href: "https://www.youtube.com/" },
    ],
  },
];

const SOCIAL = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "Pinterest", href: "https://www.pinterest.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
];

export default function Footer() {
  // Mobile accordion state: collapsed by default, only one open at a time
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <footer className="sf">
      {/* ── DESKTOP FOOTER (Visible on screens > 640px) ── */}
      <div className="sf-desktop">
        <div className="sf-bg" aria-hidden="true" />

        <div className="sf-wrap">
          <div className="sf-grid">
            <div className="sf-brand">
              <Link to="/" aria-label="Safedrang home" className="sf-logo">
                <img src="/favicon.png" alt="Safedrang" />
              </Link>
              <p className="sf-quote">
                “Keeping our craft alive for a more beautiful tomorrow.”
              </p>
            </div>

            {COLUMNS.map((col) => (
              <nav key={col.title} className="sf-col" aria-label={col.title}>
                <h3 className="sf-h">{col.title}</h3>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <nav className="sf-col" aria-label="Follow">
              <h3 className="sf-h">Follow</h3>
              <ul>
                {SOCIAL.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="sf-bottom">
            <div className="sf-bottom-left">
              <span>© {new Date().getFullYear()} Safedrang. All rights reserved.</span>
              <span className="sf-sep" aria-hidden="true">•</span>
              <span className="sf-credit">Designed by websitewalae</span>
            </div>

            <div className="sf-legal">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms">Terms &amp; Conditions</Link>
              <Link to="/shipping-policy">Shipping Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE FOOTER (Visible on screens <= 640px) ── */}
      <div className="sf-mobile">
        <div className="sf-mob-bg" aria-hidden="true" />

        {/* 1. Ivory Upper Area: Brand wordmark & Lucknow provenance */}
        <div className="sf-mob-ivory">
          <Link to="/" aria-label="Safed Rang home" className="sf-mob-logo-link">
            <img src="/logo.png" alt="Safed Rang" className="sf-mob-wordmark" />
          </Link>
          <span className="sf-mob-tagline">HANDCRAFTED IN LUCKNOW</span>
        </div>

        {/* 2. Central Dark Area: Collapsible Accordions & Negative Space */}
        <div className="sf-mob-content">
          <div className="sf-mob-accordions">
            {MOBILE_SECTIONS.map((sec) => {
              const isOpen = openSection === sec.id;
              return (
                <div
                  key={sec.id}
                  className={`sf-mob-acc-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    type="button"
                    id={`sf-mob-trigger-${sec.id}`}
                    className="sf-mob-acc-trigger"
                    onClick={() => toggleSection(sec.id)}
                    aria-expanded={isOpen}
                    aria-controls={`sf-mob-panel-${sec.id}`}
                  >
                    <span className="sf-mob-acc-title">{sec.title}</span>
                    <span className="sf-mob-acc-icon" aria-hidden="true">
                      <svg
                        className={`sf-mob-chevron ${isOpen ? "rotate" : ""}`}
                        width="11"
                        height="7"
                        viewBox="0 0 11 7"
                        fill="none"
                      >
                        <path
                          d="M1 1.5L5.5 5.5L10 1.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={`sf-mob-panel-${sec.id}`}
                    role="region"
                    aria-labelledby={`sf-mob-trigger-${sec.id}`}
                    className={`sf-mob-acc-panel ${isOpen ? "expanded" : ""}`}
                  >
                    <div className="sf-mob-acc-inner">
                      <ul className="sf-mob-acc-links">
                        {sec.links.map((link) => (
                          <li key={link.label}>
                            {link.to ? (
                              <Link to={link.to}>{link.label}</Link>
                            ) : (
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {link.label}
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Lower Area: Brand Quote, Contact Details & Legal */}
          <div className="sf-mob-lower">
            <p className="sf-mob-quote">
              “Keeping our craft alive for a more beautiful tomorrow.”
            </p>

            <div className="sf-mob-contact">
              <a href="tel:+919151566602" className="sf-mob-contact-link">
                +91 91515 66602
              </a>
              <span className="sf-mob-dot" aria-hidden="true">•</span>
              <a href="mailto:contact@safedrang.com" className="sf-mob-contact-link">
                contact@safedrang.com
              </a>
            </div>

            <div className="sf-mob-legal">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span className="sf-mob-dot" aria-hidden="true">•</span>
              <Link to="/terms">Terms &amp; Conditions</Link>
              <span className="sf-mob-dot" aria-hidden="true">•</span>
              <Link to="/shipping-policy">Shipping</Link>
            </div>

            <div className="sf-mob-bottom-bar">
              <span>© {new Date().getFullYear()} Safedrang. All rights reserved.</span>
              <span className="sf-mob-credit">Designed by websitewalae</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
