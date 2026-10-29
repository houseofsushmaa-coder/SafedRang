import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Contact.css";

const FAQ_ITEMS = [
  {
    q: "How do I inquire about or purchase a One-of-One creation?",
    a: "Every One-of-One creation is an exclusive, non-repeatable heirloom drape. You can acquire available pieces directly through our One-of-One edit or connect with our atelier concierge on WhatsApp at +91 91515 66602 for close-up video walkthroughs and styling consultations before ordering.",
  },
  {
    q: "Do you offer international and pan-India shipping?",
    a: "Yes. Safed Rang ships across all pin codes in India with insured express delivery, as well as worldwide to our international patrons. Delivery timelines and tracking details are shared immediately once your handcrafted creation is dispatched.",
  },
  {
    q: "Can I request custom blouse tailoring, fall, and pico finishings?",
    a: "Yes. All our sarees can be completed with complimentary fall and edging (pico) upon request. For custom blouse stitching or customized measurements, simply mention it in your order notes or message our concierge on WhatsApp.",
  },
  {
    q: "How do I care for my handcrafted Chikankari and Zardozi garments?",
    a: "Handcrafted Lucknowi textiles require gentle care. Pure silk, organza, and heavy Zardozi creations should always be professionally dry cleaned. For detailed fabric-by-fabric instructions, please explore our dedicated Care Guide.",
    hasCareLink: true,
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Saree Consultation & Styling",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.title = "Contact Atelier | Safed Rang — House of Sushma";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setIsSubmitting(true);

    // Simulate luxury inquiry dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success(
        "Thank you for contacting Safed Rang. Our atelier concierge will respond within 24 hours."
      );
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Saree Consultation & Styling",
        message: "",
      });
    }, 900);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="contact-page">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-hero">
        <div className="contact-hero-backdrop">
          <img
            src="/one-of-one-banner-4k.webp"
            alt="Safed Rang Lucknow Atelier"
            className="contact-hero-bg-img"
          />
          <div className="contact-hero-overlay" />
        </div>

        <div className="container contact-hero-container">
          <div className="contact-hero-content text-center">
            <span className="contact-eyebrow">HOUSE OF SUSHMA ATELIER</span>
            <h1 className="contact-hero-title">
              We Welcome Your <br />
              <span className="contact-hero-title-italic">Conversation.</span>
            </h1>
            <p className="contact-hero-subtitle">
              Whether you seek styling advice for a forthcoming celebration, guidance on
              our One-of-One exclusive edit, or bespoke concierge assistance, our atelier
              team is at your service.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. DIRECT CONTACT CARDS (PHONE, WHATSAPP, EMAIL)               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-channels-section">
        <div className="container">
          <div className="contact-channels-grid">
            {/* Channel 1: Telephony */}
            <div className="channel-card">
              <div className="channel-icon-wrap">
                <Phone size={22} className="channel-icon" />
              </div>
              <span className="channel-kicker">DIRECT VOICE ASSISTANCE</span>
              <h3 className="channel-heading">+91 91515 66602</h3>
              <p className="channel-desc">
                Speak directly with our concierge team regarding sizing, orders, and
                product inquiries.
              </p>
              <div className="channel-meta">
                <Clock size={13} />
                <span>Mon – Sat: 10:00 AM – 7:00 PM IST</span>
              </div>
              <a href="tel:+919151566602" className="channel-action-btn">
                <span>CALL ATELIER</span>
                <ArrowRight size={13} />
              </a>
            </div>

            {/* Channel 2: WhatsApp (Highlighted) */}
            <div className="channel-card channel-card--featured">
              <div className="channel-featured-badge">MOST RESPONSIVE</div>
              <div className="channel-icon-wrap channel-icon-wrap--wine">
                <MessageCircle size={22} className="channel-icon" />
              </div>
              <span className="channel-kicker">WHATSAPP ATELIER CONCIERGE</span>
              <h3 className="channel-heading">+91 91515 66602</h3>
              <p className="channel-desc">
                Connect for high-definition saree drape videos, color matching, and
                personalized trousseau curation.
              </p>
              <div className="channel-meta">
                <Sparkles size={13} />
                <span>Instant replies during atelier hours</span>
              </div>
              <a
                href="https://api.whatsapp.com/send?phone=919151566602&text=Hello%20Safed%20Rang%20Atelier%2C%20I%20would%20like%20to%20inquire%20about%20your%20handcrafted%20collections."
                target="_blank"
                rel="noopener noreferrer"
                className="channel-action-btn channel-action-btn--gold"
              >
                <span>CHAT ON WHATSAPP</span>
                <ArrowRight size={13} />
              </a>
            </div>

            {/* Channel 3: Email */}
            <div className="channel-card">
              <div className="channel-icon-wrap">
                <Mail size={22} className="channel-icon" />
              </div>
              <span className="channel-kicker">WRITTEN CORRESPONDENCE</span>
              <h3 className="channel-heading">contact@safedrang.com</h3>
              <p className="channel-desc">
                Send formal inquiries, custom commissions, or press and corporate
                communications.
              </p>
              <div className="channel-meta">
                <Clock size={13} />
                <span>Replies within 24 business hours</span>
              </div>
              <a href="mailto:contact@safedrang.com" className="channel-action-btn">
                <span>WRITE AN EMAIL</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. INQUIRY FORM & STUDIO LOCATION                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-main-section">
        <div className="container">
          <div className="contact-main-grid">
            {/* Form Column */}
            <div className="contact-form-column">
              <div className="form-header">
                <span className="form-kicker">SEND AN INQUIRY</span>
                <h2 className="form-title">How May We Assist You?</h2>
                <p className="form-subtitle">
                  Please complete the form below. A dedicated member of our atelier will
                  be delighted to attend to your request.
                </p>
              </div>

              {isSubmitted ? (
                <div className="form-success-card">
                  <div className="success-icon-wrap">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3>Message Received</h3>
                  <p>
                    Thank you for reaching out to Safed Rang. Our concierge team has
                    received your inquiry and will be in touch shortly via email or
                    WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="btn-secondary success-reset-btn"
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                </div>
              ) : (
                <form className="contact-inquiry-form" onSubmit={handleSubmit}>
                  <div className="form-row-dual">
                    <div className="form-group">
                      <label htmlFor="name">
                        YOUR NAME <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Priyanshi Sharma"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        EMAIL ADDRESS <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. priyanshi@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-dual">
                    <div className="form-group">
                      <label htmlFor="phone">PHONE / WHATSAPP NUMBER</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">INQUIRY TYPE</label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                      >
                        <option value="Saree Consultation & Styling">
                          Saree Consultation & Styling
                        </option>
                        <option value="One-of-One Exclusive Order">
                          One-of-One Exclusive Order
                        </option>
                        <option value="Custom Sizing & Blouse Tailoring">
                          Custom Sizing & Blouse Tailoring
                        </option>
                        <option value="Bridal & Trousseau Curation">
                          Bridal & Trousseau Curation
                        </option>
                        <option value="Order Status & Delivery">
                          Order Status & Delivery
                        </option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">
                      YOUR MESSAGE <span className="req">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please share details of the pieces you are interested in, occasion dates, or any bespoke requirements..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary contact-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>SENDING INQUIRY...</span>
                    ) : (
                      <>
                        <span>TRANSMIT MESSAGE</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Atelier Studio Details Column */}
            <div className="contact-atelier-column">
              <div className="atelier-info-card">
                <div className="atelier-photo-wrap">
                  <img
                    src="/pdp-2.jpg"
                    alt="Safed Rang Lucknow Atelier Drape"
                    className="atelier-photo"
                  />
                  <div className="atelier-photo-badge">
                    <span className="badge-tag">HOUSE OF SUSHMA</span>
                    <span className="badge-city">LUCKNOW, INDIA</span>
                  </div>
                </div>

                <div className="atelier-details-content">
                  <div className="atelier-brand-heading">
                    <span className="atelier-kicker">HERITAGE ATELIER</span>
                    <h3 className="atelier-name">Safed Rang Studio</h3>
                    <p className="atelier-sub">
                      Rooted in the timeless textile capital of Lucknow, celebrating
                      authentic Chikankari, Zardozi, and handloom drapes.
                    </p>
                  </div>

                  <div className="atelier-contact-list">
                    <div className="atelier-contact-item">
                      <Phone size={16} className="item-icon" />
                      <div>
                        <span className="item-label">Telephone / WhatsApp</span>
                        <a href="tel:+919151566602" className="item-val">
                          +91 91515 66602
                        </a>
                      </div>
                    </div>

                    <div className="atelier-contact-item">
                      <Mail size={16} className="item-icon" />
                      <div>
                        <span className="item-label">Client Relations Email</span>
                        <a href="mailto:contact@safedrang.com" className="item-val">
                          contact@safedrang.com
                        </a>
                      </div>
                    </div>

                    <div className="atelier-contact-item">
                      <MapPin size={16} className="item-icon" />
                      <div>
                        <span className="item-label">Atelier Location</span>
                        <span className="item-val item-val--text">
                          Lucknow, Uttar Pradesh, India
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="atelier-commitments">
                    <h4 className="commitments-title">Our Concierge Commitments</h4>
                    <ul className="commitments-list">
                      <li>
                        <span className="bullet">❖</span>
                        <span>
                          <strong>Bespoke Styling:</strong> Personalized guidance on drape,
                          fabric texture, and motif placement.
                        </span>
                      </li>
                      <li>
                        <span className="bullet">❖</span>
                        <span>
                          <strong>One-of-One Archival Access:</strong> Private viewings of
                          singular pieces before retirement.
                        </span>
                      </li>
                      <li>
                        <span className="bullet">❖</span>
                        <span>
                          <strong>Care Expertise:</strong> Dedicated support for the
                          lifelong preservation of your garments.
                        </span>
                      </li>
                    </ul>

                    <div className="care-link-wrap">
                      <Link to="/care" className="care-guide-link">
                        <span>Read our Garment Care Guide</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. FREQUENTLY ASKED QUESTIONS                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-faq-section">
        <div className="container">
          <div className="faq-header text-center">
            <span className="faq-kicker">CLIENT SERVICES FAQ</span>
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <p className="faq-subtitle">
              Quick answers regarding orders, custom tailoring, and our one-of-one
              creations.
            </p>
          </div>

          <div className="faq-accordion-wrap">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-item-card ${isOpen ? "faq-item-card--open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">{item.q}</span>
                    <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer-pane">
                      <p>{item.a}</p>
                      {item.hasCareLink && (
                        <Link to="/care" className="faq-inline-link">
                          Explore our Care Guide &rarr;
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. CLOSING INVITATION                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-closing-section">
        <div className="container text-center">
          <div className="closing-ornament">
            <span className="ornament-stitch" />
            <span className="ornament-diamond">❖</span>
            <span className="ornament-stitch" />
          </div>

          <h2 className="closing-title">Every thread begins with a conversation.</h2>
          <p className="closing-subtitle">
            Allow us to assist you in discovering the ideal handcrafted creation for your
            treasured moments.
          </p>

          <div className="closing-actions">
            <Link to="/shop" className="btn-primary closing-btn-primary">
              EXPLORE THE COLLECTION
            </Link>
            <Link to="/journey" className="btn-secondary closing-btn-secondary">
              DISCOVER OUR JOURNEY
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
