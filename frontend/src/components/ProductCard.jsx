import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import { trackEvent, toAnalyticsItem } from "../lib/tracking";
import "./ProductCard.css";

// `priority` cards (the first row) load their image eagerly; the rest lazily.
export default function ProductCard({ product, index, listName, priority = false }) {
  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useCart();

  const rawStatus = (product.stockStatus || "").toLowerCase();
  const isSold =
    rawStatus === "sold out" ||
    rawStatus === "out of stock" ||
    (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0 && (!product.productType || product.productType === "simple"));
  const hasSale = product.salePrice && product.salePrice < product.price;
  const isWishlisted = isInWishlist ? isInWishlist(product.id) : false;

  // Extract all available product images — ensuring primary image is always at index 0
  const imagesList = useMemo(() => {
    const rawImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    if (product.image) {
      const rest = rawImages.filter((img) => img !== product.image);
      return [product.image, ...rest];
    }
    if (rawImages.length > 0) {
      return rawImages;
    }
    return ["https://via.placeholder.com/450x572?text=No+Image"];
  }, [product.images, product.image]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth 1-second looping carousel on hover
  useEffect(() => {
    if (!isHovered || imagesList.length <= 1) {
      setCurrentImageIndex(0);
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
    }, 1000); // Cycles every 1 second smoothly

    return () => clearInterval(intervalId);
  }, [isHovered, imagesList.length]);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleWishlist) {
      toggleWishlist(product);
    }
  };

  return (
    <div className={`product-card ${isSold ? "is-sold" : ""}`}>
      <Link
        to={`/product/${product.id}`}
        className="product-card-link"
        onClick={() => {
          if (listName) {
            trackEvent("select_item", {
              item_list_name: listName,
              items: [toAnalyticsItem(product, { index, listName })],
            });
          }
        }}
      >
        <div
          className="image-wrapper"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Render all product photos as stacked crossfade layers */}
          {imagesList.map((imgSrc, idx) => (
            <img
              key={`${imgSrc}-${idx}`}
              src={imgSrc}
              alt={`${product.title} - angle ${idx + 1}`}
              className={`carousel-product-img ${idx === currentImageIndex ? "is-active" : ""}`}
              loading={idx === 0 && priority ? "eager" : "lazy"}
              decoding="async"
            />
          ))}

          {/* Interactive photo indicator dots when multiple images exist */}
          {imagesList.length > 1 && (
            <div className={`hover-carousel-indicators ${isHovered ? "is-visible" : ""}`}>
              {imagesList.map((_, idx) => (
                <span
                  key={idx}
                  className={`indicator-dot ${idx === currentImageIndex ? "is-active" : ""}`}
                />
              ))}
            </div>
          )}

          {isSold ? (
            <div className="editorial-badge sold-out-badge" style={{ background: "rgba(0,0,0,0.8)", color: "#fff" }}>
              <span className="badge-line-1">OUT OF STOCK</span>
            </div>
          ) : (product.badge || product.isOneOfOne) ? (
            <div className="editorial-badge">
              <span className="badge-line-1">{(product.badge || "ONE OF ONE").toUpperCase()}</span>
            </div>
          ) : null}

          <button
            className={`wishlist-icon ${isWishlisted ? "is-active" : ""}`}
            aria-label="Add to wishlist"
            onClick={handleWishlistClick}
          >
            <Heart
              size={16}
              fill={isWishlisted ? "#6E1E2A" : "none"}
              color={isWishlisted ? "#6E1E2A" : "currentColor"}
            />
          </button>
        </div>

        <div className="card-info">
          <p className="card-subtitle">
            {(product.fabric || product.category || "PURE SILK").toUpperCase()}
            {product.craft ? ` · ${product.craft.toUpperCase()}` : ""}
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
              EXPLORE <span className="arrow">→</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
