import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Star,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Gem,
  BadgeCheck,
  Feather,
  Crown,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import "./Home.css";

/* ── Scroll-reveal hook ── */
function useScrollReveal(options = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: options.threshold ?? 0.12, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Real Reviews Data ── */
const REVIEWS = [
  {
    id: 1,
    quote:
      "I wore my Chanderi saree to my sister's wedding and received compliments the entire evening. The embroidery detail is extraordinary — you can feel every stitch.",
    name: "Priya Mehrotra",
    location: "Delhi",
    rating: 5,
    product: "Chanderi Chikankari Saree",
    verified: true,
  },
  {
    id: 2,
    quote:
      "Finally found a brand that truly understands Chikankari. My dupatta arrived in a beautiful box — even the packaging felt luxury. Will not shop anywhere else.",
    name: "Ananya Srivastava",
    location: "Lucknow",
    rating: 5,
    product: "Georgette Chikankari Dupatta",
    verified: true,
  },
  {
    id: 3,
    quote:
      "The craftsmanship is unmatched. I've bought three pieces now — each one better than the last. This is what slow fashion should look like.",
    name: "Radhika Khanna",
    location: "Mumbai",
    rating: 5,
    product: "Silk Zardozi Kurta Set",
    verified: true,
  },
  {
    id: 4,
    quote:
      "My kurta set arrived exactly as shown. Ordered custom measurements and they got every detail right. Outstanding customer care and fast delivery.",
    name: "Divya Nair",
    location: "Bangalore",
    rating: 4,
    product: "Pista Green Kurta Set",
    verified: true,
  },
  {
    id: 5,
    quote:
      "Safedrang is preserving something incredibly rare. The artistry is museum-worthy yet wearable every day. My blouse is my most treasured piece.",
    name: "Meera Joshi",
    location: "Jaipur",
    rating: 5,
    product: "Rusty Red Chikankari Blouse",
    verified: true,
  },
  {
    id: 6,
    quote:
      "Bought as a gift for my mother's birthday. She cried when she opened it. The weight, the fall, the embroidery — nothing compares. Worth every rupee.",
    name: "Sunita Agarwal",
    location: "Kolkata",
    rating: 5,
    product: "Tusser Silk Saree",
    verified: true,
  },
];

export default function Home() {
  const promiseRef = useScrollReveal();
  const categoryRef = useScrollReveal({ threshold: 0.08 });
  const oooRef = useScrollReveal({ threshold: 0.1 });
  const journeyRef = useScrollReveal({ threshold: 0.08 });
  const whyChooseUsRef = useScrollReveal({ threshold: 0.08 });
  const testimonialsRef = useScrollReveal({ threshold: 0.08 });
  const journalRef = useScrollReveal({ threshold: 0.08 });

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero">
        <div className="hero-video-bg">
          <video autoPlay loop muted playsInline src="/videos/video1.mp4" />
          <video autoPlay loop muted playsInline src="/videos/video2.mp4" />
          <video autoPlay loop muted playsInline src="/videos/video3.mp4" />
          <video autoPlay loop muted playsInline src="/videos/video4.mp4" />
        </div>
      </section>

      {/* 2. Luxury Promise */}
      <section className="luxury-promise-v2 reveal-section" ref={promiseRef}>
        <div className="container">
          <div className="promise-header text-center">
            <h2 className="section-title">LUXURY, WITHOUT REPETITION</h2>
            <p className="section-subtitle">
              True luxury is not about having more. It is about having something
              that feels uniquely yours.
            </p>
          </div>

          <div className="promise-cards">
            <div className="promise-card stagger-1">
              <div className="icon-wrapper">
                <ShieldCheck size={32} />
              </div>
              <h4>HANDCRAFTED</h4>
              <p>
                Created by skilled artisans in Lucknow, dedicating hundreds of
                hours to a single piece.
              </p>
            </div>
            <div className="promise-card highlight stagger-2">
              <div className="icon-wrapper">
                <Gem size={32} />
              </div>
              <h4>ONE-OF-ONE</h4>
              <p>
                Distinctive designs, never repeated. Every piece exists as a
                singular creation in the world.
              </p>
            </div>
            <div className="promise-card stagger-3">
              <div className="icon-wrapper">
                <Sparkles size={32} />
              </div>
              <h4>HERITAGE</h4>
              <p>
                A bridge between timeless artistry and modern silhouettes for
                the contemporary woman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Shop by Category */}
      <section className="shop-clothing-category-section reveal-section" ref={categoryRef}>
        <div className="clothing-category-header">
          <h2 className="clothing-category-heading">SHOP BY CATEGORY</h2>
        </div>
        <div className="clothing-category-grid">
          <Link to="/shop?category=Sarees" className="clothing-cat-card">
            <img src="/woman_chikankari_saree.jpg" alt="Sarees" />
            <div className="clothing-cat-overlay">
              <h3 className="clothing-cat-title">SAREES</h3>
              <span className="clothing-cat-btn">SHOP NOW</span>
            </div>
          </Link>

          <Link to="/shop?category=Dupattas" className="clothing-cat-card">
            <img src="/dupatta_category.webp" alt="Dupattas" />
            <div className="clothing-cat-overlay">
              <h3 className="clothing-cat-title">DUPATTAS</h3>
              <span className="clothing-cat-btn">SHOP NOW</span>
            </div>
          </Link>

          <Link to="/shop?category=Kurta+Sets" className="clothing-cat-card">
            <img src="/kurtaset_category.jpeg" alt="Kurta Sets" />
            <div className="clothing-cat-overlay">
              <h3 className="clothing-cat-title">KURTA SETS</h3>
              <span className="clothing-cat-btn">SHOP NOW</span>
            </div>
          </Link>

          <Link to="/shop?category=Blouses" className="clothing-cat-card">
            <img src="/blouse_category.jpeg" alt="Blouses" />
            <div className="clothing-cat-overlay">
              <h3 className="clothing-cat-title">BLOUSES</h3>
              <span className="clothing-cat-btn">SHOP NOW</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. One-of-One Immersive Banner */}
      <section className="ooo-immersive reveal-section" ref={oooRef}>
        <div className="ooo-bg-image">
          <img src="/one-of-one-banner.jpg" alt="The One of One Edit - Safed Rang" />
          <div className="ooo-bg-overlay" />
        </div>
        <div className="ooo-content-wrapper container">
          <div className="ooo-glass-card">
            <span className="overline">— A RARE KIND OF BEAUTY —</span>
            <h2>THE ONE-OF-ONE EDIT</h2>
            <p className="italic">
              There will never be another exactly like it.
            </p>
            <p className="ooo-desc">
              Each piece is created with its own combination of fabric, colour,
              embroidery and embellishment. Once it finds its woman, the design
              is retired permanently.
            </p>
            <Link to="/one-of-one" className="btn-ooo-cta">
              EXPLORE THE EDIT <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. The Journey */}
      <section className="journey-section container reveal-section" ref={journeyRef}>
        <div className="journey-header">
          <h2 className="section-title">FROM CHHAPAI TO CREATION</h2>
          <p>A journey of skill, patience, and unwavering artistry.</p>
        </div>

        <div className="journey-steps">
          <div className="j-step left stagger-1">
            <div className="j-image">
              <img src="/chhapai.jpg" alt="Chhapai" />
            </div>
            <div className="j-content">
              <span className="step-num">01</span>
              <h3>CHHAPAI</h3>
              <p>
                The design begins its journey, meticulously block-printed onto
                the finest fabrics to guide the artisans' hands.
              </p>
            </div>
          </div>

          <div className="j-step right stagger-2">
            <div className="j-content">
              <span className="step-num">02</span>
              <h3>CHIKANKARI</h3>
              <p>
                Artisans bring the design to life, stitch by stitch. A single
                piece can take months of dedicated handwork.
              </p>
            </div>
            <div className="j-image">
              <img src="/chikankari.jpg" alt="Chikankari" />
            </div>
          </div>

          <div className="j-step left stagger-3">
            <div className="j-image">
              <img src="/embellishment.jpg" alt="Embellishment" />
            </div>
            <div className="j-content">
              <span className="step-num">03</span>
              <h3>EMBELLISHMENT</h3>
              <p>
                Zardozi, Moti, Kamdani, and Zari are delicately added, elevating
                the piece with a touch of royal grandeur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why Choose Us? — Lucknow Heritage, Chikankari & Zardozi Artistry */}
      <section className="why-choose-us reveal-section" ref={whyChooseUsRef}>
        <div className="container">
          <div className="why-choose-header text-center">
            <span className="why-choose-eyebrow">— AWADH HERITAGE &amp; SLOW CRAFT —</span>
            <h2 className="why-choose-title">WHY CHOOSE US?</h2>
            <p className="why-choose-subtitle">
              The Soul of Lucknow Chikankari &amp; Royal Zardozi
            </p>
            <div className="why-choose-divider">
              <span className="why-divider-line"></span>
              <span className="why-divider-gem">✦</span>
              <span className="why-divider-line"></span>
            </div>
            <p className="why-choose-lead">
              Rooted in the timeless Tehzeeb of Awadh, every Safed Rang creation is an
              ode to patient human artistry — handcrafted stitch-by-stitch by generational master
              karigars in the historic lanes of Lucknow.
            </p>
          </div>

          <div className="why-cards-grid">
            {/* Card 1: Pure Lucknow Chikankari */}
            <div className="why-card stagger-1">
              <div className="why-card-top">
                <span className="why-card-num">01</span>
                <span className="why-card-tag">32 Classical Stitches</span>
              </div>
              <div className="why-icon-box">
                <Feather size={26} strokeWidth={1.5} />
              </div>
              <h3 className="why-card-title">Pure Chikankari Needlework</h3>
              <p className="why-card-desc">
                Reviving 400 years of Awadhi needlecraft. From the delicate shadow work of <em>Bakhiya</em>,
                embossed knots of <em>Murri &amp; Phanda</em>, to airy <em>Jaali</em> netting — every motif
                is brought to life stitch-by-stitch with needle and thread, never by machine.
              </p>
              <div className="why-card-footer">
                <span className="why-pill">
                  <CheckCircle2 size={13} /> Bakhiya, Murri &amp; Phanda
                </span>
                <span className="why-pill">
                  <CheckCircle2 size={13} /> Zero Machine Stitches
                </span>
              </div>
            </div>

            {/* Card 2: Royal Zardozi Work */}
            <div className="why-card stagger-2">
              <div className="why-card-top">
                <span className="why-card-num">02</span>
                <span className="why-card-tag">Mughal Court Grandeur</span>
              </div>
              <div className="why-icon-box">
                <Crown size={26} strokeWidth={1.5} />
              </div>
              <h3 className="why-card-title">Opulent Royal Zardozi</h3>
              <p className="why-card-desc">
                Tracing its lineage to the royal courts of Awadh. Our karigars meticulously hand-weave
                gilded <em>Kasab</em> wires, <em>Dabka</em>, <em>Moti</em>, and <em>Kamdani Sitara</em> — sculpting
                three-dimensional textures that catch the light with subtle, regal magnificence.
              </p>
              <div className="why-card-footer">
                <span className="why-pill">
                  <CheckCircle2 size={13} /> Real Kasab &amp; Dabka Work
                </span>
                <span className="why-pill">
                  <CheckCircle2 size={13} /> Hand-Set Kamdani &amp; Moti
                </span>
              </div>
            </div>

            {/* Card 3: 100% Handcrafted */}
            <div className="why-card stagger-3">
              <div className="why-card-top">
                <span className="why-card-num">03</span>
                <span className="why-card-tag">Slow Fashion Ethos</span>
              </div>
              <div className="why-icon-box">
                <Clock size={26} strokeWidth={1.5} />
              </div>
              <h3 className="why-card-title">100% Handcrafted Devotion</h3>
              <p className="why-card-desc">
                In a world governed by mass production, we honour slow, unhurried craft. A single Safed Rang
                saree demands 60 to 180 days of dedicated artisan work. No two pieces can ever be identical —
                each piece carries the unique touch of its maker.
              </p>
              <div className="why-card-footer">
                <span className="why-pill">
                  <CheckCircle2 size={13} /> 120+ Dedicated Hours
                </span>
                <span className="why-pill">
                  <CheckCircle2 size={13} /> Irreplaceable Slow Art
                </span>
              </div>
            </div>

            {/* Card 4: Born in Lucknow */}
            <div className="why-card stagger-4">
              <div className="why-card-top">
                <span className="why-card-num">04</span>
                <span className="why-card-tag">City of Nawabs &amp; Tehzeeb</span>
              </div>
              <div className="why-icon-box">
                <MapPin size={26} strokeWidth={1.5} />
              </div>
              <h3 className="why-card-title">Direct From Lucknow</h3>
              <p className="why-card-desc">
                Safed Rang is deeply anchored in the historic craft lanes of Chowk, Lucknow. We bypass commercial
                middlemen to work directly with generational karigar families — ensuring authentic provenance, fair
                patronage, and true Awadhi cultural preservation.
              </p>
              <div className="why-card-footer">
                <span className="why-pill">
                  <CheckCircle2 size={13} /> Chowk Artisan Atelier
                </span>
                <span className="why-pill">
                  <CheckCircle2 size={13} /> Fair-Trade Karigar Support
                </span>
              </div>
            </div>
          </div>

          {/* Hallmark Trust Strip */}
          <div className="why-hallmarks-strip">
            <div className="why-hallmark-item">
              <span className="why-hallmark-metric">400+</span>
              <span className="why-hallmark-label">Years of Awadhi Legacy</span>
            </div>
            <div className="why-hallmark-divider"></div>
            <div className="why-hallmark-item">
              <span className="why-hallmark-metric">100%</span>
              <span className="why-hallmark-label">Hand-Stitched Authenticity</span>
            </div>
            <div className="why-hallmark-divider"></div>
            <div className="why-hallmark-item">
              <span className="why-hallmark-metric">Pure</span>
              <span className="why-hallmark-label">Chanderi, Georgette &amp; Mulmul</span>
            </div>
            <div className="why-hallmark-divider"></div>
            <div className="why-hallmark-item">
              <span className="why-hallmark-metric">Direct</span>
              <span className="why-hallmark-label">Lucknow Karigar Atelier</span>
            </div>
          </div>

          {/* Bottom Link to Craft Page */}
          <div className="why-bottom-cta text-center">
            <Link to="/craft" className="why-craft-btn">
              <span>EXPLORE THE STORY OF OUR CRAFT</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Testimonials — Real reviews carousel */}
      <section className="testimonials-v2 reveal-section" ref={testimonialsRef}>
        <div className="container">
          <div className="testimonials-header text-center">
            <h2 className="section-title">WORN &amp; LOVED</h2>
            <p className="section-subtitle">
              Real stories from women who wear Safedrang
            </p>
          </div>
        </div>
        <div className="testimonials-track-wrapper">
          <div className="testimonials-track">
            {REVIEWS.map((review) => (
              <div key={review.id} className="t-card">
                <div className="t-rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill={i < review.rating ? "var(--color-antique-gold)" : "none"}
                      color={i < review.rating ? "var(--color-antique-gold)" : "#ddd"}
                    />
                  ))}
                </div>
                <div className="t-quote">&#8220;{review.quote}&#8221;</div>
                <div className="t-footer-row">
                  <div className="t-author-info">
                    <span className="t-name">— {review.name}</span>
                    <span className="t-location">{review.location}</span>
                  </div>
                  <div className="t-meta">
                    {review.verified && (
                      <span className="t-verified">
                        <BadgeCheck size={12} /> Verified Purchase
                      </span>
                    )}
                    <span className="t-product">{review.product}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Journal */}
      <section className="journal-section container reveal-section" ref={journalRef}>
        <div className="journal-header flex-between">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            THE JOURNAL
          </h2>
          <Link to="/craft" className="link-explore">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="journal-cards">
          <Link to="/craft" className="j-card">
            <div className="j-img-wrapper">
              <img src="/pdp-4.jpg" alt="Journal 1" />
            </div>
            <div className="j-info">
              <span className="j-date">SEP 12, 2026</span>
              <h4>The Story of Lucknow Chikankari</h4>
            </div>
          </Link>
          <Link to="/craft" className="j-card">
            <div className="j-img-wrapper">
              <img src="/woman_chikankari_saree.jpg" alt="Journal 2" />
            </div>
            <div className="j-info">
              <span className="j-date">AUG 28, 2026</span>
              <h4>32 Chikankari Stitches You Should Know</h4>
            </div>
          </Link>
          <Link to="/craft" className="j-card">
            <div className="j-img-wrapper">
              <img src="/pdp-5.jpg" alt="Journal 3" />
            </div>
            <div className="j-info">
              <span className="j-date">AUG 10, 2026</span>
              <h4>Chikankari vs Machine Made</h4>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
