import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

/*
  Safedrang footer
  - Background: /footer-bg.png  (frontend/public/footer-bg.png)
  - Logo:       /favicon.png    (frontend/public/favicon.png)
  - Links below match the live footer routes using React Router Link.
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
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms" },
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
  return (
    <footer className="sf">
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
              {col.title === "Customer Care" && (
                <ul className="sf-contact">
                  <li>
                    <a href="tel:+919151566602">+91 91515 66602</a>
                  </li>
                  <li>
                    <a href="mailto:contact@safedrang.com">contact@safedrang.com</a>
                  </li>
                </ul>
              )}
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
          <span>© {new Date().getFullYear()} Safedrang. All rights reserved.</span>
          <div className="sf-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/shipping-policy">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
