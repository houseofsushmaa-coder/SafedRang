import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, ArrowDown } from "lucide-react";
import "./Journey.css";

const CHAPTERS = [
  {
    id: "chapter-01",
    num: "01",
    chapterLabel: "01 — THE BEGINNING",
    headline: "A dream rooted in Lucknow.",
    body: [
      "There is a particular beauty to Lucknow.",
      "It lives in its old streets, its artistic traditions, its unhurried sense of elegance, and the delicate embroidery that has become part of the city's cultural identity.",
      "At the heart of this story is Sushma Singh, whose vision for Safed Rang begins with an appreciation for that world of craftsmanship.",
      "She sees beauty in the details that can easily go unnoticed: the movement of a thread, the balance of a motif, the patience behind a fine stitch, and the way an artisan transforms an ordinary piece of fabric into something deeply considered.",
      "The idea is simple, but meaningful.",
      "To create a brand where the elegance of traditional Indian craftsmanship meets the sensibility of contemporary luxury.",
      "Not just clothing for an occasion, but pieces to be chosen with care, worn with pride, and treasured for their character.",
    ],
    closingLine: "A vision shaped by heritage. An identity of its own.",
    image: "/pdp-2.jpg",
    imageAlt: "A vision rooted in Lucknow - Handcrafted Indian drape",
    reverse: false,
    theme: "light",
  },
  {
    id: "chapter-02",
    num: "02",
    chapterLabel: "02 — THE CRAFT",
    headline: "The beauty was always in the details.",
    body: [
      "The more closely you look at Chikankari, the more you begin to appreciate what makes it remarkable.",
      "A pattern is not simply placed on fabric. It is brought to life through the rhythm of the needle, the movement of thread, and the experience of hands that understand the craft.",
      "The heritage of Lucknow offers a rich visual language: delicate floral patterns, fine textures, intricate stitches, and the quiet elegance of hand embroidery.",
      "For Safed Rang, these details are more than decorative elements. They are an important part of what gives a creation its personality.",
      "The brand's story embraces the artistry of Chikankari alongside other traditional techniques, including Zardozi and Mukaish work, where selected designs call for greater texture, embellishment, and richness.",
      "Different creations follow different journeys. What connects them is an appreciation for thoughtful design and the skills required to bring it to life.",
    ],
    closingLine: "Not just seen at a glance. Appreciated up close.",
    image: "/chikankari.jpg",
    imageAlt: "The Craft - The rhythm of the needle and movement of thread",
    reverse: true,
    theme: "ivory",
  },
  {
    id: "chapter-03",
    num: "03",
    chapterLabel: "03 — THE MAKING",
    headline: "From an idea to something you can hold.",
    body: [
      "A beautiful creation is the result of many considered decisions.",
      "The fabric must complement the design. The embroidery must follow the pattern. The details must work in harmony with the drape of the garment.",
      "In traditional Chikankari, the journey can involve the transfer of a pattern, hours of careful hand embroidery, and appropriate washing and finishing.",
      "Selected creations may also incorporate Zardozi, Mukaish, beads, pearls, or other embellishments that give the finished piece a distinctive character.",
      "This is where a design becomes more than an idea.",
      "Through attention, skill, and a respect for the material, the separate details begin to form a complete creation.",
      "Some pieces are quiet in their beauty. Others carry a more elaborate presence. Each deserves to be appreciated for what it is.",
    ],
    closingLine: "Thoughtful in design. Considered in every detail.",
    image: "/embellishment.jpg",
    imageAlt: "The Making - Zardozi, beads, and pearls worked into fabric on the adda frame",
    reverse: false,
    theme: "light",
  },
  {
    id: "chapter-04",
    num: "04",
    chapterLabel: "04 — THE CREATIONS",
    headline: "Tradition, expressed in many ways.",
    body: [
      "A single craft can inspire many different expressions.",
      "At Safed Rang, sarees hold a special place in the story, from delicate embroidered designs to elaborate creations with intricate embellishment.",
      "The collection also extends to Kurta Sets, dupattas, blouses, and other pieces that bring traditional craftsmanship into different moments of everyday life and celebration.",
      "Different fabrics have different personalities. Chikankari can appear delicate and understated, while Zardozi and Mukaish may bring a richer dimension to selected designs.",
      "The intention is not to make every creation look the same.",
      "It is to explore the many ways that Indian craftsmanship, thoughtful design, and considered styling can come together.",
    ],
    closingLine: "One heritage. Many expressions of elegance.",
    image: "/pdp-1.jpg",
    imageAlt: "The Creations - Safed Rang handcrafted sarees and occasionwear",
    reverse: true,
    theme: "ivory",
    cta: {
      text: "EXPLORE THE COLLECTION",
      link: "/shop",
    },
  },
  {
    id: "chapter-05",
    num: "05",
    chapterLabel: "05 — THE ONE-OF-ONE EDIT",
    headline: "Some creations are meant to exist only once.",
    body: [
      "Among the many expressions of craftsmanship is a particular appreciation for individuality.",
      "The One-of-One edit celebrates selected creations whose combination of design, fabric, embroidery, and embellishment gives each piece its own identity.",
      "These are not simply products presented as a collection. They are individual creations to be discovered and appreciated on their own terms.",
      "Once a genuine One-of-One creation is sold, its design is retired rather than presented as an endlessly repeatable piece.",
      "That principle gives the collection a sense of individuality and makes each creation's story especially personal.",
      "It is a reminder that beauty need not be repeated to be remembered.",
    ],
    closingLine: "One creation. Its own character. A story that continues with you.",
    image: "/one-of-one-banner.webp",
    imageAlt: "The One-of-One Edit - Rare, non-repeatable heirloom couture drapes",
    reverse: false,
    theme: "wine", // distinct royal-wine chapter
    cta: {
      text: "DISCOVER ONE-OF-ONE",
      link: "/one-of-one",
    },
  },
  {
    id: "chapter-06",
    num: "06",
    chapterLabel: "06 — THE VISION",
    headline: "A name that honours the craft.",
    body: [
      "For Sushma Singh, the journey of Safed Rang is about more than building a collection of beautiful garments.",
      "It is about shaping a brand identity around the qualities that make Indian craftsmanship worth appreciating: skill, patience, individuality, and attention to detail.",
      "The ambition is to create pieces that stand confidently in the world of contemporary luxury while remaining connected to the traditions that inspire them.",
      "For customers, that means discovering garments chosen for their character, their craftsmanship, and the way they make an occasion feel personal.",
      "For the brand, it means continuing to refine the collection, celebrate the work behind the fabric, and build a name that people associate with considered elegance and Lucknow's rich embroidery heritage.",
      "There is no single moment when such a journey is complete.",
      "It is built through each new creation, each detail thoughtfully considered, and every opportunity to bring the craft to a wider audience.",
    ],
    closingLine: "Not simply a brand to wear. A craft to carry forward.",
    image: "/woman_chikankari_saree.jpg",
    imageAlt: "The Vision - Honouring Lucknow's craft and carrying heritage forward",
    reverse: true,
    theme: "light",
  },
];

export default function Journey() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const containerRef = useRef(null);
  const threadPathRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.title = "Our Journey | Safed Rang — House of Sushma";
  }, []);

  // Track scroll progress to draw the thread
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const container = containerRef.current;
          const rect = container.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Compute how far we have scrolled through the chapter journey
          const totalHeight = rect.height - windowHeight;
          const currentProgress = Math.max(
            0,
            Math.min(1, -rect.top / (totalHeight > 0 ? totalHeight : 1))
          );
          setScrollProgress(currentProgress);

          // Update active chapter based on viewport position
          const chapterElements = container.querySelectorAll(".journey-chapter-section");
          chapterElements.forEach((el, idx) => {
            const elRect = el.getBoundingClientRect();
            if (elRect.top <= windowHeight * 0.55 && elRect.bottom >= windowHeight * 0.2) {
              setActiveChapterIndex(idx);
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToFirstChapter = (e) => {
    e.preventDefault();
    const el = document.getElementById("chapter-01");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="journey-page">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 01 — THE OPENING                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="journey-hero">
        <div className="journey-hero-bg">
          <img
            src="/one-of-one-banner-4k.webp"
            alt="Safed Rang Couture Drape"
            className="hero-backdrop-img"
          />
          <div className="hero-overlay"></div>
        </div>

        <div className="container journey-hero-container">
          <div className="journey-hero-content">
            <span className="journey-eyebrow">THE STORY OF SAFED RANG</span>
            <h1 className="journey-hero-title">
              Every beautiful thing <br />
              <span className="journey-hero-title-italic">begins with a feeling.</span>
            </h1>

            <div className="journey-hero-narrative">
              <p>
                Some stories begin with a business idea. Others begin with a quiet
                appreciation for something beautiful.
              </p>
              <p>
                For Sushma Singh, the vision behind Safed Rang is rooted in the enduring
                artistry of Indian textiles, the delicate beauty of Lucknow's Chikankari,
                and the belief that what we wear can carry a story far beyond the fabric
                itself.
              </p>
              <p className="journey-hero-lead">
                From the first thought to the finished creation, Safed Rang celebrates
                a journey shaped by design, craftsmanship, and a deep appreciation for the
                details that make a piece special.
              </p>
            </div>

            <div className="journey-hero-action">
              <a
                href="#chapter-01"
                onClick={scrollToFirstChapter}
                className="journey-thread-prompt"
                aria-label="Follow the thread into our story"
              >
                <span className="thread-needle-icon">🪡</span>
                <span className="prompt-text">FOLLOW THE THREAD</span>
                <ArrowDown size={14} className="prompt-arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* THE EMBROIDERY THREAD JOURNEY CONTAINER                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="journey-timeline-wrapper" ref={containerRef}>
        {/* Continuous Animated SVG Thread Column */}
        <div className="journey-thread-column" aria-hidden="true">
          <div className="thread-track">
            {/* Guide line */}
            <div className="thread-guide-line"></div>
            {/* Drawn thread line */}
            <div
              className="thread-drawn-line"
              style={{ height: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
            >
              {/* Glowing embroidery needle tip */}
              <div className="thread-needle-tip">
                <span className="needle-dot"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters 01 to 06 */}
        <div className="journey-chapters-stream">
          {CHAPTERS.map((ch, idx) => {
            const isActive = activeChapterIndex >= idx;
            return (
              <section
                key={ch.id}
                id={ch.id}
                className={`journey-chapter-section theme-${ch.theme} ${
                  ch.reverse ? "layout-reverse" : "layout-normal"
                } ${isActive ? "revealed" : ""}`}
              >
                <div className="container journey-chapter-container">
                  {/* Timeline Chapter Anchor Marker */}
                  <div className="chapter-timeline-marker">
                    <span className={`marker-node ${isActive ? "active" : ""}`}>
                      <span className="marker-inner">{ch.num}</span>
                    </span>
                  </div>

                  <div className="chapter-grid">
                    {/* Media Column */}
                    <div className="chapter-media-col">
                      <div className="chapter-image-frame">
                        <img
                          src={ch.image}
                          alt={ch.imageAlt}
                          className="chapter-photo"
                          loading="lazy"
                        />
                        <div className="chapter-image-caption">
                          <span className="caption-tag">SAFED RANG ARCHIVE</span>
                          <span className="caption-num">CHAPTER {ch.num}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="chapter-content-col">
                      <div className="chapter-watermark">{ch.num}</div>

                      <div className="chapter-header">
                        <span className="chapter-kicker">{ch.chapterLabel}</span>
                        <h2 className="chapter-headline">{ch.headline}</h2>
                      </div>

                      <div className="chapter-body">
                        {ch.body.map((para, pIdx) => (
                          <p key={pIdx}>{para}</p>
                        ))}
                      </div>

                      <div className="chapter-closing-box">
                        <span className="closing-gem">❖</span>
                        <blockquote className="chapter-closing-quote">
                          "{ch.closingLine}"
                        </blockquote>
                      </div>

                      {ch.cta && (
                        <div className="chapter-cta-wrap">
                          <Link
                            to={ch.cta.link}
                            className={
                              ch.theme === "wine"
                                ? "btn-secondary chapter-wine-cta"
                                : "btn-secondary chapter-light-cta"
                            }
                          >
                            <span>{ch.cta.text}</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 08 — THE STORY CONTINUES (FINALE)                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="journey-finale-section">
        <div className="container text-center">
          <div className="finale-ornament">
            <span className="ornament-stitch"></span>
            <span className="ornament-diamond">❖</span>
            <span className="ornament-stitch"></span>
          </div>

          <span className="finale-eyebrow">THE JOURNEY CONTINUES</span>
          <h2 className="finale-title">Every thread leads somewhere.</h2>

          <div className="finale-narrative">
            <p>
              The story of Safed Rang is still unfolding.
            </p>
            <p>
              With every new design and every creation that finds its place in
              someone's wardrobe, the journey takes another step forward.
            </p>
            <p className="finale-emphasis">
              Rooted in Lucknow. Inspired by its craft. Shaped by a continuing
              appreciation for the beauty of Indian textiles.
            </p>
            <p>
              For Sushma Singh and Safed Rang, the most meaningful part of the journey
              is not simply what has been created, but what can still be imagined.
            </p>
            <p className="finale-waiting">The next story is always waiting to be woven.</p>
          </div>

          <div className="finale-signature-wrap">
            <h3 className="finale-invitation">Wear the story. Be part of the journey.</h3>

            <div className="finale-actions">
              <Link to="/shop" className="btn-primary finale-btn-primary">
                EXPLORE THE COLLECTION
              </Link>
              <Link to="/one-of-one" className="btn-secondary finale-btn-secondary">
                DISCOVER ONE-OF-ONE
              </Link>
            </div>

            <div className="finale-brandmark">
              <span className="brand-house">HOUSE OF SUSHMA</span>
              <span className="brand-name">SAFED RANG</span>
              <span className="brand-city">LUCKNOW</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
