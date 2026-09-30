import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { Edit, Trash2, Plus, Download, Upload, Filter, Search, MoreVertical } from 'lucide-react';
import './AdminPages.css';

const Products = () => {
  const { products, deleteProduct, loading } = useProducts();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'in stock': return 'status-completed';
      case 'low stock': return 'status-pending';
      case 'out of stock':
      case 'sold out': return 'status-cancelled';
      default: return 'status-processing';
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-subtitle">Manage your store's inventory and product details.</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn admin-btn-outline icon-left">
            <Upload size={16} /> Import
          </button>
          <button className="admin-btn admin-btn-outline icon-left">
            <Download size={16} /> Export
          </button>
          <button className="admin-btn icon-left" onClick={() => navigate('/admin/product/new')}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <button className="admin-btn admin-btn-outline icon-left">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading products...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th width="50">
                    <input type="checkbox" />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Inventory</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="product-cell">
                        <div 
                          className="product-img" 
                          style={{ backgroundImage: `url(${product.image})` }}
                        />
                        <div className="product-info">
                          <span className="product-title">{product.title}</span>
                          <span className="product-sku">{product.sku || product.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="category-badge">{product.category}</span></td>
                    <td className="font-medium">
                      {product.salePrice ? (
                        <div>
                          <span className="sale-price">{formatCurrency(product.salePrice)}</span>
                          <span className="original-price">{formatCurrency(product.price)}</span>
                        </div>
                      ) : (
                        <span>{formatCurrency(product.price)}</span>
                      )}
                    </td>
                    <td>
                      <div className="inventory-cell">
                        <span className="stock-count">{product.stock || 0} in stock</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(product.stockStatus)}`}>
                        {product.stockStatus || 'Active'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button className="action-btn" title="Edit" onClick={() => navigate(`/admin/product/${product.id}`)}>
                          <Edit size={16} />
                        </button>
                        <button className="action-btn delete" title="Delete" onClick={() => {
                          if(window.confirm('Are you sure you want to delete this product?')) deleteProduct(product.id)
                        }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h3>No products found</h3>
            <p>Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
