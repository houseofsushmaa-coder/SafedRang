import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import "./FAQ.css";

const FAQ_DATA = [
  {
    category: "The Craft & Sarees",
    items: [
      {
        q: "What makes Safed Rang's Lucknowi Chikankari authentic?",
        a: "Every piece in our collection is patiently hand-embroidered by master artisans in Lucknow using time-honoured needlecraft techniques. We never use machine-printed or automated needlework replicas. From fine shadow work (Bakhia) and delicate Tepchi to complex Murri and Jaali lattice stitches, each drape represents genuine generational artistry.",
      },
      {
        q: "What fabrics and materials are used in your creations?",
        a: "We handpick pure, breathable, and luxurious textiles: Mul Chanderi silk, pure organza, fine muslin, Kota Doria, tissue, and natural silk-cotton blends. Embellishments such as genuine Zardozi, Mukaish Tikki, cutting beads, and seed pearls are hand-stitched directly onto fabric mounted on traditional wooden adda frames.",
      },
      {
        q: "Will the colors and embroidery appear exactly as shown online?",
        a: "We photograph all our creations under natural studio daylight without artificial saturation to present the most authentic representation possible. Because each creation is handcrafted, minor organic nuances in thread tension and motif placement are natural hallmarks of human handwork, ensuring your piece is truly unique.",
      },
      {
        q: "Do your sarees come with an unstitched blouse piece?",
        a: "Yes. All Safed Rang sarees include a coordinated unstitched blouse fabric (typically 0.8m to 1m) embellished with matching borders or sleeve motifs to complete your ensemble seamlessly.",
      },
    ],
  },
  {
    category: "The One-of-One Edit",
    items: [
      {
        q: "What defines a genuine 'One-of-One' creation?",
        a: "A One-of-One creation is a singular, non-repeatable heirloom drape. Its distinct combination of handloom weave, embroidery pattern, and artisan embellishment will never be produced again. Once a patron acquires the creation, its design is permanently retired from our catalogue.",
      },
      {
        q: "Can a retired One-of-One piece be reordered or replicated?",
        a: "To preserve genuine exclusivity and honor the patron who owns it, we never recreate retired One-of-One designs. However, our atelier team will be delighted to consult with you to curate a new, bespoke piece in a similar aesthetic profile.",
      },
      {
        q: "Can I view close-up video footage of a One-of-One piece before ordering?",
        a: "Yes, certainly. We offer high-definition video walkthroughs and personal styling consultations via WhatsApp at +91 91515 66602 so you can inspect the embroidery texture, drape weight, and sheen in detail before placing your order.",
      },
    ],
  },
  {
    category: "Customization & Sizing",
    items: [
      {
        q: "Do you offer complimentary fall and pico (edging) service?",
        a: "Yes. Upon request, we provide complimentary cotton fall stitching and delicate pico edging on all sarees prior to dispatch. Simply mention your preference in the order notes at checkout or inform our concierge team.",
      },
      {
        q: "Can I request custom blouse tailoring and sizing?",
        a: "Yes. We offer bespoke blouse tailoring crafted to your exact measurements with premium linings and hand-finished latkans. To coordinate measurements, message our atelier team on WhatsApp at +91 91515 66602 or via email at contact@safedrang.com.",
      },
      {
        q: "Can I request a custom color or trousseau curation?",
        a: "For weddings, bridal trousseaus, and celebratory milestones, we offer dedicated curation services and select bespoke dyeing on natural handloom fabrics. Please reach out to our concierge at least 4 to 6 weeks in advance of your occasion date.",
      },
    ],
  },
  {
    category: "Orders & Shipping",
    items: [
      {
        q: "Do you ship worldwide and across India?",
        a: "Yes. Safed Rang delivers to every postal pincode in India as well as to international patrons across the United States, United Kingdom, UAE, Europe, Canada, Australia, and Singapore via reliable, insured express carriers.",
      },
      {
        q: "What are the estimated delivery timelines?",
        a: "Ready-to-ship creations are dispatched from our Lucknow atelier within 2 to 3 business days. Domestic deliveries typically arrive within 4 to 7 business days, while international express shipments arrive within 7 to 12 business days.",
      },
      {
        q: "How can I track my package after dispatch?",
        a: "Once your handcrafted order is handed over to our courier partner, you will automatically receive an SMS, email, and WhatsApp notification containing your airway bill number and live tracking link.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards, debit cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and international cards through our secure, bank-grade encrypted Cashfree payment gateway.",
      },
    ],
  },
  {
    category: "Garment Care & Storage",
    items: [
      {
        q: "How should I clean and maintain my handcrafted saree?",
        a: "All pure silk, organza, tissue, and embellished drapes (Zardozi, Mukaish, beads) must be professionally dry cleaned only. Avoid machine washing or harsh chemical detergents. For a comprehensive fabric-by-fabric guide, please review our dedicated Care Guide.",
        hasCareLink: true,
      },
      {
        q: "How should I store fine Lucknowi Chikankari drapes at home?",
        a: "Store your sarees folded inside breathable, unbleached cotton or muslin bags in a cool, dry wardrobe. Never use plastic covers which trap moisture. Periodically unfold and change the crease lines twice a year, and never spray perfume directly onto metallic zari or embroidery threads.",
      },
    ],
  },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.title = "Frequently Asked Questions | Safed Rang — House of Sushma";
  }, []);

  const categories = ["All", ...FAQ_DATA.map((c) => c.category)];

  // Filter items based on active category and search query
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return FAQ_DATA.map((catGroup) => {
      if (activeCategory !== "All" && catGroup.category !== activeCategory) {
        return null;
      }

      const filteredItems = catGroup.items.filter((item) => {
        if (!q) return true;
        return (
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
        );
      });

      if (filteredItems.length === 0) return null;

      return {
        ...catGroup,
        items: filteredItems,
      };
    }).filter(Boolean);
  }, [activeCategory, searchQuery]);

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="faq-page">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="faq-hero">
        <div className="faq-hero-bg">
          <img
            src="/one-of-one-banner-4k.webp"
            alt="Safed Rang Heirloom Lucknowi Craft"
            className="faq-hero-img"
          />
          <div className="faq-hero-overlay" />
        </div>

        <div className="container faq-hero-container text-center">
          <span className="faq-eyebrow">CLIENT CONCIERGE & ASSISTANCE</span>
          <h1 className="faq-hero-title">
            Frequently Asked <br />
            <span className="faq-hero-title-italic">Questions.</span>
          </h1>
          <p className="faq-hero-subtitle">
            Everything you need to know about our handcrafted Lucknowi Chikankari,
            exclusive One-of-One drapes, bespoke tailoring, and worldwide client care.
          </p>

          {/* Search Bar */}
          <div className="faq-search-wrap">
            <Search size={18} className="faq-search-icon" />
            <input
              type="text"
              placeholder="Search questions (e.g. Chikankari, One-of-One, Blouse tailoring, Shipping)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="faq-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="faq-search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. CATEGORY FILTER TABS                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="faq-nav-section">
        <div className="container">
          <div className="faq-tabs-row">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`faq-tab-btn ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MAIN ACCORDION LIST                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="faq-content-section">
        <div className="container faq-container">
          {filteredData.length === 0 ? (
            <div className="faq-empty-state text-center">
              <HelpCircle size={44} className="empty-icon" />
              <h3>No matching questions found</h3>
              <p>
                We could not find any questions matching "{searchQuery}". Our concierge
                is readily available to answer your query directly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="btn-secondary faq-reset-btn"
              >
                RESET FILTERS
              </button>
            </div>
          ) : (
            filteredData.map((group, groupIdx) => (
              <div key={group.category} className="faq-group-block">
                <div className="faq-group-header">
                  <span className="group-ornament">❖</span>
                  <h2 className="faq-group-title">{group.category}</h2>
                  <span className="group-count">({group.items.length})</span>
                </div>

                <div className="faq-group-items">
                  {group.items.map((item, itemIdx) => {
                    const key = `${groupIdx}-${itemIdx}`;
                    const isOpen = !!openItems[key];

                    return (
                      <div
                        key={item.q}
                        className={`faq-card ${isOpen ? "faq-card--open" : ""}`}
                      >
                        <button
                          type="button"
                          className="faq-card-header"
                          onClick={() => toggleItem(groupIdx, itemIdx)}
                          aria-expanded={isOpen}
                        >
                          <span className="faq-card-question">{item.q}</span>
                          <span className="faq-card-arrow">
                            <ChevronDown
                              size={18}
                              className={`arrow-icon ${isOpen ? "rotated" : ""}`}
                            />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="faq-card-body">
                            <p>{item.a}</p>
                            {item.hasCareLink && (
                              <div className="faq-card-link-wrap">
                                <Link to="/care" className="faq-inline-care-link">
                                  <span>Explore our Complete Care Guide</span>
                                  <ArrowRight size={13} />
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. CONCIERGE HELP CARD                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="faq-concierge-section">
        <div className="container">
          <div className="faq-concierge-card">
            <div className="concierge-text-side">
              <span className="concierge-kicker">PERSONALIZED ASSISTANCE</span>
              <h2 className="concierge-title">Have a Question Not Listed Here?</h2>
              <p className="concierge-desc">
                Our atelier stylists and client relations team in Lucknow will be pleased
                to assist you with fabric inquiries, order updates, or custom requests.
              </p>

              <div className="concierge-contact-chips">
                <a href="tel:+919151566602" className="chip-link">
                  <Phone size={14} /> +91 91515 66602
                </a>
                <a
                  href="https://api.whatsapp.com/send?phone=919151566602&text=Hello%20Safed%20Rang%20Atelier%2C%20I%20have%20a%20question%20regarding..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip-link chip-link--whatsapp"
                >
                  <MessageCircle size={14} /> Chat on WhatsApp
                </a>
                <a href="mailto:contact@safedrang.com" className="chip-link">
                  <Mail size={14} /> contact@safedrang.com
                </a>
              </div>
            </div>

            <div className="concierge-cta-side">
              <Link to="/contact" className="btn-primary concierge-cta-btn">
                <span>CONNECT WITH ATELIER</span>
                <ArrowRight size={14} />
              </Link>
              <span className="concierge-timing">
                Mon – Sat: 10:00 AM – 7:00 PM IST
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. CLOSING INVITATION                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="faq-closing-section">
        <div className="container text-center">
          <div className="closing-ornament">
            <span className="ornament-stitch" />
            <span className="ornament-diamond">❖</span>
            <span className="ornament-stitch" />
          </div>

          <h2 className="closing-title">A craft to carry forward.</h2>
          <p className="closing-subtitle">
            Explore our curated collections of Lucknowi Chikankari and One-of-One
            heirloom couture.
          </p>

          <div className="closing-actions">
            <Link to="/shop" className="btn-primary closing-btn-primary">
              EXPLORE THE COLLECTION
            </Link>
            <Link to="/one-of-one" className="btn-secondary closing-btn-secondary">
              DISCOVER ONE-OF-ONE
            </Link>
          </div>

          <div className="closing-brandmark">
            <span className="brand-house">HOUSE OF SUSHMA</span>
            <span className="brand-name">SAFED RANG</span>
            <span className="brand-city">LUCKNOW</span>
          </div>
        </div>
      </section>
    </div>
  );
}
