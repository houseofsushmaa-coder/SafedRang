import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import './Shop.css';

const PRICE_RANGES = [
  { label: 'Under ₹5,000', min: 0, max: 4999 },
  { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 – ₹15,000', min: 10000, max: 15000 },
  { label: 'Above ₹15,000', min: 15001, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc', label: 'Name: A → Z' },
];

export default function Shop() {
  const { products, getAllCategories } = useProducts();

  /* ── filter state ── */
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCraft, setActiveCraft] = useState('All');
  const [activeFabric, setActiveFabric] = useState('All');
  const [activePriceRange, setActivePriceRange] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = getAllCategories();
  const crafts = useMemo(() => ['All', ...new Set(products.map(p => p.craft).filter(Boolean))], [products]);
  const fabrics = useMemo(() => ['All', ...new Set(products.map(p => p.fabric).filter(Boolean))], [products]);

  /* ── filtering + sorting ── */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory !== 'All') list = list.filter(p => p.category === activeCategory);
    if (activeCraft !== 'All') list = list.filter(p => p.craft === activeCraft);
    if (activeFabric !== 'All') list = list.filter(p => p.fabric === activeFabric);
    if (activePriceRange) {
      list = list.filter(p => {
        const price = p.salePrice ?? p.price;
        return price >= activePriceRange.min && price <= activePriceRange.max;
      });
    }

    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case 'price-desc':
        list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case 'name-asc':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return list;
  }, [activeCategory, activeCraft, activeFabric, activePriceRange, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== 'All') count++;
    if (activeCraft !== 'All') count++;
    if (activeFabric !== 'All') count++;
    if (activePriceRange) count++;
    return count;
  }, [activeCategory, activeCraft, activeFabric, activePriceRange]);

  const clearAllFilters = useCallback(() => {
    setActiveCategory('All');
    setActiveCraft('All');
    setActiveFabric('All');
    setActivePriceRange(null);
  }, []);

  /* ── shared filter sidebar markup ── */
  const renderFilters = () => (
    <>
      {/* ── Category ── */}
      <div className="filter-group">
        <h4>Category</h4>
        {categories.map(cat => (
          <label key={cat} className={`filter-option ${activeCategory === cat ? 'active' : ''}`}>
            <span className="radio-dot">{activeCategory === cat && <span className="radio-dot-inner" />}</span>
            <input
              type="radio"
              name="category"
              checked={activeCategory === cat}
              onChange={() => setActiveCategory(cat)}
            />
            {cat}
          </label>
        ))}
      </div>

      {/* ── Craft ── */}
      <div className="filter-group">
        <h4>Craft</h4>
        <label className={`filter-option ${activeCraft === 'All' ? 'active' : ''}`}>
          <span className="radio-dot">{activeCraft === 'All' && <span className="radio-dot-inner" />}</span>
          <input type="radio" name="craft" checked={activeCraft === 'All'} onChange={() => setActiveCraft('All')} />
          All
        </label>
        {crafts.map(craft => (
          <label key={craft} className={`filter-option ${activeCraft === craft ? 'active' : ''}`}>
            <span className="radio-dot">{activeCraft === craft && <span className="radio-dot-inner" />}</span>
            <input type="radio" name="craft" checked={activeCraft === craft} onChange={() => setActiveCraft(craft)} />
            {craft}
          </label>
        ))}
      </div>

      {/* ── Fabric ── */}
      <div className="filter-group">
        <h4>Fabric</h4>
        <label className={`filter-option ${activeFabric === 'All' ? 'active' : ''}`}>
          <span className="radio-dot">{activeFabric === 'All' && <span className="radio-dot-inner" />}</span>
          <input type="radio" name="fabric" checked={activeFabric === 'All'} onChange={() => setActiveFabric('All')} />
          All
        </label>
        {fabrics.map(fabric => (
          <label key={fabric} className={`filter-option ${activeFabric === fabric ? 'active' : ''}`}>
            <span className="radio-dot">{activeFabric === fabric && <span className="radio-dot-inner" />}</span>
            <input type="radio" name="fabric" checked={activeFabric === fabric} onChange={() => setActiveFabric(fabric)} />
            {fabric}
          </label>
        ))}
      </div>

      {/* ── Price Range ── */}
      <div className="filter-group">
        <h4>Price</h4>
        <label className={`filter-option ${!activePriceRange ? 'active' : ''}`}>
          <span className="radio-dot">{!activePriceRange && <span className="radio-dot-inner" />}</span>
          <input type="radio" name="price" checked={!activePriceRange} onChange={() => setActivePriceRange(null)} />
          All
        </label>
        {PRICE_RANGES.map(range => (
          <label key={range.label} className={`filter-option ${activePriceRange?.label === range.label ? 'active' : ''}`}>
            <span className="radio-dot">{activePriceRange?.label === range.label && <span className="radio-dot-inner" />}</span>
            <input
              type="radio"
              name="price"
              checked={activePriceRange?.label === range.label}
              onChange={() => setActivePriceRange(range)}
            />
            {range.label}
          </label>
        ))}
      </div>
    </>
  );

  return (
    <div className="shop-page">
      {/* ── Breadcrumbs ── */}
      <nav className="shop-breadcrumbs container" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Shop</span>
      </nav>

      {/* ── Page header ── */}
      <header className="shop-header container">
        <h1>Shop Collections</h1>
        <p>Handcrafted sarees, kurta sets & blouses — each piece a testament to heritage artistry.</p>
      </header>

      <div className="shop-body container">
        {/* ── Toolbar: mobile filter toggle + result count + sort ── */}
        <div className="shop-toolbar">
          <button
            className="mobile-filter-toggle"
            onClick={() => setMobileFiltersOpen(prev => !prev)}
            aria-expanded={mobileFiltersOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
            Filters
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          <p className="result-count">
            Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'piece' : 'pieces'}
          </p>

          <div className="sort-control">
            <label htmlFor="sort-select">Sort by</label>
            <select id="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="shop-layout">
          {/* ── Desktop sidebar ── */}
          <aside className="filters-sidebar">
            <div className="filters-sidebar-header">
              <h3>Filters</h3>
              {activeFilterCount > 0 && (
                <button className="clear-all-btn" onClick={clearAllFilters}>Clear all</button>
              )}
            </div>
            {renderFilters()}
          </aside>

          {/* ── Mobile filter drawer ── */}
          <div className={`mobile-filter-drawer ${mobileFiltersOpen ? 'open' : ''}`}>
            <div className="mobile-filter-drawer-overlay" onClick={() => setMobileFiltersOpen(false)} />
            <div className="mobile-filter-drawer-panel">
              <div className="mobile-filter-drawer-header">
                <h3>Filters</h3>
                <button className="mobile-filter-close" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {renderFilters()}
              <div className="mobile-filter-drawer-actions">
                {activeFilterCount > 0 && (
                  <button className="btn-secondary" onClick={clearAllFilters}>Clear All</button>
                )}
                <button className="btn-primary" onClick={() => setMobileFiltersOpen(false)}>
                  Show {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Product grid ── */}
          <main className="product-grid-wrapper">
            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-warm-taupe)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <h3>No pieces found</h3>
                <p>Try adjusting your filters to discover more from our collection.</p>
                <button className="btn-secondary" onClick={clearAllFilters}>Clear All Filters</button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
