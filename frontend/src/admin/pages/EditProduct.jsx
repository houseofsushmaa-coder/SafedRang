import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import { adminService } from "../adminService";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { optimizeImageForUpload } from "../../utils/imageOptimizer";
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
  Loader2,
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
  const [draggingGallery, setDraggingGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

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

  // ── Badges from API ────────────────────────────────────────────────
  const [badges, setBadges] = useState([]);
  const [newBadgeName, setNewBadgeName] = useState("");

  useEffect(() => {
    adminService.getBadges()
      .then((b) => setBadges(b || []))
      .catch(() => setBadges([]));
  }, []);

  const badgeOptions = badges.length > 0
    ? [...new Set(badges.map((b) => b.name))]
    : ["One of One", "Best Seller", "New Arrival", "Limited Edition", "Handcrafted", "Trending"];

  const [formData, setFormData] = useState({
    title: "",
    category: "Sarees",
    price: "",
    salePrice: "",
    sku: "",
    stock: "1",
    stockStatus: "In Stock",
    image: "",
    images: [],
    description: "",
    productType: "simple",
    attributeName: "Size",
    variations: [],
    badge: "",
    craft: "",
    fabric: "",
    subcategory: "",
    isOneOfOne: false,
    isArchived: false,
    needsReview: false,
    displayOrder: 0,
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
          stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : "1",
          stockStatus: product.stockStatus || "In Stock",
          image: product.image || "",
          images: product.images || (product.image ? [product.image] : []),
          description: rawDesc,
          productType: product.productType || "simple",
          attributeName: product.attributeName || "Size",
          variations: product.variations || [],
          badge: product.badge || (product.isOneOfOne ? "One of One" : ""),
          isOneOfOne: Boolean(product.isOneOfOne || product.badge === "One of One"),
          isArchived: Boolean(product.isArchived),
          craft: product.craft || "",
          fabric: product.fabric || "",
          subcategory: product.subcategory || "",
          needsReview: Boolean(product.needsReview),
          displayOrder: product.displayOrder ?? product.display_order ?? 0,
        });
      }
    }
  }, [id, isNew, products, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "stock") {
      const qty = parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        stock: value,
        stockStatus: !isNaN(qty) && qty <= 0 ? "Out of Stock" : (prev.stockStatus === "Out of Stock" ? "In Stock" : prev.stockStatus),
      }));
      return;
    }
    if (name === "stockStatus") {
      setFormData((prev) => ({
        ...prev,
        stockStatus: value,
        stock: value === "Out of Stock" ? "0" : (Number(prev.stock) <= 0 ? "1" : prev.stock),
      }));
      return;
    }
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

  // Upload a single file to Supabase Storage with in-browser optimization and retry
  const uploadToStorage = async (rawFile, retries = 2) => {
    // 1. Optimize image in-browser: downscales oversized images, ensures <1MB, removes all size limit failures
    let file = rawFile;
    try {
      file = await optimizeImageForUpload(rawFile, 2400, 0.90);
    } catch (e) {
      console.warn("Client-side image optimization skipped/failed, uploading original:", e);
      file = rawFile;
    }

    const rawExt = file.name ? file.name.split(".").pop().toLowerCase() : "jpg";
    const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "jpg";
    const cleanName = (file.name || "image")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const fileName = `${Date.now()}_${cleanName}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filePath = `products/${fileName}`;

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { error } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type || "image/jpeg",
            cacheControl: "3600",
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        if (!data?.publicUrl) {
          throw new Error("Unable to retrieve public image URL from storage.");
        }

        return data.publicUrl;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          // Wait 600ms before retrying
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error("Failed to upload image.");
  };

  /**
   * Upload multiple images with batch progress and error resilience
   * @param {FileList|File[]} fileList
   * @param {boolean} isMainTrigger - whether triggered from the Featured/Main dropzone
   */
  const handleUploadImages = async (fileList, isMainTrigger = false) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((f) => f && f.type && f.type.startsWith("image/"));
    if (!files.length) {
      toast.error("Please select valid image files (JPG, PNG, WebP).");
      return;
    }

    setUploading(true);
    const total = files.length;
    setUploadProgress({ current: 0, total, name: files[0].name });

    const uploadedUrls = [];
    let failureCount = 0;

    for (let i = 0; i < total; i++) {
      const currentFile = files[i];
      setUploadProgress({ current: i + 1, total, name: currentFile.name });

      try {
        const url = await uploadToStorage(currentFile);
        if (url) {
          uploadedUrls.push(url);
        }
      } catch (err) {
        console.error(`Error uploading ${currentFile.name}:`, err);
        failureCount++;
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData((prev) => {
        const currentList = Array.isArray(prev.images) ? [...prev.images] : [];
        const mergedImages = [...currentList];

        uploadedUrls.forEach((u) => {
          if (!mergedImages.includes(u)) {
            mergedImages.push(u);
          }
        });

        // If triggered from Featured dropzone, make the first uploaded image the featured one
        let newMain = prev.image;
        if (isMainTrigger && uploadedUrls[0]) {
          newMain = uploadedUrls[0];
          const withoutMain = mergedImages.filter((u) => u !== newMain);
          mergedImages.length = 0;
          mergedImages.push(newMain, ...withoutMain);
        } else if (!newMain && mergedImages.length > 0) {
          newMain = mergedImages[0];
        }

        return {
          ...prev,
          image: newMain,
          images: mergedImages,
        };
      });

      if (failureCount === 0) {
        toast.success(
          total === 1
            ? "Image uploaded successfully!"
            : `All ${total} images uploaded successfully!`
        );
      } else {
        toast.success(
          `Uploaded ${uploadedUrls.length} image(s). (${failureCount} failed)`
        );
      }
    } else {
      toast.error("Failed to upload image(s). Please check your internet connection.");
    }

    setUploading(false);
    setUploadProgress(null);
  };

  const handleMainImageUpload = (files) => {
    handleUploadImages(files, true);
  };

  const handleGalleryUpload = (files) => {
    handleUploadImages(files, false);
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

  const onDragOverMain = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingMain(true);
  };
  const onDragLeaveMain = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingMain(false);
  };
  const onDropMain = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingMain(false);
    if (e.dataTransfer?.files?.length) {
      handleUploadImages(e.dataTransfer.files, true);
    }
  };

  const onDragOverGallery = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingGallery(true);
  };
  const onDragLeaveGallery = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingGallery(false);
  };
  const onDropGallery = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingGallery(false);
    if (e.dataTransfer?.files?.length) {
      handleUploadImages(e.dataTransfer.files, false);
    }
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

  // Quick-fill helpers for common variation sets
  const populateBlouseSizes = () => {
    setFormData((prev) => ({
      ...prev,
      variations: [
        ...(prev.variations || []),
        ...["36", "38", "40", "42", "44"].map((s) => ({ size: s, stock: 1, priceModifier: 0 })),
      ],
    }));
  };

  const populateStandardSizes = () => {
    setFormData((prev) => ({
      ...prev,
      variations: [
        ...(prev.variations || []),
        ...["XS", "S", "M", "L", "XL", "XXL"].map((s) => ({ size: s, stock: 1, priceModifier: 0 })),
      ],
    }));
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
      badge: formData.badge && formData.badge !== "__new__" ? formData.badge : (formData.isOneOfOne ? "One of One" : null),
      isOneOfOne: formData.badge === "One of One" || Boolean(formData.isOneOfOne),
      isArchived: Boolean(formData.isArchived),
      needsReview: Boolean(formData.needsReview),
      displayOrder: parseInt(formData.displayOrder, 10) || 0,
      display_order: parseInt(formData.displayOrder, 10) || 0,
      price: parseFloat(formData.price) || 0,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
      stock:
        formData.productType === "variable"
          ? formData.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
          : (formData.stock !== undefined && formData.stock !== null && formData.stock !== "")
          ? Math.max(0, parseInt(formData.stock, 10))
          : (formData.stockStatus === "Out of Stock" ? 0 : 1),
      stockStatus:
        formData.productType === "variable"
          ? formData.stockStatus
          : (Number(formData.stock) <= 0 || formData.stockStatus === "Out of Stock")
          ? "Out of Stock"
          : (formData.stockStatus || "In Stock"),
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
      alert(`Failed to save product: ${err.message || "Please check your network or inputs."}`);
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

            {/* ── Craft, Fabric, Subcategory ── */}
            <div className="form-row mt-3">
              <div className="form-group half-width">
                <label>Artisan Craft</label>
                <input
                  type="text"
                  name="craft"
                  value={formData.craft}
                  onChange={handleChange}
                  className="admin-input full-width"
                  placeholder="e.g. Lucknowi Chikankari, Zardozi, Gota Patti"
                  list="craft-suggestions"
                />
                <datalist id="craft-suggestions">
                  <option value="Lucknowi Chikankari" />
                  <option value="Handcrafted Chikankari" />
                  <option value="Handcrafted" />
                  <option value="Zardozi" />
                  <option value="Gota Patti" />
                </datalist>
              </div>
              <div className="form-group half-width">
                <label>Fabric / Material</label>
                <input
                  type="text"
                  name="fabric"
                  value={formData.fabric}
                  onChange={handleChange}
                  className="admin-input full-width"
                  placeholder="e.g. Silk, Chanderi Silk, Georgette, Cotton"
                  list="fabric-suggestions"
                />
                <datalist id="fabric-suggestions">
                  <option value="Silk" />
                  <option value="Chanderi Silk" />
                  <option value="Mul Chanderi" />
                  <option value="Georgette" />
                  <option value="Viscose Georgette" />
                  <option value="Cotton" />
                  <option value="Muslin Cotton" />
                  <option value="Organza" />
                  <option value="Kota" />
                </datalist>
              </div>
            </div>
            <div className="form-group">
              <label>Subcategory <span className="label-optional">Optional</span></label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="admin-input full-width"
                placeholder="e.g. Chikankari, Zardozi, Bridal, Ready to Wear"
              />
              <p className="field-hint">Used for fine-grained shop filtering (e.g. Sarees → Chikankari).</p>
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
                  <label>Stock Quantity (Units Available)</label>
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="admin-input full-width"
                    placeholder="e.g. 1"
                  />
                </div>
              )}
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

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: 14 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline icon-left"
                  onClick={addVariation}
                >
                  <Plus size={14} /> Add Size
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline icon-left"
                  onClick={populateBlouseSizes}
                  title="Auto-fill blouse numeric sizes: 36, 38, 40, 42, 44"
                >
                  <Layers size={14} /> Quick Blouse Sizes (36–44)
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline icon-left"
                  onClick={populateStandardSizes}
                  title="Auto-fill standard sizes: XS, S, M, L, XL, XXL"
                >
                  <Layers size={14} /> Standard Sizes (XS–XXL)
                </button>
              </div>

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

            <div className="form-group" style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--admin-border)" }}>
              <label htmlFor="badge-select">BADGES</label>
              <div className="cat-select-wrap">
                <select
                  id="badge-select"
                  name="badge"
                  value={formData.badge || (formData.isOneOfOne ? "One of One" : "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__new__") {
                      setFormData((prev) => ({ ...prev, badge: "__new__" }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        badge: val,
                        isOneOfOne: val === "One of One",
                      }));
                    }
                  }}
                  className="admin-input full-width admin-select-native"
                >
                  <option value="">Select badge</option>
                  {badgeOptions.map((bName) => (
                    <option key={bName} value={bName}>{bName}</option>
                  ))}
                  <option value="__new__">+ Add new badge…</option>
                </select>
                <ChevronDown size={14} className="cat-select-chevron" />
              </div>

              {/* Inline new badge input */}
              {formData.badge === "__new__" && (
                <div className="new-cat-row" style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="New badge name…"
                    value={newBadgeName}
                    onChange={(e) => setNewBadgeName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && newBadgeName.trim()) {
                        const name = newBadgeName.trim();
                        try {
                          await adminService.saveBadge({ name });
                        } catch (err) {}
                        setBadges((prev) => [...prev, { id: `badge_${Date.now()}`, name }]);
                        setFormData((prev) => ({ ...prev, badge: name, isOneOfOne: name === "One of One" }));
                        setNewBadgeName("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="admin-btn icon-left"
                    style={{ padding: "8px 14px", fontSize: "0.8rem" }}
                    onClick={async () => {
                      if (!newBadgeName.trim()) return;
                      const name = newBadgeName.trim();
                      try {
                        await adminService.saveBadge({ name });
                      } catch (err) {}
                      setBadges((prev) => [...prev, { id: `badge_${Date.now()}`, name }]);
                      setFormData((prev) => ({ ...prev, badge: name, isOneOfOne: name === "One of One" }));
                      setNewBadgeName("");
                    }}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              )}

              <p className="field-hint">
                Manage all badges in the{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => window.open("/admin/categories?tab=badges", "_blank")}
                >
                  Badges page
                </button>
              </p>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label htmlFor="display-order-input">SHOP DISPLAY PRIORITY</label>
              <input
                id="display-order-input"
                type="number"
                min="0"
                step="1"
                name="displayOrder"
                value={formData.displayOrder ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                  setFormData((prev) => ({ ...prev, displayOrder: isNaN(val) ? "" : val }));
                }}
                placeholder="0 (Standard priority)"
                className="admin-input full-width"
              />
              <p className="field-hint">
                Lower numbers appear first on the shop page (e.g. 1 is top priority). 0 or empty for standard ordering.
              </p>
            </div>

            <div className="form-group" style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--admin-border)" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--admin-text-main)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Catalogue Status &amp; Visibility
              </label>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                <input
                  id="product-is-archived"
                  type="checkbox"
                  checked={Boolean(formData.isArchived)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isArchived: e.target.checked }))}
                  style={{ width: "18px", height: "18px", accentColor: "#6E1E2A", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <label htmlFor="product-is-archived" style={{ fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", display: "inline-block", margin: 0 }}>
                    Archive this product
                  </label>
                  <p className="field-hint" style={{ margin: 0, fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>
                    Archived pieces are hidden from the storefront shop and cannot be purchased, but remain editable and restorable here.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <input
                  id="product-needs-review"
                  type="checkbox"
                  checked={Boolean(formData.needsReview)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, needsReview: e.target.checked }))}
                  style={{ width: "18px", height: "18px", accentColor: "#d97706", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <label htmlFor="product-needs-review" style={{ fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", display: "inline-block", margin: 0 }}>
                    Needs Review / Missing Info
                  </label>
                  <p className="field-hint" style={{ margin: 0, fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>
                    Flag this piece if it needs replacement photos, price confirmation, or description updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="card-header-row">
              <h3 className="card-heading" style={{ margin: 0 }}>Product Media</h3>
              <button
                type="button"
                className="admin-btn-secondary-sm"
                onClick={() => galleryUploadRef.current?.click()}
                disabled={uploading}
                title="Select all product images from your computer at once"
              >
                + Select All Images
              </button>
            </div>

            {uploadProgress && (
              <div className="upload-progress-container">
                <div className="upload-progress-info">
                  <span className="upload-progress-label">
                    Uploading image {uploadProgress.current} of {uploadProgress.total}...
                  </span>
                  <span className="upload-progress-pct">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                  </span>
                </div>
                <div className="upload-progress-track">
                  <div
                    className="upload-progress-fill"
                    style={{
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="upload-progress-filename" title={uploadProgress.name}>
                  {uploadProgress.name}
                </p>
              </div>
            )}

            <label className="sub-label">Featured Image</label>
            <div
              className={`image-upload-zone ${draggingMain ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
              onDragOver={onDragOverMain}
              onDragLeave={onDragLeaveMain}
              onDrop={onDropMain}
              onClick={() => !uploading && mainUploadRef.current?.click()}
            >
              {uploading && (
                <div className="upload-active-state">
                  <Loader2 size={32} className="upload-spinner-icon" />
                  <p className="upload-active-text">Processing &amp; Optimizing Images...</p>
                  <p className="upload-active-sub">Auto-scaling large photos to HD luxury quality</p>
                </div>
              )}
              {!uploading && (
                formData.image ? (
                  <div className="upload-preview-main">
                    <img src={formData.image} alt="Featured" />
                    <div className="upload-overlay">
                      <UploadCloud size={24} />
                      <span>Change Featured or Add More</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <ImageIcon size={32} className="upload-icon-svg" />
                    <p>
                      Drag &amp; drop or <strong>browse files</strong>
                    </p>
                    <p className="upload-hint">
                      Select all images at once &bull; No size limit (Auto-optimized)
                    </p>
                  </div>
                )
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                ref={mainUploadRef}
                style={{ display: "none" }}
                onClick={(e) => { e.target.value = null; }}
                onChange={(e) => handleMainImageUpload(e.target.files)}
              />
            </div>

            <div className="gallery-header-row mt-4">
              <label className="sub-label" style={{ margin: 0 }}>
                Image Gallery ({formData.images.length})
              </label>
              <button
                type="button"
                className="gallery-add-link"
                onClick={() => galleryUploadRef.current?.click()}
                disabled={uploading}
              >
                + Add / Select All
              </button>
            </div>

            <div
              className={`gallery-grid ${draggingGallery ? "dragging" : ""}`}
              onDragOver={onDragOverGallery}
              onDragLeave={onDragLeaveGallery}
              onDrop={onDropGallery}
            >
              {formData.images.map((img, index) => (
                <div
                  key={`${img}-${index}`}
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
                onClick={() => !uploading && galleryUploadRef.current?.click()}
                title="Select multiple images"
              >
                <PlusIcon />
                <span>Add All</span>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              ref={galleryUploadRef}
              style={{ display: "none" }}
              onClick={(e) => { e.target.value = null; }}
              onChange={(e) => handleGalleryUpload(e.target.files)}
            />

              <div className="form-divider"></div>

            <div className="form-group">
              <label>Or provide image URL</label>
              <input
                type="text"
                name="image"
                value={(formData.image || "").startsWith("data:") ? "" : (formData.image || "")}
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
