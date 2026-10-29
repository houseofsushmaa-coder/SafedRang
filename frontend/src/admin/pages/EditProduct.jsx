import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import { adminService } from "../adminService";
import { supabase } from "../../lib/supabase";
import {
  Save,
  X,
  Image as ImageIcon,
  UploadCloud,
  Star,
  Trash2,
  Plus,
  Layers,
  ChevronDown,
} from "lucide-react";
import "./AdminPages.css";
import "./EditProduct.css";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct, addProduct, loading } = useProducts();
  const isNew = id === "new" || !id;
  const mainUploadRef = useRef(null);
  const galleryUploadRef = useRef(null);
  const [draggingMain, setDraggingMain] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Categories from API ────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    setCatLoading(true);
    adminService.getCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, []);

  // Derived flat list of category names for dropdown
  const catOptions = categories.length > 0
    ? [...new Set(categories.flatMap((c) => [c.name, ...(c.children || []).map((ch) => ch.name)]))]
    : [
        "Sarees", "Dupattas", "Kurta Set", "Blouse",
        "Stole", "Suit Set", "Uncategorized",
      ];

  const [formData, setFormData] = useState({
    title: "",
    category: "Sarees",
    price: "",
    salePrice: "",
    sku: "",
    stockStatus: "In Stock",
    image: "",
    images: [],
    description: "",
    productType: "simple",
    attributeName: "Size",
    variations: [],
  });

  useEffect(() => {
    if (!isNew && !loading && products.length > 0) {
      const product = products.find((p) => p.id === id);
      if (product) {
        let rawDesc = product.description || "";

        setFormData({
          title: product.title || "",
          category: product.category || "Sarees",
          price: product.price || "",
          salePrice: product.salePrice || "",
          sku: product.sku || "",
          stockStatus: product.stockStatus || "In Stock",
          image: product.image || "",
          images: product.images || (product.image ? [product.image] : []),
          description: rawDesc,
          productType: product.productType || "simple",
          attributeName: product.attributeName || "Size",
          variations: product.variations || [],
        });
      }
    }
  }, [id, isNew, products, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "image") {
      setFormData((prev) => {
        const remaining = (prev.images || []).filter((img) => img !== prev.image && img !== value);
        return {
          ...prev,
          image: value,
          images: value ? [value, ...remaining] : remaining,
        };
      });
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload a single file to Supabase Storage and return its public URL
  const uploadToStorage = async (file) => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (error) throw error;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleMainImageUpload = async (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadToStorage(file);
      setFormData((prev) => {
        const remaining = (prev.images || []).filter((img) => img !== prev.image && img !== url);
        return {
          ...prev,
          image: url,
          images: [url, ...remaining],
        };
      });
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(imageFiles.map(uploadToStorage));
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
        image: prev.image || urls[0] || "",
      }));
    } catch (err) {
      console.error("Gallery upload failed:", err);
      alert("Gallery upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      const newMain = updated[0] || "";
      return { ...prev, images: updated, image: newMain };
    });
  };

  const setAsMain = (index) => {
    setFormData((prev) => {
      const reordered = [
        prev.images[index],
        ...prev.images.filter((_, i) => i !== index),
      ];
      return { ...prev, images: reordered, image: reordered[0] };
    });
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDraggingMain(true);
  };
  const onDragLeave = () => setDraggingMain(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDraggingMain(false);
    handleMainImageUpload(e.dataTransfer.files);
  };

  // ── Variation helpers ──────────────────────────────────────
  const addVariation = () => {
    setFormData((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        { size: "", stock: 1, priceModifier: 0 },
      ],
    }));
  };

  const removeVariation = (index) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  const updateVariation = (index, field, value) => {
    setFormData((prev) => {
      const updated = prev.variations.map((v, i) =>
        i === index ? { ...v, [field]: value } : v,
      );
      return { ...prev, variations: updated };
    });
  };
  // ──────────────────────────────────────────────────────────

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a product title.");
      return;
    }
    if (!formData.price) {
      alert("Please enter a base regular price.");
      return;
    }
    if (
      formData.productType === "variable" &&
      formData.variations.length === 0
    ) {
      alert("Please add at least one variation.");
      return;
    }

    setSaving(true);
    const rawImages = Array.isArray(formData.images)
      ? formData.images.filter(Boolean)
      : formData.image
      ? [formData.image]
      : [];
    const primaryImage = formData.image || rawImages[0] || "";
    const syncedImages = primaryImage
      ? [primaryImage, ...rawImages.filter((x) => x !== primaryImage)]
      : rawImages;

    const payload = {
      ...formData,
      image: primaryImage,
      images: syncedImages,
      price: parseFloat(formData.price) || 0,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
      stock:
        formData.productType === "variable"
          ? formData.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
          : formData.stockStatus === "In Stock"
          ? 10
          : 0,
    };

    try {
      if (isNew) {
        await addProduct(payload);
      } else {
        await updateProduct(id, payload);
      }
      navigate("/admin/products");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && loading) {
    return (
      <div className="admin-loading-state">Loading product details...</div>
    );
  }

  const isVariable = formData.productType === "variable";

  return (
    <div className="admin-page edit-product-page">
      <div className="page-header">
        <div>
          <h2>
            {isNew
              ? formData.title || "Add New Product"
              : formData.title || "Edit Product"}
          </h2>
          <p className="page-subtitle">
            {isNew
              ? "Enter product information, pricing, and media to list in your store."
              : "Make changes to product information, pricing, and media."}
          </p>
        </div>
        <div className="header-actions">
          {!isNew && (
            <button
              className="admin-btn admin-btn-outline icon-left"
              onClick={() => window.open(`/product/${id}`, "_blank")}
            >
              <Star size={16} /> Preview
            </button>
          )}
          <button
            className="admin-btn admin-btn-outline icon-left"
            onClick={() => navigate("/admin/products")}
          >
            <X size={16} /> Cancel
          </button>
          <button
            className="admin-btn icon-left"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            <Save size={16} />
            {uploading ? "Uploading image…" : saving ? "Saving…" : isNew ? "Create Product" : "Save Product"}
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

          {/* ── Product Type ────────────────────────────────── */}
          <div className="admin-card">
            <h3 className="card-heading">Product Type</h3>
            <div className="form-row">
              <label
                className={`product-type-option ${formData.productType === "simple" ? "selected" : ""}`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, productType: "simple" }))
                }
              >
                <input
                  type="radio"
                  name="productType"
                  value="simple"
                  checked={formData.productType === "simple"}
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                <span className="product-type-label">Simple Product</span>
                <span className="product-type-desc">Single SKU, fixed price — no size or colour choices</span>
              </label>

              <label
                className={`product-type-option ${formData.productType === "variable" ? "selected" : ""}`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, productType: "variable" }))
                }
              >
                <input
                  type="radio"
                  name="productType"
                  value="variable"
                  checked={formData.productType === "variable"}
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                <span className="product-type-label">
                  <Layers size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Variable Product
                </span>
                <span className="product-type-desc">Multiple sizes / colours — each with its own stock</span>
              </label>
            </div>
          </div>

          {/* ── Pricing & Inventory ─────────────────────────── */}
          <div className="admin-card">
            <h3 className="card-heading">Pricing &amp; Inventory</h3>
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
                    required={!isVariable}
                    placeholder={isVariable ? "Set per variation" : ""}
                  />
                </div>
              </div>
              <div className="form-group half-width">
                <label>
                  Sale Price (₹){" "}
                  <span className="label-optional">Optional</span>
                </label>
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
              {!isVariable && (
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
              )}
            </div>
          </div>

          {/* ── Variations ──────────────────────────────────── */}
          {isVariable && (
            <div className="admin-card">
              <h3 className="card-heading">Variations</h3>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Attribute Name</label>
                <input
                  type="text"
                  name="attributeName"
                  value={formData.attributeName}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="e.g. Size, Colour, Style"
                  style={{ maxWidth: 240 }}
                />
              </div>

              {formData.variations.length > 0 && (
                <div className="variation-table-wrap">
                  <table className="variation-table">
                    <thead>
                      <tr>
                        <th>{formData.attributeName || "Attribute"}</th>
                        <th>Stock Qty</th>
                        <th>Price Adj. (₹)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variations.map((v, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className="admin-input full-width"
                              placeholder="e.g. S / M / L / Red"
                              value={v.size}
                              onChange={(e) =>
                                updateVariation(idx, "size", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="admin-input full-width"
                              min="0"
                              value={v.stock}
                              onChange={(e) =>
                                updateVariation(idx, "stock", parseInt(e.target.value) || 0)
                              }
                            />
                          </td>
                          <td>
                            <div className="input-with-prefix">
                              <span className="input-prefix">₹</span>
                              <input
                                type="number"
                                className="admin-input full-width"
                                placeholder="0"
                                value={v.priceModifier}
                                onChange={(e) =>
                                  updateVariation(idx, "priceModifier", parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="variation-remove-btn"
                              title="Remove variation"
                              onClick={() => removeVariation(idx)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                type="button"
                className="admin-btn admin-btn-outline icon-left mt-3"
                onClick={addVariation}
                style={{ marginTop: 12 }}
              >
                <Plus size={14} /> Add Variation
              </button>

              {formData.variations.length > 0 && (
                <p className="variation-hint">
                  Total stock:{" "}
                  <strong>
                    {formData.variations.reduce((s, v) => s + (Number(v.stock) || 0), 0)}
                  </strong>{" "}
                  units across {formData.variations.length} variation
                  {formData.variations.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="edit-product-sidebar">
          <div className="admin-card">
            <h3 className="card-heading">Organisation</h3>
            <div className="form-group">
              <label>Category</label>
              <div className="cat-select-wrap">
                {catLoading ? (
                  <select className="admin-input full-width admin-select-native" disabled>
                    <option>Loading categories…</option>
                  </select>
                ) : (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="admin-input full-width admin-select-native"
                  >
                    <option value="">— Select a category —</option>
                    {catOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__new__">+ Add new category…</option>
                  </select>
                )}
                <ChevronDown size={14} className="cat-select-chevron" />
              </div>
              {/* Inline new category input */}
              {formData.category === "__new__" && (
                <div className="new-cat-row">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="New category name…"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCatName.trim()) {
                        const name = newCatName.trim();
                        setCategories((prev) => [...prev, { id: `cat_new_${Date.now()}`, name }]);
                        setFormData((prev) => ({ ...prev, category: name }));
                        setNewCatName("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="admin-btn icon-left"
                    style={{ padding: "8px 14px", fontSize: "0.8rem" }}
                    onClick={() => {
                      if (!newCatName.trim()) return;
                      const name = newCatName.trim();
                      setCategories((prev) => [...prev, { id: `cat_new_${Date.now()}`, name }]);
                      setFormData((prev) => ({ ...prev, category: name }));
                      setNewCatName("");
                    }}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              )}
              <p className="field-hint">
                Manage all categories in the{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => window.open("/admin/categories", "_blank")}
                >
                  Categories page
                </button>
              </p>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="card-heading">Product Media</h3>

            <label className="sub-label">Featured Image</label>
            <div
              className={`image-upload-zone ${draggingMain ? "dragging" : ""}`}
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
                  <p>
                    Drag &amp; drop or <strong>browse</strong>
                  </p>
                  <p className="upload-hint">
                    High resolution images recommended
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={mainUploadRef}
                style={{ display: "none" }}
                onChange={(e) => handleMainImageUpload(e.target.files)}
              />
            </div>

            <label className="sub-label mt-4">Image Gallery</label>
            <div className="gallery-grid">
              {formData.images.map((img, index) => (
                <div
                  key={index}
                  className={`gallery-thumb ${index === 0 ? "gallery-thumb-main" : ""}`}
                >
                  <img src={img} alt={`Gallery ${index + 1}`} />
                  {index === 0 && (
                    <div className="gallery-main-badge">Featured</div>
                  )}
                  <div className="gallery-thumb-actions">
                    {index !== 0 && (
                      <button
                        type="button"
                        title="Set as featured"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsMain(index);
                        }}
                      >
                        <Star size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Remove"
                      className="gallery-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGalleryImage(index);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <div
                className="gallery-add-btn"
                onClick={() => galleryUploadRef.current.click()}
              >
                <PlusIcon />
                <span>Add</span>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              ref={galleryUploadRef}
              style={{ display: "none" }}
              onChange={(e) => handleGalleryUpload(e.target.files)}
            />

            <div className="form-divider"></div>

            <div className="form-group">
              <label>Or provide image URL</label>
              <input
                type="text"
                name="image"
                value={formData.image.startsWith("data:") ? "" : formData.image}
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
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default EditProduct;
