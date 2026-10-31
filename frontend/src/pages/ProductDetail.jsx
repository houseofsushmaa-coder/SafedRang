import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { trackEvent, toAnalyticsItem } from "../lib/tracking";
import "./ProductDetail.css";

// Product descriptions are admin-authored plain text (sometimes with simple
// HTML from imports). Keep line breaks and strip anything executable.
const formatDescription = (raw = "") =>
  String(raw)
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, "")
    .replace(/\r?\\n|\r?\n/g, "<br />")
    .replace(/(<br \/>\s*){3,}/g, "<br /><br />");

export default function ProductDetail() {
  const { id } = useParams();
  const { products, loading: productsLoading } = useProducts();
  const { formatPrice } = useCurrency();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();

  const product = products.find(
    (p) =>
      p.id === id ||
      p.sku?.toLowerCase() === id?.toLowerCase() ||
      (id === "bb0425m-rusty-red-blouse" && (p.sku === "BB-0425M" || p.id === "djhwme2ku"))
  );

  const [activeImage, setActiveImage] = useState(
    product?.image || product?.images?.[0],
  );
  const [activeTab, setActiveTab] = useState("details");
  const [selectedSize, setSelectedSize] = useState(null);

  // Mobile sticky bar: shown only while the main purchase buttons are off-screen.
  const actionsRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const isVariable = product?.productType === "variable" && Array.isArray(product?.variations) && product.variations.length > 0;
  const selectedVariation = isVariable ? product.variations.find((v) => v.size === selectedSize) : null;
  const basePrice = product?.salePrice || product?.price || 0;
  const effectivePrice = isVariable && selectedVariation
    ? basePrice + (selectedVariation.priceModifier || 0)
    : basePrice;

  // Strict stock & availability calculation
  const isOutOfStock = useMemo(() => {
    if (!product) return false;
    const rawStatus = (product.stockStatus || "").toLowerCase();
    if (rawStatus === "out of stock" || rawStatus === "sold out") return true;

    if (isVariable) {
      if (selectedVariation) {
        return (selectedVariation.stock ?? 0) <= 0;
      }
      return product.variations.every((v) => (v.stock ?? 0) <= 0);
    }

    return product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0;
  }, [product, isVariable, selectedVariation]);

  // Always reset scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (product) {
      setActiveImage(product.image || product.images?.[0]);
      setSelectedSize(null);
    }
    // product is re-created when the catalogue refreshes; key on its id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, product?.id]);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product?.id, product?.isArchived]);

  useEffect(() => {
    document.body.classList.toggle("has-pdp-sticky-bar", showStickyBar);
    return () => document.body.classList.remove("has-pdp-sticky-bar");
  }, [showStickyBar]);

  // view_item once per product page view.
  useEffect(() => {
    if (!product) return;
    trackEvent("view_item", { value: basePrice, items: [toAnalyticsItem(product, { price: basePrice })] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Adds the selected piece; returns true when it is in the bag afterwards.
  const addSelectedToBag = ({ announce }) => {
    const result = addToCart({ ...product, selectedSize });
    if (result.ok) {
      if (result.capped) toast(`Only ${result.available} available — your bag has been updated.`);
      else if (announce) toast.success("Added to your bag");
      return true;
    }
    if (result.reason === "max_reached") {
      toast("All available pieces are already in your bag.");
      return true;
    }
    if (result.reason === "needs_size") {
      toast.error(`Please select a ${product.attributeName || "Size"} first.`);
      return false;
    }
    toast.error("This piece has just sold out.");
    return false;
  };

  const handleAddToCart = () => {
    if (product?.isArchived) {
      toast.error("This creation has been archived and is not available for purchase.");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (isVariable && !selectedSize) {
      toast.error(`Please select a ${product.attributeName || 'Size'} first.`);
      return;
    }
    addSelectedToBag({ announce: true });
  };

  const handleBuyNow = () => {
    if (product?.isArchived) {
      toast.error("This creation has been archived and is not available for purchase.");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (isVariable && !selectedSize) {
      toast.error(`Please select a ${product.attributeName || 'Size'} first.`);
      return;
    }
    if (addSelectedToBag({ announce: false })) navigate("/checkout");
  };

  const whatsappEnquiryUrl = product
    ? `https://wa.me/919151566602?text=${encodeURIComponent(
        `Hello Safed Rang, I'd like to know more about "${product.title.replace(/"/g, "")}"${
          selectedSize ? ` (size ${selectedSize})` : ""
        }: ${window.location.origin}/product/${product.id}`
      )}`
    : "";

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

  if (!product && productsLoading) {
    return (
      <div className="pdp-container container" style={{ padding: "120px 20px", textAlign: "center" }} aria-busy="true">
        <p style={{ color: "var(--color-warm-taupe)", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.8rem" }}>
          Loading this creation…
        </p>
      </div>
    );
  }

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

  const imagesList = (() => {
    const raw = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    if (product.image) {
      const rest = raw.filter((img) => img !== product.image);
      return [product.image, ...rest];
    }
    return raw.length > 0 ? raw : ["https://via.placeholder.com/450x572?text=No+Image"];
  })();

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
              {Boolean(product.badge || product.isOneOfOne) && (
                <span className="badge-luxury">{(product.badge || "ONE OF ONE").toUpperCase()}</span>
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
                  {formatPrice(effectivePrice)}
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
                  {formatPrice((product.price || 0) + (selectedVariation?.priceModifier || 0))}
                </span>
                {product.price > product.salePrice && (
                  <span
                    className="pdp-discount-badge"
                    style={{
                      marginLeft: "10px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#b91c1c",
                      background: "#fee2e2",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                  </span>
                )}
              </>
            ) : isVariable ? (
              <span>
                {selectedVariation
                  ? formatPrice(effectivePrice)
                  : product.price > 0
                  ? `From ${formatPrice(product.price)}`
                  : "Select a size"}
              </span>
            ) : (
              <span>{formatPrice(product.price)}</span>
            )}
          </div>

          {(product.fabric || product.craft) && (
            <p className="pdp-fabric-craft">
              {[product.fabric, product.craft].filter(Boolean).join(" · ")}
            </p>
          )}

          {product.isOneOfOne && (
            <p className="pdp-one-of-one-note">
              A One of One creation — a single combination of fabric, dye and hand embroidery. Once sold, this design is retired.
            </p>
          )}

          {/* Availability Status */}
          <div className="pdp-stock-status-wrap" style={{ marginTop: "10px", marginBottom: "14px" }}>
            {isOutOfStock ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#dc2626",
                  background: "#fee2e2",
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626" }} />
                Out of Stock
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#16a34a",
                  background: "#dcfce7",
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
                In Stock
              </span>
            )}
          </div>

          {/* Size / Variation Selector */}
          {isVariable && (
            <div className="pdp-variation-section">
              <p className="pdp-variation-label">
                {product.attributeName || "Size"}:
                {selectedSize && (
                  <strong style={{ marginLeft: 6 }}>{selectedSize}</strong>
                )}
              </p>
              <div className="pdp-size-options">
                {product.variations.map((v) => {
                  const soldOut = (v.stock || 0) === 0;
                  return (
                    <button
                      key={v.size}
                      type="button"
                      disabled={soldOut}
                      className={`pdp-size-btn${
                        selectedSize === v.size ? " selected" : ""
                      }${soldOut ? " sold-out" : ""}`}
                      onClick={() => setSelectedSize(v.size)}
                      title={soldOut ? "Sold out" : ""}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.isArchived ? (
            <div
              style={{
                background: "rgba(110, 30, 42, 0.05)",
                border: "1px solid rgba(110, 30, 42, 0.2)",
                padding: "16px 20px",
                borderRadius: "8px",
                marginTop: "20px",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  backgroundColor: "#6E1E2A",
                  color: "#FAF5EC",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  marginBottom: "8px",
                }}
              >
                ARCHIVED PIECE
              </span>
              <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--color-charcoal)", lineHeight: 1.5 }}>
                This exclusive piece has been retired or sold permanently and is kept for historical presentation. It is no longer available for order.
              </p>
            </div>
          ) : (
            <div className="product-actions" ref={actionsRef}>
              <button
                className="btn-primary btn-add-to-cart"
                disabled={isOutOfStock || (isVariable && !selectedSize)}
                onClick={handleAddToCart}
              >
                {isOutOfStock
                  ? (product.stockStatus === "Sold Out" ? "SOLD OUT" : "OUT OF STOCK")
                  : isVariable && !selectedSize
                  ? `SELECT ${(product.attributeName || "SIZE").toUpperCase()}`
                  : "ADD TO CART"}
              </button>
              {!isOutOfStock && (
                <button
                  className="btn-secondary btn-buy-now"
                  disabled={isVariable && !selectedSize}
                  onClick={handleBuyNow}
                >
                  BUY IT NOW
                </button>
              )}
            </div>
          )}

          <div className="pdp-delivery-info">
            <div className="pincode-header">
              <Truck size={16} /> <span>Delivery &amp; Payment</span>
            </div>
            <ul>
              <li>Dispatched from our Lucknow atelier within 2–3 business days; delivered across India in 4–7 business days.</li>
              <li>Free shipping with online payment (UPI, cards, netbanking). Cash on Delivery available in India for a small handling fee.</li>
              <li>International shipping: 7–12 business days after dispatch.</li>
            </ul>
            <a
              className="pdp-whatsapp-enquiry"
              href={whatsappEnquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("whatsapp_click", { context: "product", item_id: product.id })}
            >
              <MessageCircle size={16} /> Ask about this piece on WhatsApp
            </a>
          </div>

          <div className="product-description">
            <div dangerouslySetInnerHTML={{ __html: formatDescription(product.description) }} />
          </div>

          <div className="product-share">
            <button type="button" onClick={handleShare}>
              <Share2 size={16} /> Share this piece
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sticky purchase bar */}
      {!product.isArchived && (
        <div className={`pdp-sticky-bar ${showStickyBar ? "is-visible" : ""}`} aria-hidden={!showStickyBar}>
          <div className="pdp-sticky-info">
            <span className="pdp-sticky-title">{product.title.replace(/"/g, "")}</span>
            <span className="pdp-sticky-price">
              {isVariable && !selectedVariation ? `From ${formatPrice(basePrice)}` : formatPrice(effectivePrice)}
            </span>
          </div>
          <button
            type="button"
            className="btn-primary pdp-sticky-btn"
            tabIndex={showStickyBar ? 0 : -1}
            disabled={isOutOfStock}
            onClick={() => {
              if (isVariable && !selectedSize) {
                actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
              }
              handleAddToCart();
            }}
          >
            {isOutOfStock
              ? "SOLD OUT"
              : isVariable && !selectedSize
              ? `SELECT ${(product.attributeName || "SIZE").toUpperCase()}`
              : "ADD TO BAG"}
          </button>
        </div>
      )}

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
            className={activeTab === "shipping" ? "active" : ""}
            onClick={() => setActiveTab("shipping")}
          >
            Shipping &amp; Exchange
          </button>
          <button
            className={activeTab === "care" ? "active" : ""}
            onClick={() => setActiveTab("care")}
          >
            Care
          </button>
        </div>
        <div className="tabs-content">
          {activeTab === "details" && (
            <div className="tab-pane">
              {[
                ["Category", product.category],
                ["Fabric", product.fabric],
                ["Craft", product.craft],
                ["Weight", product.weight ? `${product.weight} kg` : ""],
                ["SKU", product.sku],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <p key={label}>
                    <strong>{label}:</strong> {value}
                  </p>
                ))}
            </div>
          )}
          {activeTab === "shipping" && (
            <div className="tab-pane">
              <ul className="terms-list">
                <li>
                  <Truck size={16} /> Dispatched within 2–3 business days. Delivery in 4–7 business days within India; 7–12 business days internationally.
                </li>
                <li>
                  <ShieldCheck size={16} /> Authentic handcrafted creation from our Lucknow atelier.
                </li>
                <li>
                  <RefreshCw size={16} /> Exchange available for damaged products with a 360&deg; unboxing video.
                </li>
              </ul>
              <p style={{ marginTop: 12 }}>
                Questions? <Link to="/faq">Read our FAQ</Link> or{" "}
                <a href={whatsappEnquiryUrl} target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.
              </p>
            </div>
          )}
          {activeTab === "care" && (
            <div className="tab-pane">
              <p>Dry clean only to preserve delicate zari and mukaish work.</p>
              <p style={{ marginTop: 8 }}>
                See our <Link to="/care-guide">Care Guide</Link> for storing and caring for hand-embroidered pieces.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
