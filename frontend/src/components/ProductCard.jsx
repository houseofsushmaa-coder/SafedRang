import { Link } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { formatPrice } = useCurrency();
  const isSold = product.stockStatus === "Sold Out";
  const hasSale = product.salePrice && product.salePrice < product.price;

  return (
    <div className={`product-card ${isSold ? "is-sold" : ""}`}>
      <Link
        to={`/product/${product.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="image-wrapper">
          <img
            src={product.images?.[0] || product.image || "https://via.placeholder.com/450x572?text=No+Image"}
            alt={product.title}
            className="primary-img"
            loading="lazy"
          />
          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt={`${product.title} alternate view`}
              className="secondary-img"
              loading="lazy"
            />
          )}
          
          <div className="editorial-badge">
            <span className="badge-line-1">ATELIER EXCLUSIVE</span>
            <span className="badge-line-2">GI CERTIFIED</span>
          </div>

          <button className="wishlist-icon" aria-label="Add to wishlist" onClick={(e) => { e.preventDefault(); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        <div className="card-info">
          <p className="card-subtitle">
            {(product.fabric || "PURE SILK").toUpperCase()} • {Math.floor(Math.random() * 500) + 200} CRAFT HOURS
          </p>
          <h3 className="card-title">
            {product.title.replace(/"/g, "")}
          </h3>
          <p className="card-desc-snippet">
            {product.description?.substring(0, 50).replace(/<[^>]+>/g, '').replace(/\\n/g, ' ')}...
          </p>
          <div className="price-row-editorial">
            <span className="price-editorial">
              {formatPrice(hasSale ? product.salePrice : product.price)}
            </span>
            <span className="examine-btn">
              EXAMINE <span className="arrow">→</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
