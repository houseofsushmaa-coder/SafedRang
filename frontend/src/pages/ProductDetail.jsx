import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  Heart,
  Share2,
  Star,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const { products } = useProducts();
  const { formatPrice } = useCurrency();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();

  const product = products.find((p) => p.id === id);

  const [activeImage, setActiveImage] = useState(
    product?.images?.[0] || product?.image,
  );
  const [activeTab, setActiveTab] = useState("details");
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Always reset scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (product) {
      setActiveImage(product.images?.[0] || product.image);
      setPincodeStatus(null);
    }
  }, [id, product]);

  const handleAddToCart = () => {
    addToCart(product);
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate("/checkout");
  };

  const handleCheckPincode = (e) => {
    if (e) e.preventDefault();
    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeStatus({
        success: false,
        text: "Please enter a valid 6-digit Indian PIN code.",
      });
      return;
    }
    setPincodeStatus({
      success: true,
      text: `Delivery available to PIN ${cleanPin}! Estimated within 3–5 business days · Free insured delivery.`,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} at Safedrang`,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback below
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    } else {
      toast.success("Link: " + window.location.href);
    }
  };

  if (!product) {
    return (
      <div className="pdp-container container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/shop" className="btn-primary" style={{ display: "inline-block", marginTop: "20px", padding: "12px 24px" }}>
          Return to Shop
        </Link>
      </div>
    );
  }

  const imagesList = product.images?.length > 0 ? product.images : (product.image ? [product.image] : []);

  return (
    <div className="pdp-container">
      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link to="/">Home</Link> <ChevronRight size={14} />
        <Link to="/shop">Shop</Link> <ChevronRight size={14} />
        <span style={{ textTransform: "capitalize" }}>
          {product.title.replace(/"/g, "")}
        </span>
      </div>

      <div className="pdp-grid container">
        {/* Left: Image Gallery */}
        <div className="pdp-gallery">
          <div className="gallery-thumbnails">
            {imagesList.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className={activeImage === img ? "active" : ""}
                onClick={() => setActiveImage(img)}
              />
            ))}
          </div>
          <div className="gallery-main">
            <img src={activeImage || imagesList[0]} alt={product.title} />
            <div className="badges">
              {product.category === "Sarees" && (
                <span className="badge-luxury">ONE OF ONE</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="pdp-info">
          <div className="pdp-header">
            <h1
              className="product-title"
              style={{ textTransform: "capitalize" }}
            >
              {product.title.replace(/"/g, "")}
            </h1>
            <button
              className="btn-wishlist"
              onClick={() => toggleWishlist(product)}
            >
              <Heart
                size={20}
                fill={isInWishlist(product.id) ? "var(--color-dark-charcoal)" : "none"}
                color="var(--color-dark-charcoal)"
              />
            </button>
          </div>

          <div className="product-price">
            {product.salePrice ? (
              <>
                <span className="sale-price">
                  {formatPrice(product.salePrice)}
                </span>
                <span
                  className="original-price"
                  style={{
                    textDecoration: "line-through",
                    color: "gray",
                    marginLeft: "10px",
                    fontSize: "1rem",
                  }}
                >
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span>{formatPrice(product.price)}</span>
            )}
          </div>

          <div className="product-reviews">
            <div className="stars">
              <Star
                size={14}
                fill="var(--color-antique-gold)"
                color="var(--color-antique-gold)"
              />
              <Star
                size={14}
                fill="var(--color-antique-gold)"
                color="var(--color-antique-gold)"
              />
              <Star
                size={14}
                fill="var(--color-antique-gold)"
                color="var(--color-antique-gold)"
              />
              <Star
                size={14}
                fill="var(--color-antique-gold)"
                color="var(--color-antique-gold)"
              />
              <Star
                size={14}
                fill="var(--color-antique-gold)"
                color="var(--color-antique-gold)"
              />
            </div>
            <span>(Customer Reviews)</span>
          </div>

          <div className="product-actions">
            <button
              className="btn-primary btn-add-to-cart"
              disabled={product.stockStatus === "Sold Out"}
              onClick={handleAddToCart}
            >
              {product.stockStatus === "Sold Out" ? "SOLD OUT" : "ADD TO CART"}
            </button>
            {product.stockStatus !== "Sold Out" && (
              <button className="btn-secondary btn-buy-now" onClick={handleBuyNow}>BUY IT NOW</button>
            )}
          </div>

          <form className="pincode-checker" onSubmit={handleCheckPincode}>
            <div className="pincode-header">
               <Truck size={16} /> <span>Check Delivery Options</span>
            </div>
            <div className="pincode-input-group">
               <input
                 type="text"
                 placeholder="Enter 6-digit Pincode"
                 maxLength="6"
                 value={pincode}
                 onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
               />
               <button type="submit" className="btn-pincode">Check</button>
            </div>
            {pincodeStatus && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "0.82rem",
                  color: pincodeStatus.success ? "#2e7d32" : "#c62828",
                  fontFamily: "var(--font-body)",
                }}
              >
                {pincodeStatus.text}
              </p>
            )}
          </form>

          <div className="product-description">
            <div dangerouslySetInnerHTML={{ __html: product.description?.replace(/\\n/g, ' ') || '' }} />
          </div>

          <div className="product-share">
            <button type="button" onClick={handleShare}>
              <Share2 size={16} /> Share this piece
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="product-tabs container">
        <div className="tabs-header">
          <button
            className={activeTab === "details" ? "active" : ""}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={activeTab === "additional" ? "active" : ""}
            onClick={() => setActiveTab("additional")}
          >
            Additional Information
          </button>
          <button
            className={activeTab === "reviews" ? "active" : ""}
            onClick={() => setActiveTab("reviews")}
          >
            Client Reviews (4)
          </button>
          <button
            className={activeTab === "terms" ? "active" : ""}
            onClick={() => setActiveTab("terms")}
          >
            Terms &amp; Conditions
          </button>
        </div>
        <div className="tabs-content">
          {activeTab === "details" && (
            <div className="tab-pane">
              <p>
                <strong>Fabric:</strong> {product.fabric || "Pure Mulberry Silk"}
              </p>
              <p>
                <strong>Craft:</strong> {product.craft || "Lucknowi Hand Chikankari"}
              </p>
              <p>
                <strong>SKU:</strong> {product.sku || "SR-LUX-001"}
              </p>
            </div>
          )}
          {activeTab === "additional" && (
            <div className="tab-pane">
              <p>
                <strong>Weight:</strong> {product.weight || "0.650 kg"}
              </p>
              <p>
                <strong>Dimensions:</strong> {product.dimensions || "30 × 25 × 5 cm"}
              </p>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="tab-pane">
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div style={{ borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#AE8A54" color="#AE8A54" />
                      ))}
                    </div>
                    <strong style={{ fontSize: "0.9rem" }}>Pooja Verma</strong>
                    <span style={{ fontSize: "0.75rem", color: "#2e7d32", fontWeight: "600" }}>✓ Verified Buyer · Lucknow</span>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#555", margin: 0, fontStyle: "italic" }}>
                    &ldquo;The stitching perfection is extraordinary. You can tell this took weeks of artisan hands. Absolutely royal drape.&rdquo;
                  </p>
                </div>

                <div style={{ borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#AE8A54" color="#AE8A54" />
                      ))}
                    </div>
                    <strong style={{ fontSize: "0.9rem" }}>Kavita Singhal</strong>
                    <span style={{ fontSize: "0.75rem", color: "#2e7d32", fontWeight: "600" }}>✓ Verified Buyer · Delhi NCR</span>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#555", margin: 0, fontStyle: "italic" }}>
                    &ldquo;The luxury unboxing experience blew me away. Worth every rupee for an authentic heirloom piece.&rdquo;
                  </p>
                </div>

                <div style={{ borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#AE8A54" color="#AE8A54" />
                      ))}
                    </div>
                    <strong style={{ fontSize: "0.9rem" }}>Natasha Batra</strong>
                    <span style={{ fontSize: "0.75rem", color: "#2e7d32", fontWeight: "600" }}>✓ Verified Buyer · Mumbai</span>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#555", margin: 0, fontStyle: "italic" }}>
                    &ldquo;So rare to find real one-of-one pieces online. Beautiful weight and exquisite Mukaish highlights.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === "terms" && (
            <div className="tab-pane">
              <ul className="terms-list">
                <li>
                  <ShieldCheck size={16} /> Authentic handcrafted creation guarantee.
                </li>
                <li>
                  <RefreshCw size={16} /> Exchange available for damaged products with 360&deg; unboxing video.
                </li>
                <li>Dry clean only to preserve delicate zari and mukaish work.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
