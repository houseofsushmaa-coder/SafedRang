import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { Save, X, Image as ImageIcon, UploadCloud, Star, Trash2 } from 'lucide-react';
import './AdminPages.css';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct, loading } = useProducts();
  const mainUploadRef = useRef(null);
  const galleryUploadRef = useRef(null);
  const [draggingMain, setDraggingMain] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    salePrice: '',
    sku: '',
    stockStatus: 'In Stock',
    image: '',
    images: [],
    description: ''
  });

  useEffect(() => {
    if (!loading && products.length > 0) {
      const product = products.find(p => p.id === id);
      if (product) {
        // Strip basic HTML tags from description for easier text editing if needed,
        // or just load it as is.
        let rawDesc = product.description || '';
        
        setFormData({
          title: product.title || '',
          category: product.category || '',
          price: product.price || '',
          salePrice: product.salePrice || '',
          sku: product.sku || '',
          stockStatus: product.stockStatus || 'In Stock',
          image: product.image || '',
          images: product.images || [],
          description: rawDesc
        });
      }
    }
  }, [id, products, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleMainImageUpload = async (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const base64 = await fileToBase64(file);
    setFormData(prev => ({
      ...prev,
      image: base64,
      images: prev.images.length === 0 ? [base64] : [base64, ...prev.images.slice(1)]
    }));
  };

  const handleGalleryUpload = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const base64List = await Promise.all(imageFiles.map(fileToBase64));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...base64List]
    }));
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => {
      const updated = prev.images.filter((_, i) => i !== index);
      const newMain = updated[0] || '';
      return { ...prev, images: updated, image: newMain };
    });
  };

  const setAsMain = (index) => {
    setFormData(prev => {
      const reordered = [prev.images[index], ...prev.images.filter((_, i) => i !== index)];
      return { ...prev, images: reordered, image: reordered[0] };
    });
  };

  const onDragOver = (e) => { e.preventDefault(); setDraggingMain(true); };
  const onDragLeave = () => setDraggingMain(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDraggingMain(false);
    handleMainImageUpload(e.dataTransfer.files);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProduct(id, {
      ...formData,
      price: parseFloat(formData.price) || 0,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
    });
    navigate('/admin/products');
  };

  if (loading) {
    return <div className="admin-loading-state">Loading product details...</div>;
  }

  return (
    <div className="admin-page edit-product-page">
      <div className="page-header sticky-header">
        <div>
          <h2>{formData.title || 'Edit Product'}</h2>
          <p className="page-subtitle">Make changes to product information, pricing, and media.</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn admin-btn-outline icon-left" onClick={() => window.open(`/product/${id}`, '_blank')}>
            <Star size={16} /> Preview
          </button>
          <button className="admin-btn admin-btn-outline icon-left" onClick={() => navigate('/admin/products')}>
            <X size={16} /> Cancel
          </button>
          <button className="admin-btn icon-left" onClick={handleSave}>
            <Save size={16} /> Save Product
          </button>
        </div>
      </div>

      <div className="edit-product-layout">
        <div className="edit-product-main">
          
          <div className="admin-card">
            <h3 className="card-heading">Basic Information</h3>
            <div className="form-group">
              <label>Product Title</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                className="admin-input full-width" 
                placeholder="e.g. Classic White Linen Shirt"
                required 
              />
            </div>
            <div className="form-group">
              <label>Product Description (HTML Supported)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="admin-input full-width"
                rows="8"
                placeholder="Describe your product here..."
              ></textarea>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="card-heading">Pricing & Inventory</h3>
            <div className="form-row">
              <div className="form-group half-width">
                <label>Regular Price (₹)</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">₹</span>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleChange} 
                    className="admin-input full-width" 
                    required 
                  />
                </div>
              </div>
              <div className="form-group half-width">
                <label>Sale Price (₹) <span className="label-optional">Optional</span></label>
                <div className="input-with-prefix">
                  <span className="input-prefix">₹</span>
                  <input 
                    type="number" 
                    name="salePrice" 
                    value={formData.salePrice} 
                    onChange={handleChange} 
                    className="admin-input full-width" 
                  />
                </div>
              </div>
            </div>
            <div className="form-row mt-3">
              <div className="form-group half-width">
                <label>SKU (Stock Keeping Unit)</label>
                <input 
                  type="text" 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleChange} 
                  className="admin-input full-width" 
                />
              </div>
              <div className="form-group half-width">
                <label>Stock Status</label>
                <select 
                  name="stockStatus" 
                  value={formData.stockStatus} 
                  onChange={handleChange} 
                  className="admin-select full-width"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        <div className="edit-product-sidebar">
          
          <div className="admin-card">
            <h3 className="card-heading">Organisation</h3>
            <div className="form-group">
              <label>Category</label>
              <input 
                type="text" 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                className="admin-input full-width" 
                placeholder="e.g. Sarees"
              />
            </div>
          </div>

          <div className="admin-card">
            <h3 className="card-heading">Product Media</h3>
            
            <label className="sub-label">Featured Image</label>
            <div
              className={`image-upload-zone ${draggingMain ? 'dragging' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => mainUploadRef.current.click()}
            >
              {formData.image ? (
                <div className="upload-preview-main">
                  <img src={formData.image} alt="Featured" />
                  <div className="upload-overlay">
                    <UploadCloud size={24} />
                    <span>Replace Image</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <ImageIcon size={32} className="upload-icon-svg" />
                  <p>Drag & drop or <strong>browse</strong></p>
                  <p className="upload-hint">High resolution images recommended</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={mainUploadRef}
                style={{ display: 'none' }}
                onChange={(e) => handleMainImageUpload(e.target.files)}
              />
            </div>

            <label className="sub-label mt-4">Image Gallery</label>
            <div className="gallery-grid">
              {formData.images.map((img, index) => (
                <div key={index} className={`gallery-thumb ${index === 0 ? 'gallery-thumb-main' : ''}`}>
                  <img src={img} alt={`Gallery ${index + 1}`} />
                  {index === 0 && <div className="gallery-main-badge">Featured</div>}
                  <div className="gallery-thumb-actions">
                    {index !== 0 && (
                      <button type="button" title="Set as featured" onClick={(e) => { e.stopPropagation(); setAsMain(index); }}>
                        <Star size={12} />
                      </button>
                    )}
                    <button type="button" title="Remove" className="gallery-remove" onClick={(e) => { e.stopPropagation(); removeGalleryImage(index); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="gallery-add-btn" onClick={() => galleryUploadRef.current.click()}>
                <PlusIcon />
                <span>Add</span>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              ref={galleryUploadRef}
              style={{ display: 'none' }}
              onChange={(e) => handleGalleryUpload(e.target.files)}
            />

            <div className="form-divider"></div>
            
            <div className="form-group">
              <label>Or provide image URL</label>
              <input
                type="text"
                name="image"
                value={formData.image.startsWith('data:') ? '' : formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="admin-input full-width"
              />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

// Helper component for the plus icon
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default EditProduct;
