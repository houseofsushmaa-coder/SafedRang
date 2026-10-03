import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { Edit, Trash2, Plus, Download, Upload, Filter, Search, Package, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import axios from 'axios';
import './AdminPages.css';

const Products = () => {
  const { products, deleteProduct, loading } = useProducts();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

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
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    const csvData = products.map(p => ({
      Title: p.title,
      SKU: p.sku || '',
      Category: p.category,
      Price: p.price,
      SalePrice: p.salePrice || '',
      Stock: p.stock || 0,
      Status: p.stockStatus
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `safedrang-products-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const token = localStorage.getItem('adminToken');
          
          // Loop through each row and create a product
          for (const row of results.data) {
            if (!row.Title) continue;
            
            await axios.post('https://violet-quetzal-133812.hostingersite.com/api/v1/products', {
              name: row.Title,
              sku: row.SKU || undefined,
              price: parseFloat(row.Price) || 0,
              salePrice: row.SalePrice ? parseFloat(row.SalePrice) : undefined,
              stock: parseInt(row.Stock, 10) || 0,
              description: row.Description || ''
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          
          alert('Products imported successfully! Please refresh the page to see them.');
          window.location.reload();
        } catch (error) {
          console.error("Import error:", error);
          alert('There was an error importing some products. Check console for details.');
        } finally {
          setImporting(false);
          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    });
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-subtitle">Manage your store's inventory and product details.</p>
        </div>
        <div className="header-actions">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
          <button 
            className="admin-btn admin-btn-outline icon-left" 
            onClick={handleImportClick}
            disabled={importing}
          >
            {importing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />} 
            {importing ? 'Importing...' : 'Import'}
          </button>
          <button className="admin-btn admin-btn-outline icon-left" onClick={handleExport}>
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
