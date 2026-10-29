import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import "./About.css";

const PHILOSOPHY_PRINCIPLES = [
  {
    num: "01",
    title: "CRAFT OVER CONVENIENCE",
    description: "We celebrate the skill and attention that traditional craftsmanship requires.",
  },
  {
    num: "02",
    title: "ARTISANS OVER AUTOMATION",
    description: "We value the human expertise that brings hand-embroidered designs to life.",
  },
  {
    num: "03",
    title: "INDIVIDUALITY OVER REPETITION",
    description: "We appreciate the distinct character of handcrafted creations.",
  },
  {
    num: "04",
    title: "PATIENCE OVER SPEED",
    description: "We believe that considered work deserves time and care.",
  },
];

const WARDROBE_CATEGORIES = [
  {
    title: "SAREES",
    subtitle: "Heirloom drapes & hand-embroidered weaves",
    image: "/woman_chikankari_saree.jpg",
    link: "/shop?category=Sarees",
  },
  {
    title: "KURTA SETS",
    subtitle: "Understated silhouettes for timeless celebrations",
    image: "/kurtaset_category.jpeg",
    link: "/shop?category=Kurta+Sets",
  },
  {
    title: "DUPATTAS",
    subtitle: "Delicate Chanderi & silk Chikankari accents",
    image: "/dupatta_category.webp",
    link: "/shop?category=Dupattas",
  },
  {
    title: "BLOUSES",
    subtitle: "Tailored embroidery & handcrafted finishings",
    image: "/blouse_category.jpeg",
    link: "/shop?category=Blouses",
  },
];

export default function About() {
  const pageRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.title = "About Us | Safed Rang — House of Sushma";
  }, []);

  // IntersectionObserver for gentle scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const revealElements = document.querySelectorAll(".about-reveal-item");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-editorial-page" ref={pageRef}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 01 — HERO                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-hero-section">
        <div className="about-hero-backdrop">
          <img
            src="/woman_chikankari_saree.jpg"
            alt="Safed Rang Heirloom Handloom Saree"
            className="about-hero-img"
          />
          <div className="about-hero-gradient-overlay" />
        </div>

        <div className="container about-hero-container">
          <div className="about-hero-content about-reveal-item">
            <div className="about-hero-eyebrow-wrap">
              <span className="about-eyebrow">HOUSE OF SUSHMA</span>
            </div>

            <h1 className="about-hero-title">
              A LOVE FOR SAREES. <br />
              <span className="about-hero-title-italic">A WORLD OF CRAFTSMANSHIP.</span>
            </h1>

            <div className="about-hero-copy">
              <p>
                Safed Rang was born from an appreciation for the timeless beauty of
                Indian textiles and the artistry that makes every handcrafted creation
                distinctive.
              </p>
              <p>
                Rooted in Lucknow's celebrated embroidery heritage, we bring together
                traditional craftsmanship, thoughtful design, and a contemporary
                approach to dressing.
              </p>
              <p className="about-hero-lead">
                For us, luxury is not simply what you see. It is the care behind the
                detail, the skill within every stitch, and the character that makes a
                piece feel entirely its own.
              </p>
            </div>

            <div className="about-hero-actions">
              <Link to="/shop" className="btn-primary about-btn-primary">
                EXPLORE THE COLLECTION
              </Link>
              <Link to="/craft" className="btn-secondary about-btn-secondary">
                DISCOVER OUR CRAFT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 02 — OUR BEGINNING                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-section about-beginning-section">
        <div className="container">
          <div className="about-asymmetric-grid">
            {/* Media Column */}
            <div className="about-media-col about-reveal-item">
              <div className="about-image-card">
                <img
                  src="/pdp-2.jpg"
                  alt="Sushma Singh's appreciation for sarees and craftsmanship"
                  className="about-editorial-photo"
                  loading="lazy"
                />
                <div className="about-image-badge">
                  <span className="badge-tag">SAFED RANG ATELIER</span>
                  <span className="badge-craft">LUCKNOW</span>
                </div>
              </div>
            </div>

            {/* Narrative Column */}
            <div className="about-text-col about-reveal-item">
              <div className="about-section-header">
                <span className="about-section-kicker">THE IDEA BEHIND SAFED RANG</span>
                <h2 className="about-section-title">A LOVE THAT BECAME A LABEL.</h2>
              </div>

              <div className="about-section-body">
                <p>
                  At the heart of Safed Rang is Sushma Singh's appreciation for sarees,
                  the beauty of Indian craftsmanship, and the stories that garments can
                  carry.
                </p>
                <p>
                  Inspired by Lucknow's rich textile heritage, Safed Rang is built around
                  a simple belief: a beautifully made garment has a character beyond its
                  appearance.
                </p>
                <p>
                  It carries the vision behind its design, the skill required to create it,
                  and the small details that make it meaningful to the person who wears it.
                </p>
                <p>
                  Our aim is to bring this appreciation into a contemporary wardrobe,
                  creating a space where traditional Indian artistry can be experienced
                  through thoughtfully chosen designs.
                </p>
                <p>
                  We believe that heritage need not remain in the past. It can continue to
                  evolve, find new audiences, and become part of the way we dress today.
                </p>
              </div>

              <div className="about-closing-accent">
                <span className="accent-diamond">❖</span>
                <p className="accent-text">
                  <strong>Rooted in tradition. Designed for the present.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 03 — ROOTED IN LUCKNOW                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-section about-lucknow-section">
        <div className="container">
          <div className="about-asymmetric-grid about-grid-reverse">
            {/* Narrative Column */}
            <div className="about-text-col about-reveal-item">
              <div className="about-section-header">
                <span className="about-section-kicker">OUR HERITAGE</span>
                <h2 className="about-section-title">
                  BORN IN LUCKNOW. INSPIRED BY ITS CRAFT.
                </h2>
              </div>

              <div className="about-section-body">
                <p>
                  Lucknow's Chikankari is more than a decorative tradition. It is a
                  craft shaped by generations of skill, patience, and an understanding
                  of fabric and thread.
                </p>
                <p>
                  Its beauty lies in the details: delicate motifs, fine embroidery,
                  subtle textures, and the balance between what is seen and what is
                  discovered up close.
                </p>
                <p>
                  For Safed Rang, this heritage is an inspiration and an important part
                  of the brand's identity.
                </p>
                <p>
                  We celebrate the character of traditional craftsmanship while exploring
                  how it can find its place in contemporary Indian dressing.
                </p>
                <p>
                  Each creation offers a different expression of that relationship, from
                  understated embroidered pieces to more elaborate designs featuring
                  selected embellishment.
                </p>
                <p>
                  Our connection to Lucknow is expressed through this continuing
                  appreciation for the artistry that gives its textile traditions their
                  distinctive character.
                </p>
              </div>

              <div className="about-closing-accent">
                <span className="accent-diamond">❖</span>
                <p className="accent-text">
                  <strong>We carry a piece of Lucknow with us.</strong>
                </p>
              </div>
            </div>

            {/* Media Column */}
            <div className="about-media-col about-reveal-item">
              <div className="about-image-card">
                <img
                  src="/chikankari.jpg"
                  alt="Authentic Chikankari embroidery tradition in Lucknow"
                  className="about-editorial-photo"
                  loading="lazy"
                />
                <div className="about-image-badge">
                  <span className="badge-tag">LUCKNOWI HERITAGE</span>
                  <span className="badge-craft">CHIKANKARI TRADITION</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 04 — THE BEAUTY OF HANDMADE                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-section about-handmade-section">
        <div className="container">
          <div className="about-dual-layout">
            <div className="about-text-col about-reveal-item">
              <div className="about-section-header">
                <span className="about-section-kicker">THE ARTISTRY</span>
                <h2 className="about-section-title">
                  MADE BY HAND. REMEMBERED FOR ITS DETAILS.
                </h2>
              </div>

              <div className="about-section-body">
                <p>
                  There is a distinctive beauty in something made by hand.
                </p>
                <p>
                  A stitch can follow the same pattern, yet each movement of the needle
                  reflects the attention and experience of the person creating it.
                </p>
                <p>
                  At Safed Rang, we celebrate the skill behind traditional Chikankari
                  embroidery and the artistry that brings intricate designs to life.
                </p>
                <p>
                  Selected creations also feature techniques such as Zardozi and
                  Mukaish, where additional detailing introduces texture, depth, and a
                  different expression of elegance.
                </p>
                <p>
                  Handcrafted work can carry subtle variations in stitches, motifs, and
                  finishing. These details are part of its individual character, rather
                  than something to be measured against the uniformity of machine
                  production.
                </p>
                <p>
                  We believe craftsmanship deserves to be appreciated not only from a
                  distance, but also up close.
                </p>
              </div>

              <div className="about-closing-accent">
                <span className="accent-diamond">❖</span>
                <p className="accent-text">
                  <strong>The difference is in the details.</strong>
                </p>
              </div>

              <div className="about-section-cta">
                <Link to="/craft" className="btn-secondary about-inline-cta">
                  <span>EXPLORE THE CRAFT</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Media Gallery Pair */}
            <div className="about-macro-gallery about-reveal-item">
              <div className="macro-card macro-card-primary">
                <img
                  src="/embellishment.jpg"
                  alt="Zardozi, Mukaish, beads and pearls on the adda frame"
                  className="macro-photo"
                  loading="lazy"
                />
                <span className="macro-label">ZARDOZI & MUKAISH WORK</span>
              </div>
              <div className="macro-card macro-card-secondary">
                <img
                  src="/pdp-3.jpg"
                  alt="Delicate hand-embroidered Chikankari needlework"
                  className="macro-photo"
                  loading="lazy"
                />
                <span className="macro-label">HAND EMBROIDERY CLOSE-UP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 05 — A MORE THOUGHTFUL APPROACH (SLOW FASHION)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-section about-philosophy-section">
        <div className="container">
          <div className="about-philosophy-header text-center about-reveal-item">
            <span className="about-section-kicker">OUR PHILOSOPHY</span>
            <h2 className="about-section-title">SLOW FASHION. THOUGHTFUL CREATIONS.</h2>
            <div className="about-philosophy-intro">
              <p>
                We believe that beautiful clothing deserves time and consideration.
              </p>
              <p>
                Rather than treating every design as something to be reproduced
                endlessly, Safed Rang values the character of individual creations and
                the attention invested in bringing them to life.
              </p>
              <p>
                Our approach celebrates considered design, the skill of the artisans
                behind the work, and the individuality of garments created in limited
                quantities.
              </p>
              <p>
                For some pieces, the appeal lies in quiet elegance and delicate detail.
                For others, it is the richness of their embroidery or the distinctive
                combination of fabric and embellishment.
              </p>
              <p>
                The aim is to offer creations with their own character, rather than
                simply more of the same.
              </p>
            </div>

            <div className="philosophy-central-lead">
              <span>Less about repetition. More about intention.</span>
            </div>
          </div>

          {/* Four Principles Grid */}
          <div className="about-principles-grid about-reveal-item">
            {PHILOSOPHY_PRINCIPLES.map((item, idx) => (
              <div key={idx} className="principle-column">
                <div className="principle-num-line">
                  <span className="principle-num">{item.num}</span>
                  <span className="principle-line" />
                </div>
                <h3 className="principle-heading">{item.title}</h3>
                <p className="principle-desc">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 06 — THE ONE-OF-ONE SPIRIT                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-section about-one-of-one-section">
        <div className="container">
          <div className="about-asymmetric-grid">
            <div className="about-text-col about-reveal-item">
              <div className="about-section-header">
                <span className="about-section-kicker wine-kicker">
                  A DIFFERENT KIND OF EXCLUSIVITY
                </span>
                <h2 className="about-section-title wine-title">
                  SOME CREATIONS ARE MEANT TO EXIST ONLY ONCE.
                </h2>
              </div>

              <div className="about-section-body wine-body">
                <p>
                  Among the expressions of Safed Rang's craftsmanship is a special
                  appreciation for individuality.
                </p>
                <p>
                  The One-of-One edit celebrates selected creations whose combination
                  of design, fabric, embroidery, and embellishment gives each piece its
                  own identity.
                </p>
                <p>
                  These are pieces to be discovered individually, appreciated for their
                  character, and chosen for what makes them distinctive.
                </p>
                <p>
                  Once a genuine One-of-One creation is sold, its design is retired
                  rather than presented as an endlessly repeatable product.
                </p>
                <p>
                  For us, exclusivity is not simply about a label. It is about recognising
                  the individual character of a creation and allowing it to remain
                  singular.
                </p>
              </div>

              <div className="about-closing-accent wine-accent">
                <span className="accent-diamond gold-diamond">❖</span>
                <p className="accent-text gold-text">
                  <em>One creation. Its own character. Never quite the same story.</em>
                </p>
              </div>

              <div className="about-section-cta">
                <Link to="/one-of-one" className="btn-secondary about-wine-btn">
                  <span>DISCOVER ONE-OF-ONE</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="about-media-col about-reveal-item">
              <div className="about-image-card wine-image-card">
                <img
                  src="/one-of-one-banner.webp"
                  alt="Safed Rang One-of-One exclusive couture drape"
                  className="about-editorial-photo"
                  loading="lazy"
                />
                <div className="about-image-badge wine-badge">
                  <span className="badge-tag">ONE-OF-ONE ARCHIVE</span>
                  <span className="badge-craft">EXCLUSIVE ATELIER</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 07 — WHAT WE CREATE                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-section about-wardrobe-section">
        <div className="container">
          <div className="about-wardrobe-header text-center about-reveal-item">
            <span className="about-section-kicker">THE SAFED RANG WARDROBE</span>
            <h2 className="about-section-title">TRADITION, EXPRESSED IN MANY WAYS.</h2>
            <div className="about-wardrobe-intro">
              <p>
                The beauty of Indian craftsmanship takes many forms.
              </p>
              <p>
                Sarees remain at the heart of the Safed Rang story, from delicate
                Chikankari designs to selected creations with more elaborate embroidery
                and embellishment.
              </p>
              <p>
                Our wider collection includes Kurta Sets, dupattas, blouses, and other
                pieces that bring traditional artistry into different occasions and
                expressions of personal style.
              </p>
              <p>
                Each category has its own character, but the intention remains
                consistent: to celebrate considered design, thoughtful detailing, and
                the enduring appeal of Indian craftsmanship.
              </p>
            </div>
          </div>

          {/* Editorial Category Grid */}
          <div className="wardrobe-editorial-grid about-reveal-item">
            {WARDROBE_CATEGORIES.map((cat, idx) => (
              <Link to={cat.link} key={idx} className="wardrobe-cat-card">
                <div className="cat-image-wrapper">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="cat-photo"
                    loading="lazy"
                  />
                  <div className="cat-hover-overlay">
                    <span className="cat-view-label">
                      EXPLORE {cat.title} <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
                <div className="cat-meta">
                  <h3 className="cat-title">{cat.title}</h3>
                  <p className="cat-subtitle">{cat.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="wardrobe-cta-wrap text-center about-reveal-item">
            <Link to="/shop" className="btn-primary about-btn-primary">
              EXPLORE THE COLLECTION
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 08 — OUR BELIEF                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-section about-belief-section">
        <div className="container">
          <div className="about-belief-card text-center about-reveal-item">
            <div className="belief-ornament">
              <span className="ornament-stitch" />
              <span className="ornament-diamond">❖</span>
              <span className="ornament-stitch" />
            </div>

            <span className="about-section-kicker">A NOTE FROM SAFED RANG</span>
            <h2 className="about-section-title belief-title">
              HERITAGE SHOULD BE WORN. CELEBRATED. KEPT ALIVE.
            </h2>

            <div className="about-belief-narrative">
              <p>
                We believe Indian craftsmanship belongs in the lives of the people
                who appreciate it.
              </p>
              <p>
                It belongs in the garments we choose for celebrations, in the pieces
                we return to over the years, and in the details that remind us of the
                artistry behind what we wear.
              </p>
              <p>
                At Safed Rang, our aspiration is to create a space where the beauty of
                Lucknow's embroidery heritage can continue to inspire contemporary
                fashion.
              </p>
              <p>
                Every thoughtfully chosen piece is an opportunity to appreciate the
                relationship between craft, design, and the person who wears it.
              </p>
              <p>
                Because preserving a tradition is not only about remembering where it
                came from. It is also about allowing it to remain meaningful today.
              </p>
            </div>

            <div className="belief-closing-manifesto">
              <p className="manifesto-phrase">
                Craftsmanship is our inspiration. Individuality is our philosophy.
                Timeless elegance is our pursuit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 09 — FINAL CALL TO ACTION                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-finale-section">
        <div className="container text-center about-reveal-item">
          <div className="finale-ornament">
            <span className="ornament-stitch" />
            <span className="ornament-diamond">❖</span>
            <span className="ornament-stitch" />
          </div>

          <h2 className="about-finale-title">
            A SAREE IS MORE THAN SOMETHING YOU WEAR.
          </h2>

          <div className="about-finale-narrative">
            <p>
              It can carry a memory, celebrate a moment, and become part of your own
              story.
            </p>
            <p className="finale-highlight">
              Discover Safed Rang, where traditional craftsmanship meets a
              contemporary appreciation for timeless Indian dressing.
            </p>
          </div>

          <div className="about-finale-actions">
            <Link to="/shop" className="btn-primary finale-btn-primary">
              EXPLORE THE COLLECTION
            </Link>
            <Link to="/journey" className="btn-secondary finale-btn-secondary">
              FOLLOW THE JOURNEY
            </Link>
          </div>

          <div className="about-brandmark">
            <span className="brandmark-house">HOUSE OF SUSHMA</span>
            <span className="brandmark-name">SAFED RANG</span>
            <span className="brandmark-city">LUCKNOW</span>
          </div>
        </div>
      </section>
    </div>
  );
}
