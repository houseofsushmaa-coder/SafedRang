import "./Footer.css";
import { Link } from "react-router-dom";
import { Award, ShieldCheck, Globe, Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      {/* Newsletter Section */}
      <div className="newsletter-section">
        <div className="container newsletter-grid">
          <div className="newsletter-form-container">
            <h3>ENTER THE WORLD OF SAFEDRANG</h3>
            <p>
              Be the first to discover new one-of-one creations, stories from
              our artisans, and more.
            </p>
            <form className="newsletter-form">
              <input type="email" placeholder="Your email address" required />
              <button type="submit">SUBSCRIBE</button>
            </form>
          </div>
          <div className="trust-markers">
            <div className="trust-item">
              <Award size={20} strokeWidth={1.5} /> <span>Authentic Craftsmanship</span>
            </div>
            <div className="trust-item">
              <ShieldCheck size={20} strokeWidth={1.5} /> <span>Secure Payment</span>
            </div>
            <div className="trust-item">
              <Globe size={20} strokeWidth={1.5} /> <span>Worldwide Shipping</span>
            </div>
            <div className="trust-item">
              <Leaf size={20} strokeWidth={1.5} /> <span>A More Thoughtful Wardrobe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="footer-main">
        <div className="container footer-grid">
          <div className="brand-col">
            <Link
              to="/"
              style={{
                textDecoration: "none",
                display: "inline-block",
                marginBottom: "2rem",
              }}
            >
              <div
                className="logo-circle"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  border: "1px solid var(--color-dark-charcoal)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}
              >
                <img 
                  src="/circle-logo.png" 
                  alt="Safedrang Circle Logo" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              </div>
            </Link>
          </div>

          <div className="links-col">
            <h4>SHOP</h4>
            <ul>
              <li>
                <Link to="/shop?category=sarees">Sarees</Link>
              </li>
              <li>
                <Link to="/one-of-one">One-of-One</Link>
              </li>
              <li>
                <Link to="/shop?craft=chikankari">Chikankari</Link>
              </li>
              <li>
                <Link to="/shop?craft=zardozi">Zardozi</Link>
              </li>
              <li>
                <Link to="/shop?category=bridal">Bridal Sets</Link>
              </li>
            </ul>
          </div>

          <div className="links-col">
            <h4>DISCOVER</h4>
            <ul>
              <li>
                <Link to="/story">Our Story</Link>
              </li>
              <li>
                <Link to="/craft">The Craft</Link>
              </li>
              <li>
                <Link to="/artisans">Artisans</Link>
              </li>
              <li>
                <Link to="/journal">Journal</Link>
              </li>
              <li>
                <Link to="/archive">Archive</Link>
              </li>
            </ul>
          </div>

          <div className="links-col">
            <h4>CUSTOMER CARE</h4>
            <ul>
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              <li>
                <Link to="/shipping">Shipping</Link>
              </li>
              <li>
                <Link to="/care">Care Guide</Link>
              </li>
              <li>
                <Link to="/returns">Returns & Exchange</Link>
              </li>
              <li>
                <Link to="/faq">FAQs</Link>
              </li>
            </ul>
          </div>

          <div className="links-col">
            <h4>FOLLOW</h4>
            <ul>
              <li>
                <a href="#">Instagram</a>
              </li>
              <li>
                <a href="#">Facebook</a>
              </li>
              <li>
                <a href="#">Pinterest</a>
              </li>
              <li>
                <a href="#">YouTube</a>
              </li>
            </ul>
          </div>

          <div className="quote-col">
            <blockquote>
              "Keeping our craft alive for a more beautiful tomorrow."
            </blockquote>
          </div>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>&copy; 2024 Safedrang. All rights reserved.</p>
        <div className="legal-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
        </div>
      </div>
    </footer>
  );
}
