import { useState } from "react";
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
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const { products } = useProducts();
  const { formatPrice } = useCurrency();

  // Find product by id, default to first product if not found (for testing)
  const product = products.find((p) => p.id === id) || products[0];

  const [activeImage, setActiveImage] = useState(
    product?.images?.[0] || product?.image,
  );
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

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
            {product.images.map((img, index) => (
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
            <img src={activeImage} alt={product.title} />
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
              onClick={() => setIsWishlisted(!isWishlisted)}
            >
              <Heart
                size={20}
                fill={isWishlisted ? "var(--color-dark-charcoal)" : "none"}
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

          <div className="product-description">
            <p>{product.description}</p>
          </div>

          <div className="product-actions">
            <button
              className="btn-primary btn-add-to-cart"
              disabled={product.stockStatus === "Sold Out"}
            >
              {product.stockStatus === "Sold Out" ? "SOLD OUT" : "ADD TO CART"}
            </button>
            {product.stockStatus !== "Sold Out" && (
              <button className="btn-secondary btn-buy-now">BUY IT NOW</button>
            )}
          </div>

          <div className="pincode-checker">
            <div className="pincode-header">
              <Truck size={16} /> <span>Check Delivery Options</span>
            </div>
            <div className="pincode-input-group">
              <input type="text" placeholder="Enter Pincode" maxLength="6" />
              <button className="btn-pincode">Check</button>
            </div>
          </div>

          <div className="product-share">
            <button>
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
            className={activeTab === "terms" ? "active" : ""}
            onClick={() => setActiveTab("terms")}
          >
            Terms & Conditions
          </button>
        </div>
        <div className="tabs-content">
          {activeTab === "details" && (
            <div className="tab-pane">
              <p>
                <strong>Fabric:</strong> {product.fabric}
              </p>
              <p>
                <strong>Craft:</strong> {product.craft}
              </p>
              <p>
                <strong>SKU:</strong> {product.sku}
              </p>
            </div>
          )}
          {activeTab === "additional" && (
            <div className="tab-pane">
              <p>
                <strong>Weight:</strong> {product.weight}
              </p>
              <p>
                <strong>Dimensions:</strong> {product.dimensions}
              </p>
            </div>
          )}
          {activeTab === "terms" && (
            <div className="tab-pane">
              <ul className="terms-list">
                <li>
                  <ShieldCheck size={16} /> No refund policy.
                </li>
                <li>
                  <RefreshCw size={16} /> Exchange available only for damaged
                  products with 360 unboxing video.
                </li>
                <li>Dry clean only.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
