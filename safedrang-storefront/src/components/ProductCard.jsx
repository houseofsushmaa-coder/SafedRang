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
            src={product.images[0]}
            alt={product.title}
            className="primary-img"
            loading="lazy"
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={`${product.title} alternate view`}
              className="secondary-img"
              loading="lazy"
            />
          )}
          {product.category === "Sarees" && !isSold && (
            <span className="badge badge-one-of-one">ONE OF ONE</span>
          )}
          {isSold && <span className="badge badge-sold">SOLD OUT</span>}
          {hasSale && !isSold && <span className="badge badge-sale">SALE</span>}

          <div className="quick-view-overlay">
            <button className="btn-secondary">QUICK VIEW</button>
          </div>
        </div>

        <div className="card-info">
          <p className="card-craft">{product.craft}</p>
          <h3 style={{ textTransform: "capitalize" }}>
            {product.title.replace(/"/g, "")}
          </h3>
          <div className="price-row">
            {hasSale ? (
              <>
                <span className="price sale-price">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="price original-price">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="price">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
