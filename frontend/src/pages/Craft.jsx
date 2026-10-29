import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, ArrowDown } from "lucide-react";
import "./Craft.css";

const CRAFT_STAGES = [
  {
    id: "stage-01",
    num: "01",
    label: "STAGE 01",
    title: "THE DESIGN",
    subtitle: "Every masterpiece begins with a vision.",
    paragraphs: [
      "Before the first stitch, there is a design.",
      "Floral trails, delicate motifs, intricate borders, and considered patterns give each creation its character. The placement of every detail matters: how it follows the fabric, how it frames the drape, and how it comes alive when worn.",
      "The intention is never simply to decorate a fabric. It is to create a sense of balance, where craftsmanship and design feel like one.",
    ],
    callout: "It begins with an idea. It takes shape through the hands.",
    image: "/pdp-4.jpg",
    imageAlt: "The Design - Conceptualizing intricate floral motifs and silhouettes",
    reverse: false,
  },
  {
    id: "stage-02",
    num: "02",
    label: "STAGE 02",
    title: "CHHAPAI",
    subtitle: "The first mark on the canvas.",
    paragraphs: [
      "The journey moves from design to Chhapai, the traditional art of block printing.",
      "Carved wooden blocks are carefully pressed onto the fabric with washable indigo dye, transferring the pattern that guides the embroidery to follow.",
      "Each impression provides a blueprint for the artisans who come next. The placement must be considered, the pattern must flow, and the details must sit in harmony across the fabric.",
      "A mark that may seem small at first becomes the beginning of something extraordinary.",
    ],
    callout: "The pattern is placed. The artistry begins.",
    image: "/chhapai.jpg",
    imageAlt: "Chhapai - Traditional wooden block printing with natural washable dyes",
    reverse: true,
  },
  {
    id: "stage-03",
    num: "03",
    label: "STAGE 03",
    title: "CHIKANKARI",
    subtitle: "A language spoken in thread.",
    paragraphs: [
      "Chikankari is the heart of Lucknow's embroidery heritage: an art that transforms simple fabric through patience, precision, and the movement of a needle.",
      "Guided by the printed design, skilled artisans work the cloth stitch by stitch, bringing floral forms, delicate textures, and intricate patterns to life.",
      "Traditional techniques such as Tepchi, Bakhiya, Hool, and Murri each contribute their own character to the finished surface.",
      "The finer the design, the more patience it asks of the hands that create it. Depending on the intricacy of the work, a single saree or kurta set may take months to complete; particularly detailed pieces can take a year or longer.",
      "No two stitches are merely repetitions. Together, they create the rhythm, texture, and quiet beauty that make Chikankari distinctive.",
    ],
    callout: "Measured in stitches. Made with patience.",
    image: "/chikankari.jpg",
    imageAlt: "Chikankari - Needle and thread bringing Awadhi floral stitches to life",
    reverse: false,
  },
  {
    id: "stage-04",
    num: "04",
    label: "STAGE 04",
    title: "DHULAI",
    subtitle: "When the details begin to reveal themselves.",
    paragraphs: [
      "Once the embroidery is complete, the fabric moves to Dhulai, the washing and finishing stage of the traditional process.",
      "Where washable Chhapai dye has been used, this stage removes the printing marks and allows the embroidered design to emerge more clearly.",
      "The fabric is then carefully finished, with appropriate washing, starching, and pressing according to the material and the garment's requirements.",
      "What began as a pattern on fabric now reveals the character of the embroidery beneath it.",
    ],
    callout: "The process recedes. The artistry comes into view.",
    image: "/pdp-3.jpg",
    imageAlt: "Dhulai - Washing and hand-finishing revealing pristine needlework",
    reverse: true,
  },
  {
    id: "stage-05",
    num: "05",
    label: "STAGE 05",
    title: "ZARDOZI & EMBELLISHMENT",
    subtitle: "A touch of regal splendour.",
    paragraphs: [
      "For selected designs, including elaborate One-of-One creations and bridal pieces, the journey continues into the world of Zardozi.",
      "The fabric is secured over a traditional embroidery frame, known as an adda, giving artisans a stable surface for their detailed work.",
      "Metallic threads, fine beads, pearls, sequins, and cut-dana are carefully worked into the design, introducing texture, dimension, and a distinctive richness.",
      "Each embellishment changes how the design catches the light. A fine metallic detail can bring definition to a motif; a carefully placed pearl can lend the surface an entirely different character.",
      "This is craftsmanship at its most expressive: intricate, considered, and shaped by the individual design.",
      "Not every creation calls for this stage. When it does, the embellishment becomes part of the piece's own identity.",
    ],
    callout: "For the pieces that call for something extraordinary.",
    image: "/embellishment.jpg",
    imageAlt: "Zardozi & Embellishment - Metallic threads, pearls, and sequins on adda frame",
    reverse: false,
  },
  {
    id: "stage-06",
    num: "06",
    label: "STAGE 06",
    title: "THE FINAL DETAILS",
    subtitle: "Nothing meaningful is hurried.",
    paragraphs: [
      "A handcrafted creation comes together through the relationship between its fabric, design, embroidery, and finish.",
      "The last details bring those elements into harmony: the movement of a motif, the texture of the threadwork, the placement of embellishment, and the way the fabric carries its design.",
      "The result is more than a finished garment. It is an expression of the time, skill, and attention invested in bringing an idea to life.",
      "Some creations are designed to be worn and remembered. Others, from our One-of-One edit, celebrate the individuality of a particular piece.",
      "Each follows its own journey to becoming what it was meant to be.",
    ],
    callout: "Made with intention. Chosen to be treasured.",
    image: "/one-of-one-banner.webp",
    imageAlt: "The Final Details - A finished Safed Rang couture masterpiece",
    reverse: true,
  },
];

export default function Craft() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const scrollToFirstStage = (e) => {
    e.preventDefault();
    const el = document.getElementById("stage-01");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="craft-page">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION: THE ART OF BECOMING                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="craft-hero">
        <div className="craft-hero-ornament">
          <span className="craft-ornament-line"></span>
          <span className="craft-ornament-diamond">❖</span>
          <span className="craft-ornament-line"></span>
        </div>

        <div className="container text-center">
          <span className="craft-eyebrow">SAFED RANG ATELIER</span>
          <h1 className="craft-main-title">THE ART OF BECOMING</h1>
          <p className="craft-hero-tagline">
            Before it becomes a saree, it becomes a story.
          </p>

          <div className="craft-hero-narrative">
            <p>
              In Lucknow, beauty has long been expressed through the smallest of details:
              a delicate thread, a considered motif, a line of embroidery placed just so.
            </p>
            <p>
              At Safed Rang, we celebrate this tradition through creations shaped by
              thoughtful design, the patience of skilled artisans, and the beauty of
              hand-finished detail.
            </p>
            <p className="craft-hero-lead">
              Every piece begins with an idea. What follows is a journey of fabric, pattern,
              needle, and thread—a process in which time is part of the artistry.
            </p>
          </div>

          <div className="craft-hero-action">
            <a
              href="#stage-01"
              onClick={scrollToFirstStage}
              className="craft-scroll-indicator"
              aria-label="Scroll to discover the six stages of craft"
            >
              <span className="scroll-text">DISCOVER THE JOURNEY</span>
              <ArrowDown size={15} className="scroll-arrow" />
            </a>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. STAGE PROGRESS QUICK BAR                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <nav className="craft-stage-nav" aria-label="Craft Stages Navigation">
        <div className="container craft-stage-nav-container">
          {CRAFT_STAGES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="craft-nav-item"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(s.id);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="nav-num">{s.num}</span>
              <span className="nav-title">{s.title}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. THE SIX STAGES OF CREATION                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="craft-stages-container">
        {CRAFT_STAGES.map((stage) => (
          <article
            key={stage.id}
            id={stage.id}
            className={`craft-stage-row ${stage.reverse ? "reverse" : ""}`}
          >
            <div className="container craft-stage-inner">
              {/* Media Column */}
              <div className="craft-stage-media">
                <div className="craft-image-frame">
                  <img
                    src={stage.image}
                    alt={stage.imageAlt}
                    className="craft-stage-img"
                    loading="lazy"
                  />
                  <div className="craft-image-caption">
                    <span>{stage.label}</span>
                    <strong>{stage.title}</strong>
                  </div>
                </div>
              </div>

              {/* Content Column */}
              <div className="craft-stage-content">
                <div className="stage-watermark-num">{stage.num}</div>

                <div className="stage-header-group">
                  <span className="stage-kicker">{stage.label}</span>
                  <h2 className="stage-title">{stage.title}</h2>
                  <h3 className="stage-subtitle">{stage.subtitle}</h3>
                </div>

                <div className="stage-paragraphs">
                  {stage.paragraphs.map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>

                <div className="stage-callout-card">
                  <div className="callout-sparkle">❖</div>
                  <blockquote className="stage-callout-text">
                    "{stage.callout}"
                  </blockquote>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. THE HANDS BEHIND THE HERITAGE                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="craft-heritage-section">
        <div className="container">
          <div className="heritage-card">
            <div className="heritage-grid">
              <div className="heritage-content">
                <span className="heritage-overline">— ARTISAN LEGACY —</span>
                <h2 className="heritage-title">THE HANDS BEHIND THE HERITAGE</h2>
                <h3 className="heritage-subtitle">
                  A tradition carried forward, one stitch at a time.
                </h3>

                <div className="heritage-text">
                  <p>
                    Behind the beauty of Lucknow's embroidery are artisans whose skill
                    is built through practice, patience, and an understanding of the craft.
                  </p>
                  <p>
                    Their work gives character to the smallest details and life to
                    patterns that would otherwise remain lines on fabric.
                  </p>
                  <p>
                    At Safed Rang, we celebrate the artistry behind each creation and the
                    heritage that continues to inspire it.
                  </p>
                  <p className="heritage-highlight">
                    Because the true value of a handcrafted piece lies not only in what
                    you see, but also in the time, technique, and human skill that bring
                    it into being.
                  </p>
                </div>

                <div className="heritage-pillars">
                  <div className="pillar-item">
                    <span className="pillar-num">01</span>
                    <strong className="pillar-label">Patience</strong>
                    <span className="pillar-desc">Unrushed needlecraft</span>
                  </div>
                  <div className="pillar-item">
                    <span className="pillar-num">02</span>
                    <strong className="pillar-label">Lineage</strong>
                    <span className="pillar-desc">Passed down hands</span>
                  </div>
                  <div className="pillar-item">
                    <span className="pillar-num">03</span>
                    <strong className="pillar-label">Fidelity</strong>
                    <span className="pillar-desc">Pure Awadhi stitches</span>
                  </div>
                </div>
              </div>

              <div className="heritage-media">
                <div className="heritage-image-frame">
                  <img
                    src="/woman_chikankari_saree.jpg"
                    alt="Safed Rang master artisan carrying the Lucknow Chikankari tradition"
                    className="heritage-img"
                    loading="lazy"
                  />
                  <div className="heritage-badge">
                    <Sparkles size={14} />
                    <span>Preserving Lucknow's Living Craft</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. CONCLUSION / INVITATION: WEAR THE STORY                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="craft-invitation-section">
        <div className="container text-center">
          <div className="invitation-ornament">
            <span>❖</span>
          </div>

          <h2 className="invitation-heading">WEAR THE STORY. CARRY THE CRAFT.</h2>
          <p className="invitation-subheading">
            Some things are made to follow a season. Others are made to hold a place
            in your wardrobe for years.
          </p>
          <p className="invitation-lead">
            Discover creations shaped by the artistry of Lucknow and the enduring
            beauty of Indian craftsmanship.
          </p>

          <div className="invitation-actions">
            <Link to="/shop" className="btn-primary invitation-btn-primary">
              EXPLORE THE COLLECTION
            </Link>
            <Link to="/one-of-one" className="btn-secondary invitation-btn-secondary">
              DISCOVER ONE-OF-ONE
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
