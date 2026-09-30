import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      {/* 1. About Hero Section */}
      <section className="about-hero">
        <div className="container">
          <h1 className="section-title">OUR STORY</h1>
          <p className="hero-subtitle">Preserving the soul of Lucknow, one stitch at a time.</p>
        </div>
      </section>

      {/* 2. The Brand Story */}
      <section className="brand-story container">
        <div className="story-grid">
          <div className="story-image">
            <img src="/pdp-2.jpg" alt="Safedrang Story" />
          </div>
          <div className="story-content">
            <span className="overline">— THE BEGINNING —</span>
            <h2>A LOVE FOR SAREES.<br/>A DREAM CALLED SAFEDRANG.</h2>
            <p>Safed Rang is more than just a saree brand — it's a tribute to the strength, grace, and individuality of every woman. Rooted in tradition yet tailored for today, Safed Rang brings together the delicate artistry of Chikankari, the royal elegance of Banarasi weaves, and bold, statement-making designer saree collections.</p>
            <p>Every saree at Safed Rang is crafted with love, care, creativity, and cultural soul — exclusively made for the woman who embraces her story with pride. Whether it’s a soft whisper of hand embroidery or the rich texture of heritage silk, our pieces are designed to make every woman feel seen, celebrated, and unstoppable.</p>
            <p><strong>Because at Safed Rang, each drape is made for you — just the way you are.</strong></p>
          </div>
        </div>
      </section>

      {/* 3. Why Choose Us (Reference Section) */}
      <section className="why-choose-us bg-light">
        <div className="container">
          <div className="wcu-grid">
            <div className="wcu-content">
              <h2 className="wcu-title">Why Choose Us?</h2>
              
              <div className="wcu-list">
                <div className="wcu-item">
                  <h4>Rooted in Indian Craftsmanship</h4>
                  <p>Inspired by India's rich textile heritage, thoughtfully crafted with refined detail and finish.</p>
                </div>
                
                <div className="wcu-item">
                  <h4>Timeless Ethnic Elegance</h4>
                  <p>Graceful designs that blend tradition with modern sophistication.</p>
                </div>

                <div className="wcu-item">
                  <h4>Premium Fabrics & Artful Detailing</h4>
                  <p>Carefully chosen fabrics enhanced with subtle prints and fine craftsmanship.</p>
                </div>

                <div className="wcu-item">
                  <h4>Effortless Comfort</h4>
                  <p>Fluid silhouettes and breathable materials designed for confident, all-day wear.</p>
                </div>
              </div>

              <Link to="/shop" className="btn-primary wcu-btn">SHOP ALL</Link>
            </div>
            
            <div className="wcu-image">
              <img src="/woman_chikankari_saree.jpg" alt="Elegant Saree" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
