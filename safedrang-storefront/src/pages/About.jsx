import { Link } from 'react-router-dom';
import './About.css';

const pillars = [
  {
    number: '01',
    tag: 'ORIGIN',
    heading: 'Chikankari: Directly From Lucknow',
    subheading: 'Born in Lucknow. Crafted in Lucknow.',
    body: [
      'Chikankari is more than embroidery for us. It is a part of the cultural identity of Lucknow — a craft passed down through generations, from skilled hands to the next.',
      'Safedrang brings you authentic Lucknow Chikankari, created close to its roots and inspired by the heritage of the city where this beautiful art has flourished.',
      'Every motif, every stitch and every delicate detail reflects the patience and artistry of the karigar behind it.',
    ],
    quote: 'We carry a piece of Lucknow with us.',
    accent: false,
  },
  {
    number: '02',
    tag: 'CRAFT',
    heading: 'Handcrafted — Never Machine Made',
    subheading: 'No machines. No shortcuts. Just skilled hands.',
    body: [
      'At Safedrang, our Chikankari is handcrafted by artisans. There is no machine embroidery replacing the human hand behind our work. Each stitch is patiently created by skilled karigars, making every piece beautifully individual.',
      'You may find tiny variations in stitches, motifs or detailing — and that is precisely what makes handmade art special.',
    ],
    quote: 'Because when a human hand creates it, no two pieces can ever be exactly the same.',
    accent: true,
  },
  {
    number: '03',
    tag: 'PROCESS',
    heading: 'Slow Production',
    subheading: 'Made slowly. Made thoughtfully. Made to last.',
    body: [
      'We don\'t believe in making hundreds of identical pieces. Safedrang follows a slow-production philosophy, allowing artisans the time and freedom required to create each piece with care.',
      'Our collections are produced in limited quantities rather than mass-produced in bulk. Some designs may exist as just one piece. And once it is gone, it may never return in exactly the same form.',
    ],
    quote: '"How beautifully can we make one?"',
    accent: false,
  },
  {
    number: '04',
    tag: 'HERITAGE',
    heading: 'Supporting Heritage & Artisans',
    subheading: 'When you choose handmade, you support a living tradition.',
    body: [
      'Behind every Safedrang saree is a skilled artisan whose hands hold years of knowledge, practice and tradition.',
      'By choosing handcrafted Chikankari, you are not only choosing a garment. You are supporting traditional craftsmanship, artisan livelihoods and a heritage that deserves to continue into the future.',
      'Safedrang is committed to creating a space where traditional Indian craftsmanship can meet contemporary fashion — without losing the soul of the craft along the way.',
    ],
    quote: 'Heritage should not live only in museums. It should be worn. Celebrated. Passed on. And kept alive.',
    accent: true,
  },
];

export default function About() {
  return (
    <div className="about-page">

      {/* ── 1. Hero ── */}
      <section className="about-hero">
        <div className="container">
          <span className="about-hero-overline">ABOUT US</span>
          <h1 className="about-hero-title">ABOUT US</h1>
          <p className="about-hero-tagline"><em>Where every thread carries a story.</em></p>
        </div>
      </section>

      {/* ── 2. Brand Story ── */}
      <section className="brand-story container">
        <div className="story-grid">
          <div className="story-image">
            <img src="/pdp-2.jpg" alt="Safedrang Story" />
          </div>
          <div className="story-content">
            <span className="overline">— THE BEGINNING —</span>
            <h2>A LOVE FOR SAREES.<br />A DREAM CALLED SAFEDRANG.</h2>
            <p>
              Safedrang was born from a love for sarees, craftsmanship, and the timeless beauty of Lucknow.
            </p>
            <p>
              We believe that true luxury is not about how quickly something is made, but about <em>how beautifully it is made, who made it, and the story it carries.</em>
            </p>
            <p>
              At Safedrang, every saree is created with patience, by skilled artisans, keeping the soul of traditional craftsmanship alive. We celebrate the beauty of imperfections, the individuality of handmade work, and the quiet luxury of owning something that cannot simply be replicated.
            </p>
            <p className="story-quote-inline"><em>One saree. One story. One woman.</em></p>
          </div>
        </div>
      </section>

      {/* ── 3. Four Pillars ── */}
      <section className="pillars-section">
        {pillars.map((pillar, idx) => (
          <div key={idx} className={`pillar-block ${pillar.accent ? 'pillar-block--accent' : ''}`}>
            <div className="container pillar-inner">
              <div className="pillar-label-col">
                <span className="pillar-number">{pillar.number}</span>
                <span className="pillar-tag">{pillar.tag}</span>
              </div>
              <div className="pillar-content">
                <h2 className="pillar-heading">{pillar.heading}</h2>
                <p className="pillar-subheading"><em>{pillar.subheading}</em></p>
                {pillar.body.map((para, i) => (
                  <p key={i} className="pillar-para">{para}</p>
                ))}
                <blockquote className="pillar-quote">
                  <em>{pillar.quote}</em>
                </blockquote>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── 4. Philosophy ── */}
      <section className="philosophy-section">
        <div className="container philosophy-inner">
          <span className="overline">— OUR PHILOSOPHY —</span>
          <h2 className="philosophy-title">SLOW FASHION.<br />HANDCRAFTED STORIES.<br />TIMELESS BEAUTY.</h2>

          <div className="philosophy-values">
            <div className="philo-value">
              <span className="philo-dot" />
              <p>We choose <strong>craftsmanship</strong> over mass production.</p>
            </div>
            <div className="philo-value">
              <span className="philo-dot" />
              <p>We choose <strong>artisans</strong> over machines.</p>
            </div>
            <div className="philo-value">
              <span className="philo-dot" />
              <p>We choose <strong>individuality</strong> over repetition.</p>
            </div>
            <div className="philo-value">
              <span className="philo-dot" />
              <p>We choose <strong>patience</strong> over speed.</p>
            </div>
          </div>

          <p className="philosophy-closing">
            Every Safedrang piece is a celebration of the hands that created it and the woman who will eventually wear it.
          </p>
          <p className="philosophy-bold">
            <strong>Because a saree is not just something you wear.<br />It becomes a part of your story.</strong>
          </p>

          <div className="philosophy-sign">
            <p className="sign-brand">Safedrang</p>
            <p className="sign-words">
              One saree at a time.<br />
              One piece for one woman.<br />
              One story at a time.
            </p>
          </div>

          <Link to="/shop" className="btn-primary philosophy-cta">EXPLORE THE COLLECTION</Link>
        </div>
      </section>

    </div>
  );
}
