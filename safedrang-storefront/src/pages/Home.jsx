import { Link } from "react-router-dom";
import {
  ArrowRight,
  Star,
  ChevronRight,
  Play,
  ShieldCheck,
  Sparkles,
  Gem,
} from "lucide-react";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero">
        <div className="hero-video-bg">
          {/* We use one stunning video or a seamless grid. Let's use a very clean grid with overlay. */}
          <video
            autoPlay
            loop
            muted
            playsInline
            src="https://cdn.shopify.com/videos/c/o/v/da413e8c8a9c4a5b9fd67e236a7f6ecf.mp4"
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            src="https://cdn.shopify.com/videos/c/o/v/4f149286e67049d9bd51799094a7ecbb.mp4"
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            src="https://cdn.shopify.com/videos/c/o/v/066a03c998634cf393d5671dfefdf5d0.mp4"
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            src="https://scontent.cdninstagram.com/o1/v/t16/f2/m84/AQOxaP2LIdj8hNsSpe-t5En3CMk-DQEHmM9Qg6jQA8xMGqKTiglUevLxPY23_8od7RT0PHUb3MBb6_VvTwq3e0rCTVEWJ1x92N3hF2U.mp4?_nc_cat=107&_nc_sid=5e9851&_nc_ht=scontent.cdninstagram.com&_nc_ohc=a-57wzPgl8MQ7kNvwEOHntH&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5JTlNUQUdSQU0uQ0xJUFMuQzMuNzIwLmRhc2hfYmFzZWxpbmVfMV92MSIsInhwdl9hc3NldF9pZCI6MTQ2MTc4NjYzNTc3ODcxOCwiYXNzZXRfYWdlX2RheXMiOjAsInZpX3VzZWNhc2VfaWQiOjEwODI3LCJkdXJhdGlvbl9zIjozOSwidXJsZ2VuX3NvdXJjZSI6Ind3dyJ9&ccb=17-1&vs=b46c38a1ad29a6dc&_nc_vs=HBksFQIYTGlnX2JhY2tmaWxsX3RpbWVsaW5lX3ZvZC83MTQ1OEU0QTEyQjE3MzkzNDFGOTNCNjI5RjA1M0RCOV92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYUWlnX3hwdl9wbGFjZW1lbnRfcGVybWFuZW50X3YyLzJFNDU2ODY5NUE5NEQyMjdDMEJGQkFFRTc1NjIzOTlDX2F1ZGlvX2Rhc2hpbml0Lm1wNBUCAsgBEgAoABgAGwKIB3VzZV9vaWwBMRJwcm9ncmVzc2l2ZV9yZWNpcGUBMRUAACa86s2Sl9-YBRUCKAJDMywXQEOEOVgQYk4YEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HZZapAQA&_nc_gid=RRqtJKV2fjmJ_tk1Y9RKNw&edm=ANo9K5cEAAAA&_nc_zt=28&_nc_tpa=Q5bMBQJ7T8e93ErXvtUhNFwLqn42JP3opIGSsO6UerJ63O37HtFHJGMlT9Yzp4WTfILb22bKE4WuGelo&oh=00_AQInal4OqsL6GgztqOribAm8WqfoFXt46chCxPhqhXldbA&oe=6AB1C39D"
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <span className="hero-subtitle fade-up-1">
            LUCKNOW'S FINEST CRAFTSMANSHIP
          </span>
          <h1 className="hero-title fade-up-2">
            THE ART OF
            <br />
            ELEGANCE
          </h1>
          <p className="hero-desc fade-up-3">
            Handcrafted Chikankari, Zardozi, and Kamdani. Designed for the
            modern woman, preserving the heritage of generations.
          </p>
          <div className="hero-ctas fade-up-4">
            <Link to="/shop" className="btn-hero-primary">
              SHOP COLLECTION
            </Link>
            <Link to="/craft" className="btn-hero-secondary">
              <Play size={16} /> EXPLORE CRAFT
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Luxury Promise (Redesigned) */}
      <section className="luxury-promise-v2">
        <div className="container">
          <div className="promise-header text-center">
            <h2 className="section-title">LUXURY, WITHOUT REPETITION</h2>
            <p className="section-subtitle">
              True luxury is not about having more. It is about having something
              that feels uniquely yours.
            </p>
          </div>

          <div className="promise-cards">
            <div className="promise-card">
              <div className="icon-wrapper">
                <ShieldCheck size={32} />
              </div>
              <h4>HANDCRAFTED</h4>
              <p>
                Created by skilled artisans in Lucknow, dedicating hundreds of
                hours to a single piece.
              </p>
            </div>
            <div className="promise-card highlight">
              <div className="icon-wrapper">
                <Gem size={32} />
              </div>
              <h4>ONE-OF-ONE</h4>
              <p>
                Distinctive designs, never repeated. Every piece exists as a
                singular creation in the world.
              </p>
            </div>
            <div className="promise-card">
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

      {/* 3. Featured Categories (Editorial Style) */}
      <section className="editorial-categories container">
        <h2 className="section-title text-center">CURATED COLLECTIONS</h2>
        <div className="category-grid">
          <Link to="/shop?category=sarees" className="category-card large">
            <img src="/woman_chikankari_saree.jpg" alt="Chikankari Sarees" />
            <div className="category-overlay">
              <div className="category-text">
                <h3>CHIKANKARI SAREES</h3>
                <span className="explore-link">
                  Explore <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>

          <div className="category-column">
            <Link to="/shop?craft=zardozi" className="category-card">
              <img src="/pdp-4.jpg" alt="Zardozi" />
              <div className="category-overlay">
                <div className="category-text">
                  <h3>ZARDOZI CRAFT</h3>
                  <span className="explore-link">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>

            <Link to="/shop?category=kurta-sets" className="category-card">
              <img src="/pdp-3.jpg" alt="Kurta Sets" />
              <div className="category-overlay">
                <div className="category-text">
                  <h3>KURTA SETS</h3>
                  <span className="explore-link">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. One-of-One Immersive Banner */}
      <section className="ooo-immersive">
        <div className="ooo-bg-image">
          <img src="/pdp-1.jpg" alt="One of One Edit" />
        </div>
        <div className="ooo-content-wrapper">
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
            <Link to="/one-of-one" className="btn-primary">
              EXPLORE THE EDIT <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. The Journey (Vertical Staggered) */}
      <section className="journey-section container">
        <div className="journey-header">
          <h2 className="section-title">FROM CHHAPAI TO CREATION</h2>
          <p>A journey of skill, patience, and unwavering artistry.</p>
        </div>

        <div className="journey-steps">
          <div className="j-step left">
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

          <div className="j-step right">
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

          <div className="j-step left">
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

      {/* 6. Testimonials Slider-like styling */}
      <section className="testimonials-v2">
        <div className="container">
          <h2 className="section-title text-center">WORN & LOVED</h2>
          <div className="testimonials-grid">
            <div className="t-card">
              <div className="t-quote">
                "The detailing was even more beautiful in person. A piece I will
                treasure always."
              </div>
              <div className="t-author">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="var(--color-antique-gold)"
                      color="var(--color-antique-gold)"
                    />
                  ))}
                </div>
                <span className="name">— Radhika S.</span>
              </div>
            </div>
            <div className="t-card">
              <div className="t-quote">
                "I have never worn something that felt so unique and
                thoughtfully crafted."
              </div>
              <div className="t-author">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="var(--color-antique-gold)"
                      color="var(--color-antique-gold)"
                    />
                  ))}
                </div>
                <span className="name">— Ananya M.</span>
              </div>
            </div>
            <div className="t-card">
              <div className="t-quote">
                "Safedrang is preserving a dying art while making it incredibly
                relevant for today."
              </div>
              <div className="t-author">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="var(--color-antique-gold)"
                      color="var(--color-antique-gold)"
                    />
                  ))}
                </div>
                <span className="name">— Priya K.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Journal */}
      <section className="journal-section container">
        <div className="journal-header flex-between">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            THE JOURNAL
          </h2>
          <Link to="/journal" className="link-explore">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="journal-cards">
          <Link to="/journal/1" className="j-card">
            <div className="j-img-wrapper">
              <img src="/pdp-4.jpg" alt="Journal 1" />
            </div>
            <div className="j-info">
              <span className="j-date">SEP 12, 2026</span>
              <h4>The Story of Lucknow Chikankari</h4>
            </div>
          </Link>
          <Link to="/journal/2" className="j-card">
            <div className="j-img-wrapper">
              <img src="/woman_chikankari_saree.jpg" alt="Journal 2" />
            </div>
            <div className="j-info">
              <span className="j-date">AUG 28, 2026</span>
              <h4>32 Chikankari Stitches You Should Know</h4>
            </div>
          </Link>
          <Link to="/journal/3" className="j-card">
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
