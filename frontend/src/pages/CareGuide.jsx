import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Droplets,
  Sun,
  Flame,
  Wind,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  ArrowRight,
  HelpCircle,
  Info,
  Clock,
  Layers,
  HeartHandshake,
} from "lucide-react";
import "./CareGuide.css";

// ── 6 FABRIC GROUPS DATA ───────────────────────────────────────────────────
const FABRIC_GROUPS = [
  {
    id: "silk-organza",
    name: "Silk & Organza Silk",
    subtitle: "Pure Silk Sarees & Translucent Organza Drapes",
    tagline: "Fine natural filaments requiring gentle tension and moisture control",
    image: "/one-of-one-banner.webp",
    badge: "Professional Dry Clean Recommended",
    appliesTo: "Pure Silk Sarees, Organza Silk Drapes, Festive Katan Silks, and Sheer Dupattas",
    cleaning:
      "Professional dry cleaning is strongly recommended to preserve the natural lustre, crisp body, and structural integrity of natural silk and organza. Home water washing can cause water spotting, loss of sheen, and irreversible limpness in organza weaves.",
    drying:
      "If the garment comes into contact with light moisture, air-dry flat in shade over a clean white towel. Never wring, spin, or tumble dry. Avoid direct sunlight which weakens silk protein fibres.",
    ironing:
      "Use low-to-medium heat on silk setting. Always place a clean, unbleached cotton press cloth between the iron and the fabric. Press from the reverse side while the fabric is completely dry. Do not use steam directly as moisture droplets can create permanent water rings.",
    storage:
      "Wrap carefully in breathable unbleached muslin (malmal) cloth. Store flat in a dry, dark wardrobe. Avoid hanging organza sarees long-term as their own weight can cause creasing or stretching along the hanger fold.",
    avoid:
      "Machine washing, harsh detergents, steam jets, spraying perfumes or deodorants directly on the fabric, and storing in plastic covers.",
  },
  {
    id: "embellished-organza",
    name: "Organza with Zardozi, Beads & Mukaish",
    subtitle: "Heavily Embellished & Bridal Occasionwear",
    tagline: "Hand-anchored metallic coils, glass crystals, and micro-sequins",
    image: "/embellishment.jpg",
    badge: "Specialist Couture Dry Clean Only",
    appliesTo: "Bridal Sarees, Zardozi Borders, Mukaish Organza Drapes, and Gala Eveningwear",
    cleaning:
      "Strictly specialist dry cleaning only. Inform the cleaner of the presence of genuine metallic wires, electroplated beads, and delicate sequins so that appropriate solvent care and protective netting are utilized. Never submerge in water.",
    drying:
      "Never hang wet or damp embellished organza; the heavy weight of beads and metallic embroidery can tear sheer filaments. Always support the garment flat on a padded surface in the shade.",
    ironing:
      "Never apply an iron directly to beads, sequins, or metallic embroidery. Place the garment face down onto a thick, plush cotton towel so the embellishments sink safely into the pile. Press gently from the reverse side on low heat with a protective cloth.",
    storage:
      "Layer acid-free butter paper or soft tissue between every fold to prevent metallic embroidery and bead claws from snagging adjacent fabric. Store flat inside a padded, breathable cotton saree box or case.",
    avoid:
      "Any water immersion or home spot-cleaning, folding directly across heavy Zardozi motifs, friction against rough jewelry, and damp humidity.",
  },
  {
    id: "muslin-chanderi",
    name: "Muslin & Mul Chanderi Chikankari",
    subtitle: "Handloom Muslin, Mul Cotton & Lightweight Chanderi",
    tagline: "Breathable gossamer weaves carrying intricate needlework stitches",
    image: "/chikankari.jpg",
    badge: "Dry Clean Recommended / Gentle Hand Wash (Check Label)",
    appliesTo: "Mul Cotton Chikankari Sarees, Muslin Kurtas, Semi-stitched Chanderi Pieces, and Handloom Dupattas",
    cleaning:
      "Professional dry cleaning is recommended for the initial cleanings to set dyes and finish. Light, unlined, and non-embellished mul-cotton pieces may be gently hand-washed in cold water using a mild, pH-neutral liquid detergent only if the garment care label explicitly permits it.",
    drying:
      "Roll gently inside a dry, clean towel to absorb excess water without wringing or twisting. Lay flat or drape evenly over a padded drying rack in complete shade. Avoid direct tropical sunlight to maintain dye vibrancy.",
    ironing:
      "Iron on medium heat while the fabric is barely damp. Always press on the reverse side over a soft padded surface so that the raised hand stitches (Murri, Bakhiya, Phanda) retain their sculptural, three-dimensional relief.",
    storage:
      "Store folded neatly in a cool, ventilated wardrobe within a pure cotton pouch. Natural neem leaves or cedar blocks wrapped in paper can be placed nearby to deter moths, but must never touch the fabric directly.",
    avoid:
      "Chlorine bleach, chemical stain removers, machine spinning, rough brush cleaning, and drying over thin wire lines.",
  },
  {
    id: "linen-cotton",
    name: "Linen-Cotton Weaves",
    subtitle: "Natural Blend Drapes & Contemporary Classics",
    tagline: "Crisp natural fibers celebrating texture and breathability",
    image: "/woman_chikankari_saree.jpg",
    badge: "Care-Label Dependent Cleaning",
    appliesTo: "Linen Sarees, Linen-Cotton Kurtas, Daywear Co-ords, and Embroidered Tunics",
    cleaning:
      "Follow the sewn-in care label strictly. Unembroidered, everyday linen-cotton garments may be gently hand-washed or laundered on a delicate cold cycle with mild detergent. For pieces with hand embroidery, zari borders, or dual dyes, dry cleaning is advised.",
    drying:
      "Gently reshape the garment while damp. Dry in the shade on a flat surface or wide padded hanger. Do not tumble dry, which weakens linen fibers and creates harsh, difficult-to-remove wrinkles.",
    ironing:
      "Iron on medium-to-high heat on the linen setting while the garment is slightly damp, or use warm steam press. For any embroidered segments, always iron from the reverse using a press cloth.",
    storage:
      "Linen benefits from breathing room. Fold loosely or hang on structured wooden hangers in a cool, well-ventilated wardrobe space.",
    avoid:
      "High-heat tumble drying, bleach, vigorous hand-wringing, and overcrowded closet storage.",
  },
  {
    id: "viscose-chikankari",
    name: "Viscose Chikankari & Kurta Sets",
    subtitle: "Viscose Georgette & Modal Kurta Ensembles",
    tagline: "Fluid, cascading drapes that require delicate handling when wet",
    image: "/viscose_category.jpg",
    badge: "Professional Dry Clean Recommended",
    appliesTo: "Viscose Georgette Sarees, Modal Chikankari Kurta Sets, and Embroidered Suits",
    cleaning:
      "Professional dry cleaning is strongly advised. Viscose and rayon fibers lose up to 50% of their tensile strength when wet and shrink or distort easily under uncontrolled water temperature and mechanical agitation.",
    drying:
      "If lightly dampened by rain or perspiration, lay flat to dry in a ventilated shaded area. Never hang a wet viscose garment by its shoulders as the weight of the damp fabric stretches the seams.",
    ironing:
      "Iron on low heat (wool/silk setting) on the reverse side with a clean press cloth. Never slide the iron with heavy downward pressure across delicate stitchwork; press down gently and lift.",
    storage:
      "Fold with acid-free tissue paper supporting the folds, sleeves, and collar. Store flat inside a breathable cotton bag. Do not hang for prolonged months to avoid hem distortion.",
    avoid:
      "Hot water, vigorous hand-twisting, high-speed spin cycles, direct contact with hot iron soles, and acidic spot cleaners.",
  },
  {
    id: "chanderi-blouses",
    name: "Chanderi Silk & Tailored Blouses",
    subtitle: "Padded, Structured & Embroidered Blouses",
    tagline: "Tailored silhouettes with internal cups, canvas fusing, and hook fastenings",
    image: "/blouse_category.jpeg",
    badge: "Professional Dry Clean Only",
    appliesTo: "Structured Blouses, Padded Chanderi Tops, Zardozi Neckline Blouses, and Corseted Silhouettes",
    cleaning:
      "Professional dry cleaning only. Tailored blouses contain internal chest padding, interfacing canvas, delicate lining seams, and fine fastenings that deform and lose shape if immersed in water.",
    drying:
      "After wearing, air the blouse for a few hours in a well-ventilated room away from direct light before returning it to the wardrobe.",
    ironing:
      "Iron on low-to-medium heat with a cotton press cloth. For contoured bust cups, use a curved tailor's ham or a rolled-up clean towel inside the cup so the sculpted shape is never flattened.",
    storage:
      "Fasten all hooks, eyes, and zippers before storing so metal edges cannot catch on embroidery. Store flat with tissue paper inside each cup to maintain curvature, or hang on custom padded blouse hangers.",
    avoid:
      "Soaking, machine washing, folding bust cups inwards, leaving hooks unfastened, and direct iron contact on canvas fusing.",
  },
];

// ── 4 CRAFTSMANSHIP DISCIPLINES DATA ─────────────────────────────────────────
const CRAFT_DISCIPLINES = [
  {
    name: "Chikankari Handwork",
    tag: "32 Heritage Stitches",
    description:
      "Preserving the delicate art of Awadh needlecraft. Whether it is the shadow work of Bakhiya, the pearl-like knots of Murri, or the airy openwork of Jaali, each stitch relies on precise thread tension.",
    careNotes: [
      "Minimize surface friction; never scrub raised hand embroidery.",
      "Iron face down onto a soft, plush towel to keep the sculptural relief of the stitches intact.",
      "Always inspect care labels—light mul cotton may permit gentle hand care, whereas silk or organza bases require dry cleaning.",
    ],
  },
  {
    name: "Zardozi Metallic Wire",
    tag: "Kalabattu & Dabka Coils",
    description:
      "Ancient Persian-origin embroidery using real and gold-plated metallic wires, Salma coils, and Sitara sequins meticulously couched onto heavy weaves.",
    careNotes: [
      "Metallic wires are sensitive to moisture, humidity, and perspiration, which cause tarnishing over time.",
      "Never apply an iron directly to metallic embroidery; always use soft padding and a press cloth.",
      "Professional dry cleaning is essential; never submerge in water.",
    ],
  },
  {
    name: "Mukaish & Mukaish Tikki",
    tag: "Badla & Fardi Work",
    description:
      "Fine electroplated metallic ribbons pierced through the fabric and crimped into sparkling micro-dots (Fardi) or shimmering motifs.",
    careNotes: [
      "Avoid rough friction and aggressive rubbing that can unhook or dislodge the flattened metallic wire ribbons.",
      "Press only on the reverse side on low heat without steam.",
      "Store with acid-free tissue between layers to prevent tikkis from catching on adjacent threads.",
    ],
  },
  {
    name: "Beads & Micro-Sequins",
    tag: "Hand-Knotted Embellishments",
    description:
      "Tiny cut-dana beads and sequins hand-sewn onto delicate sheer bases like organza and tissue silk to catch ambient evening light.",
    careNotes: [
      "Take special care when wearing pronged rings, bangles, or watches that can snag fine support threads.",
      "Dry clean in a protective netting bag to cushion individual beads from mechanical friction.",
      "If a thread loosens, never pull it; consult a master tailor or our concierge for re-anchoring.",
    ],
  },
];

// ── 6 FREQUENTLY ASKED QUESTIONS ───────────────────────────────────────────
const FAQS = [
  {
    q: "Can I wash my Chikankari saree at home?",
    a: "It depends on the base fabric, dye, and embellishment. Most luxury Chikankari sarees—particularly those on pure silk, organza, viscose georgette, or pieces featuring Zardozi, Mukaish, or internal linings—require professional dry cleaning to protect the artisanal handwork and weave structure. Only simple, unlined mul-cotton or linen-cotton garments with colorfast dyes and an explicit care-label authorization should be hand-washed in cold water using a mild, pH-neutral liquid detergent.",
  },
  {
    q: "Should I dry-clean an organza or Zardozi saree?",
    a: "Yes, absolutely. Sheer organza filaments and hand-worked metallic wires cannot tolerate home water soaking, friction, or alkaline detergents. Water causes metallic threads to oxidize and makes organza lose its signature crisp hand-feel. We strongly recommend professional dry cleaning by a heritage textile specialist for all organza and Zardozi garments.",
  },
  {
    q: "How do I iron a saree with delicate embroidery?",
    a: "Always press from the reverse side. Place a thick, clean white bath towel onto your ironing board, and place the saree face down so the embroidery sinks gently into the towel's plush pile. Then, place a clean cotton pressing cloth over the reverse side and iron on a low-to-medium setting. Never use direct high steam on metallic work or water-sensitive silks.",
  },
  {
    q: "How should I store a saree for several months?",
    a: "Store the garment clean, completely dry, and wrapped in a breathable unbleached cotton or mulmal saree bag in a cool, dark wardrobe. Never use airtight plastic bags, which trap ambient humidity and can cause metallic threads to tarnish or silk to yellow. Every 3 to 4 months, take the saree out, let it breathe in an airy indoor space for an hour, and refold along different crease lines to prevent fiber fatigue.",
  },
  {
    q: "What should I do if a stain appears on my garment?",
    a: "Act promptly, but gently. Never rub the stain aggressively or apply chemical spot-cleaners or bleach, as this will ring the fabric or permanently discolour the artisanal dye. Gently blot excess liquid using a clean, dry white cloth or tissue. Then take the garment to an experienced professional dry cleaner as soon as possible, clearly identifying the source and location of the stain.",
  },
  {
    q: "How do I know which care instructions apply to my specific purchase?",
    a: "Always inspect the sewn-in care label attached to your garment and review the product details on safedrang.com. Because Safed Rang pieces combine varied heritage fabrics, artisanal dyes, and hand embellishments, care requirements differ. When in doubt, our customer concierge team is always available to guide you.",
  },
];

export default function CareGuide() {
  const [activeFabricId, setActiveFabricId] = useState("silk-organza");
  const [openFaq, setOpenFaq] = useState(0); // first FAQ open by default

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const activeFabric =
    FABRIC_GROUPS.find((f) => f.id === activeFabricId) || FABRIC_GROUPS[0];

  const scrollToFabric = (e) => {
    e.preventDefault();
    const el = document.getElementById("fabric-care");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (idx) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="care-guide-page">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION A — EDITORIAL HERO                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="care-hero">
        <div className="container care-hero-container">
          <div className="care-hero-content">
            <span className="care-eyebrow">THE SAFED RANG CARE JOURNAL</span>
            <h1 className="care-hero-title">
              A little care. <br />
              <span className="care-hero-title-italic">A lifetime of elegance.</span>
            </h1>
            <p className="care-hero-description">
              Every Safed Rang creation carries the beauty of its fabric, the patience of its
              craftsmanship, and the artistry of the hands that made it. Thoughtful care helps
              preserve these details, so your favourite pieces can accompany you for years to come.
            </p>
            <div className="care-hero-cta">
              <a
                href="#fabric-care"
                onClick={scrollToFabric}
                className="btn-primary care-hero-btn"
              >
                Explore Care by Fabric
              </a>
              <Link to="/shop" className="btn-secondary care-hero-btn-secondary">
                View Collection
              </Link>
            </div>
          </div>

          <div className="care-hero-media">
            <div className="care-hero-image-frame">
              <img
                src="/chikankari.jpg"
                alt="Close-up of intricate Safed Rang handcrafted Chikankari embroidery"
                className="care-hero-image"
                loading="eager"
              />
              <div className="care-hero-image-badge">
                <Sparkles size={14} />
                <span>Handcrafted Luxury Care</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION B — QUICK CARE PRINCIPLES                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="care-principles-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-overline">— FOUNDATIONAL CARE —</span>
            <h2 className="section-heading">Five Essential Principles</h2>
            <p className="section-subheading">
              Universal rules of reverence for fine Indian handloom and couture craftsmanship.
            </p>
          </div>

          <div className="principles-grid">
            <div className="principle-card">
              <span className="principle-number">01</span>
              <h3 className="principle-title">Consult the Care Label</h3>
              <p className="principle-text">
                Every creation has unique fiber compositions and artisanal finishes. Always check
                the sewn-in label before cleaning.
              </p>
            </div>

            <div className="principle-card">
              <span className="principle-number">02</span>
              <h3 className="principle-title">Mindful Gentleness</h3>
              <p className="principle-text">
                Treat delicate sheer organzas, fine silks, and hand-embroidered drapes with gentle
                handling. Avoid friction and tension.
              </p>
            </div>

            <div className="principle-card">
              <span className="principle-number">03</span>
              <h3 className="principle-title">No Harsh Chemicals</h3>
              <p className="principle-text">
                Avoid chlorine bleach, harsh spot lifters, vigorous scrubbing, and prolonged soaking
                that degrade delicate threads and dyes.
              </p>
            </div>

            <div className="principle-card">
              <span className="principle-number">04</span>
              <h3 className="principle-title">Shield Hand Embroidery</h3>
              <p className="principle-text">
                Never press hot metal directly onto metallic Zardozi, Mukaish ribbons, or glass
                beads. Always cushion with soft padding.
              </p>
            </div>

            <div className="principle-card">
              <span className="principle-number">05</span>
              <h3 className="principle-title">Store Clean &amp; Dry</h3>
              <p className="principle-text">
                Store garments fully dry inside breathable cotton covers, away from humidity, heat,
                and direct sunlight. Refold periodically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION C — FIND YOUR FABRIC                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="fabric-care" className="care-fabric-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-overline">— TAILORED PRESERVATION —</span>
            <h2 className="section-heading">Find Your Fabric</h2>
            <p className="section-subheading">
              Select your garment's fabric below to discover customized washing, ironing, and
              archival storage guidelines.
            </p>
          </div>

          {/* Interactive Fabric Tabs / Selector */}
          <div className="fabric-selector-nav" role="tablist" aria-label="Fabric Care Selection">
            {FABRIC_GROUPS.map((f) => {
              const isSelected = activeFabricId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`fabric-panel-${f.id}`}
                  id={`fabric-tab-${f.id}`}
                  className={`fabric-tab-btn ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveFabricId(f.id)}
                >
                  <span className="fabric-tab-name">{f.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Fabric Display Card */}
          <div
            className="fabric-detail-card"
            role="tabpanel"
            id={`fabric-panel-${activeFabric.id}`}
            aria-labelledby={`fabric-tab-${activeFabric.id}`}
          >
            <div className="fabric-card-header">
              <div className="fabric-card-title-group">
                <span className="fabric-card-category">{activeFabric.subtitle}</span>
                <h3 className="fabric-card-title">{activeFabric.name}</h3>
                <p className="fabric-card-tagline">{activeFabric.tagline}</p>
              </div>
              <div className="fabric-card-badge-wrap">
                <span className="fabric-cleaning-badge">
                  <ShieldCheck size={15} />
                  {activeFabric.badge}
                </span>
              </div>
            </div>

            <div className="fabric-applies-row">
              <strong className="applies-label">Applicable Creations:</strong>
              <span className="applies-text">{activeFabric.appliesTo}</span>
            </div>

            <div className="fabric-specs-grid">
              {/* Cleaning */}
              <div className="spec-card">
                <div className="spec-card-head">
                  <Droplets size={18} className="spec-icon" />
                  <h4>Cleaning &amp; Washing</h4>
                </div>
                <p>{activeFabric.cleaning}</p>
              </div>

              {/* Drying */}
              <div className="spec-card">
                <div className="spec-card-head">
                  <Wind size={18} className="spec-icon" />
                  <h4>Drying Protocol</h4>
                </div>
                <p>{activeFabric.drying}</p>
              </div>

              {/* Ironing */}
              <div className="spec-card">
                <div className="spec-card-head">
                  <Flame size={18} className="spec-icon" />
                  <h4>Ironing &amp; Pressing</h4>
                </div>
                <p>{activeFabric.ironing}</p>
              </div>

              {/* Storage */}
              <div className="spec-card">
                <div className="spec-card-head">
                  <Layers size={18} className="spec-icon" />
                  <h4>Storage &amp; Folding</h4>
                </div>
                <p>{activeFabric.storage}</p>
              </div>
            </div>

            {/* Avoid Warning Bar */}
            <div className="fabric-avoid-banner">
              <div className="avoid-icon-wrap">
                <XCircle size={18} />
              </div>
              <div>
                <strong>What to Avoid:</strong> {activeFabric.avoid}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION D — CARE BY CRAFTSMANSHIP                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="care-craft-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-overline">— ARTISANAL PRESERVATION —</span>
            <h2 className="section-heading">Care by Craftsmanship</h2>
            <p className="section-subheading">
              Fine Indian needlecraft requires specialized handling. Protect the patient artistry
              of our master craftspeople.
            </p>
          </div>

          <div className="craft-grid">
            {CRAFT_DISCIPLINES.map((item, idx) => (
              <div key={idx} className="craft-card">
                <div className="craft-card-top">
                  <span className="craft-card-tag">{item.tag}</span>
                  <h3 className="craft-card-title">{item.name}</h3>
                  <p className="craft-card-desc">{item.description}</p>
                </div>
                <ul className="craft-notes-list">
                  {item.careNotes.map((note, nIdx) => (
                    <li key={nIdx}>
                      <CheckCircle2 size={15} className="craft-check-icon" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="craft-disclaimer-box">
            <Info size={18} className="disclaimer-icon" />
            <p>
              <strong>Important Note:</strong> Craft technique alone does not determine the correct
              cleaning method. Always evaluate the base fabric, dye, lining, garment construction,
              and the product's sewn-in care label.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION E — THE FOUR STEPS OF GARMENT CARE                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="care-steps-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-overline">— THE LIFETIME RITUAL —</span>
            <h2 className="section-heading">The Four Steps of Garment Care</h2>
            <p className="section-subheading">
              A gentle ritual to accompany your Safed Rang heirlooms throughout the seasons.
            </p>
          </div>

          <div className="steps-sequence">
            <div className="step-card">
              <div className="step-pill">01</div>
              <h3 className="step-title">Cleaning</h3>
              <p className="step-desc">
                Always inspect the garment's sewn-in care label. Separate colours, protect delicate
                embroidery, and prioritize professional dry cleaning for silks, organzas, and
                embroidered couture.
              </p>
            </div>

            <div className="step-card">
              <div className="step-pill">02</div>
              <h3 className="step-title">Drying</h3>
              <p className="step-desc">
                Avoid direct sunlight and tumble dryers. Never twist or wring delicate weaves.
                Absorb moisture gently in a clean white towel and air-dry flat in a shaded,
                ventilated room.
              </p>
            </div>

            <div className="step-card">
              <div className="step-pill">03</div>
              <h3 className="step-title">Ironing &amp; Pressing</h3>
              <p className="step-desc">
                Never iron directly over beads, sequins, or metallic work. Place the garment face
                down over a soft padded towel and press lightly from the reverse with a protective
                cotton press cloth.
              </p>
            </div>

            <div className="step-card">
              <div className="step-pill">04</div>
              <h3 className="step-title">Storing</h3>
              <p className="step-desc">
                Store fully clean and dry in breathable unbleached muslin/cotton saree bags. Refold
                drapes along different crease lines every 3 to 4 months to relieve fiber stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION F — COMMON CARE MISTAKES                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="care-dos-donts-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-overline">— BEST PRACTICES &amp; CAUTIONS —</span>
            <h2 className="section-heading">Mindful Care &amp; Common Mistakes</h2>
            <p className="section-subheading">
              Simple everyday habits that make all the difference in preserving your handcrafted
              investments.
            </p>
          </div>

          <div className="dos-donts-grid">
            {/* DOs */}
            <div className="dos-card">
              <div className="dos-header">
                <CheckCircle2 size={22} className="dos-icon" />
                <h3>Do These Things</h3>
              </div>
              <ul className="dos-list">
                <li>
                  <span className="bullet-point">✓</span>
                  <div>
                    <strong>Check the care label first:</strong> Always prioritize the instructions
                    tailored to your specific garment's fibers and construction.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✓</span>
                  <div>
                    <strong>Use breathable cotton covers:</strong> Allow natural silk and cotton
                    fibers to breathe inside unbleached muslin or malmal covers.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✓</span>
                  <div>
                    <strong>Air out after wearing:</strong> Allow your drape to breathe in a shaded,
                    ventilated room for a few hours before returning it to the wardrobe.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✓</span>
                  <div>
                    <strong>Cushion heavy Zardozi:</strong> Place acid-free butter paper between
                    folds to prevent metallic coils from catching on sheer fabrics.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✓</span>
                  <div>
                    <strong>Refold periodically:</strong> Unfold and refold long-stored sarees every
                    few months to prevent permanent creasing along the same fold lines.
                  </div>
                </li>
              </ul>
            </div>

            {/* AVOIDs */}
            <div className="donts-card">
              <div className="donts-header">
                <XCircle size={22} className="donts-icon" />
                <h3>Avoid These Things</h3>
              </div>
              <ul className="donts-list">
                <li>
                  <span className="bullet-point">✕</span>
                  <div>
                    <strong>Do NOT apply bleach:</strong> Never use chlorine bleach or harsh
                    chemical spot removers on delicate hand-dyed weaves.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✕</span>
                  <div>
                    <strong>Do NOT wring or scrub:</strong> Aggressive scrubbing damages raised
                    needlework, and twisting permanently distorts fine silk filaments.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✕</span>
                  <div>
                    <strong>Do NOT iron directly over embellishments:</strong> Direct heat melts
                    bead thread, crushes needlework, and tarnishes metallic wires.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✕</span>
                  <div>
                    <strong>Do NOT spray perfume on fabric:</strong> Alcohol and fragrance oils
                    create irreversible stains and oxidize genuine zari.
                  </div>
                </li>
                <li>
                  <span className="bullet-point">✕</span>
                  <div>
                    <strong>Do NOT store in plastic bags:</strong> Plastic traps moisture, creates
                    humidity, and leads to fabric yellowing and metallic oxidation.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION G — FREQUENTLY ASKED QUESTIONS                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="care-faq-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-overline">— EXPERT ANSWERS —</span>
            <h2 className="section-heading">Frequently Asked Questions</h2>
            <p className="section-subheading">
              Answers to our patrons' most frequent questions regarding washing, ironing, and
              long-term preservation.
            </p>
          </div>

          <div className="faq-accordion" role="region" aria-label="Care Guide FAQ">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    id={`faq-btn-${idx}`}
                  >
                    <span className="faq-question-text">{faq.q}</span>
                    <span className="faq-toggle-icon">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="faq-answer-pane"
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-btn-${idx}`}
                    >
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION H — NEED HELP WITH YOUR PIECE?                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="care-contact-section">
        <div className="container">
          <div className="care-contact-card">
            <div className="contact-decor-icon">
              <HeartHandshake size={32} />
            </div>
            <h2 className="care-contact-title">Not sure how to care for your Safed Rang piece?</h2>
            <p className="care-contact-description">
              Every fabric and every detail is different. If you are unsure how to care for your
              garment, our team can help you understand the appropriate care instructions for your
              particular piece.
            </p>

            <div className="care-contact-actions">
              <a
                href="https://api.whatsapp.com/send?phone=919151566602&text=Hello%20Safed%20Rang%20Concierge,%20I%20have%20a%20question%20regarding%20caring%20for%20my%20garment."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary care-whatsapp-btn"
              >
                <MessageCircle size={16} />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href="mailto:houseofsushmaa@gmail.com?subject=Safed%20Rang%20Garment%20Care%20Assistance"
                className="btn-secondary care-email-btn"
              >
                <Mail size={16} />
                <span>Email Concierge</span>
              </a>

              <Link to="/shop" className="care-shop-link">
                <span>Explore the Collection</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
