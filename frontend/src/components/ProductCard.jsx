import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useCart();

  const isSold = product.stockStatus === "Sold Out";
  const hasSale = product.salePrice && product.salePrice < product.price;
  const isWishlisted = isInWishlist ? isInWishlist(product.id) : false;

  // Extract all available product images
  const imagesList = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    if (product.image) {
      return [product.image];
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
        style={{ textDecoration: "none", color: "inherit" }}
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
              loading={idx === 0 ? "eager" : "lazy"}
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

          <div className="editorial-badge">
            <span className="badge-line-1">ONE OF ONE</span>
          </div>

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
