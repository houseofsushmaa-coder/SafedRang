import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import { adminService } from "../adminService";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { optimizeImageForUpload } from "../../utils/imageOptimizer";
import {
  DETAIL_FIELDS,
  emptyDetails,
  parseDescription,
  composeDescription,
} from "../../utils/productDetails";
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
  CheckCircle2,
  Circle,
  Eye,
  Wand2,
  Send,
} from "lucide-react";
import "./AdminPages.css";
import "./EditProduct.css";

// Builds a readable SKU, e.g. "SR-SAR-SURILI-RAAG".
const suggestSku = (title, category) => {
  const cat = (category || "GEN").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "GEN";
  const name = (title || "")
    .replace(/"/g, "")
    .split(/\s+/)
    .slice(0, 3)
    .join("-")
    .replace(/[^a-z0-9-]/gi, "")
    .toUpperCase()
    .slice(0, 18);
  return `SR-${cat}-${name || Date.now().toString(36).toUpperCase()}`;
};

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};

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
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);

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
    : ["Sarees", "Dupattas", "Kurta Sets", "Blouses", "Others"];

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

  // Fabric / craft families already used in the catalogue. These drive the
  // shop filters, so suggesting existing values keeps the filters tidy.
  const { fabricFamilies, craftFamilies } = useMemo(() => {
    const count = (key) => {
      const tally = {};
      products.forEach((p) => {
        const v = (p[key] || "").trim();
        if (v) tally[v] = (tally[v] || 0) + 1;
      });
      return Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([v]) => v);
    };
    return { fabricFamilies: count("fabric"), craftFamilies: count("craft") };
  }, [products]);

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
    intro: "",
    details: emptyDetails(),
    extraDetails: "",
    rawDescription: "",
    useRawDescription: false,
    productType: "simple",
    attributeName: "Size",
    variations: [],
    badge: "",
    craft: "",
    fabric: "",
    subcategory: "",
    isOneOfOne: false,
    isArchived: false,
    isDraft: true,
    needsReview: false,
    displayOrder: 0,
  });

  // Load the product once (not on every catalogue refresh, which would wipe edits).
  const loadedId = useRef(null);
  useEffect(() => {
    if (isNew || loading || products.length === 0 || loadedId.current === id) return;
    const product = products.find((p) => p.id === id);
    if (!product) return;
    loadedId.current = id;
    const parsed = parseDescription(product.description || "");
    setFormData({
      title: product.title || "",
      category: product.category || "Sarees",
      price: product.price || "",
      salePrice: product.salePrice || "",
      sku: product.sku || "",
      stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : "1",
      stockStatus: product.stockStatus || "In Stock",
      image: product.image && !product.image.includes("placeholder") ? product.image : "",
      images: (product.images || (product.image ? [product.image] : [])).filter((u) => u && !u.includes("placeholder")),
      intro: parsed ? parsed.intro : "",
      details: parsed ? parsed.details : emptyDetails(),
      extraDetails: parsed ? parsed.extra.join("\n") : "",
      rawDescription: product.description || "",
      useRawDescription: !parsed,
      productType: product.productType || "simple",
      attributeName: product.attributeName || "Size",
      variations: product.variations || [],
      badge: product.badge || (product.isOneOfOne ? "One of One" : ""),
      isOneOfOne: Boolean(product.isOneOfOne || product.badge === "One of One"),
      isArchived: Boolean(product.isArchived),
      isDraft: Boolean(product.isDraft),
      craft: product.craft || "",
      fabric: product.fabric || "",
      subcategory: product.subcategory || "",
      needsReview: Boolean(product.needsReview),
      displayOrder: product.displayOrder ?? product.display_order ?? 0,
    });
  }, [id, isNew, products, loading]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = (patch) => {
    setDirty(true);
    setFormData((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  };

  const clearError = (name) => {
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDirty(true);
    clearError(name);
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

  const setDetail = (key, value) =>
    update((prev) => ({ details: { ...prev.details, [key]: value } }));

  // One of One pieces are single units: lock stock to 1 and set the badge.
  const setOneOfOne = (on) =>
    update((prev) => ({
      isOneOfOne: on,
      badge: on ? "One of One" : prev.badge === "One of One" ? "" : prev.badge,
      productType: on ? "simple" : prev.productType,
      stock: on ? "1" : prev.stock,
      stockStatus: on ? "In Stock" : prev.stockStatus,
    }));

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

  const description = formData.useRawDescription
    ? formData.rawDescription
    : composeDescription(formData.intro, formData.details, formData.extraDetails.split("\n"));

  const price = toNumber(formData.price);
  const salePrice = formData.salePrice === "" ? NaN : toNumber(formData.salePrice);
  const hasSale = Number.isFinite(salePrice) && salePrice > 0;
  const discountPct = hasSale && price > 0 && salePrice < price ? Math.round(((price - salePrice) / price) * 100) : 0;
  const isVariable = formData.productType === "variable";
  const photoCount = (formData.images || []).filter(Boolean).length || (formData.image ? 1 : 0);

  // What a listing needs before it can go live, and what is merely recommended.
  const checklist = [
    { key: "title", label: "Product name", done: Boolean(formData.title.trim()), required: true },
    { key: "price", label: "Price", done: price > 0, required: true },
    { key: "category", label: "Category", done: Boolean(formData.category && formData.category !== "__new__"), required: true },
    { key: "fabric", label: "Fabric family (shop filter)", done: Boolean(formData.fabric.trim()), required: true },
    { key: "craft", label: "Craft family (shop filter)", done: Boolean(formData.craft.trim()), required: true },
    { key: "image", label: "At least one photo", done: photoCount > 0, required: true },
    { key: "description", label: "Description", done: Boolean(description.trim()), required: false },
    { key: "photos3", label: "3+ photos (front, drape, close-up)", done: photoCount >= 3, required: false },
  ];
  const missingRequired = checklist.filter((c) => c.required && !c.done);
  const canPublish = missingRequired.length === 0;

  const validate = (publish) => {
    const next = {};
    if (!formData.title.trim()) next.title = "Enter a product name.";
    if (!(price > 0)) next.price = "Enter the regular price.";
    if (formData.salePrice !== "" && !(salePrice > 0)) next.salePrice = "Sale price must be a positive number, or leave it empty.";
    else if (hasSale && salePrice >= price) next.salePrice = "Sale price must be lower than the regular price.";
    if (!formData.category || formData.category === "__new__") next.category = "Choose a category.";
    if (isVariable && formData.variations.length === 0) next.variations = "Add at least one size.";
    if (isVariable && formData.variations.some((v) => !String(v.size).trim())) next.variations = "Every size needs a name.";
    const sku = formData.sku.trim();
    if (sku && products.some((p) => p.id !== id && (p.sku || "").trim().toLowerCase() === sku.toLowerCase())) {
      next.sku = "Another product already uses this SKU.";
    }
    if (publish) {
      if (!formData.fabric.trim()) next.fabric = "Required to publish — used by the shop's fabric filter.";
      if (!formData.craft.trim()) next.craft = "Required to publish — used by the shop's craft filter.";
      if (photoCount === 0) next.image = "Add at least one photo before publishing.";
    }
    return next;
  };

  const handleSave = async (mode) => {
    const publish = mode === "publish";
    const found = validate(publish);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(Object.values(found)[0]);
      setTimeout(() => {
        document.querySelector(".ep-field-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
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

    const sku = formData.sku.trim() || suggestSku(formData.title, formData.category);
    const stock = formData.isOneOfOne
      ? Math.min(1, Math.max(0, parseInt(formData.stock, 10) || 0))
      : isVariable
      ? formData.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : formData.stock !== ""
      ? Math.max(0, parseInt(formData.stock, 10) || 0)
      : 1;

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      description,
      craft: formData.craft.trim(),
      fabric: formData.fabric.trim(),
      subcategory: formData.subcategory,
      sku,
      image: primaryImage,
      images: syncedImages,
      productType: formData.isOneOfOne ? "simple" : formData.productType,
      attributeName: formData.attributeName,
      variations: formData.isOneOfOne ? [] : formData.variations,
      badge: formData.badge && formData.badge !== "__new__" ? formData.badge : (formData.isOneOfOne ? "One of One" : null),
      isOneOfOne: formData.badge === "One of One" || Boolean(formData.isOneOfOne),
      isArchived: Boolean(formData.isArchived),
      isDraft: !publish,
      needsReview: Boolean(formData.needsReview),
      displayOrder: parseInt(formData.displayOrder, 10) || 0,
      display_order: parseInt(formData.displayOrder, 10) || 0,
      price,
      salePrice: hasSale ? salePrice : null,
      stock,
      stockStatus: stock <= 0 ? "Out of Stock" : (formData.stockStatus === "Out of Stock" ? "In Stock" : formData.stockStatus || "In Stock"),
    };

    try {
      if (isNew) {
        await addProduct(payload);
      } else {
        await updateProduct(id, payload);
      }
      setDirty(false);
      toast.success(publish ? "Published — now visible in the shop." : "Saved as draft — hidden from the shop.");
      navigate("/admin/products");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(`Could not save: ${err.message || "please check your connection and try again."}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && loading) {
    return (
      <div className="admin-loading-state">Loading product details...</div>
    );
  }

  const isLive = !isNew && !formData.isDraft && !formData.isArchived;
  const statusLabel = formData.isArchived ? "Archived" : isNew || formData.isDraft ? "Draft" : "Live";
  const fieldError = (name) => errors[name] && <p className="ep-field-error" role="alert">{errors[name]}</p>;

  return (
    <div className="admin-page edit-product-page">
      <div className="page-header">
        <div>
          <h2 className="ep-title-row">
            {formData.title || (isNew ? "New Product" : "Edit Product")}
            <span className={`ep-status-pill ep-status-${statusLabel.toLowerCase()}`}>{statusLabel}</span>
          </h2>
          <p className="page-subtitle">
            {isLive
              ? "This product is live in the shop. Changes appear as soon as you save."
              : "Drafts are saved but hidden from the shop until you publish."}
          </p>
        </div>
        <div className="header-actions">
          {isLive && (
            <button
              className="admin-btn admin-btn-outline icon-left"
              onClick={() => window.open(`/product/${id}`, "_blank")}
            >
              <Eye size={16} /> View in shop
            </button>
          )}
          <button
            className="admin-btn admin-btn-outline icon-left"
            onClick={() => {
              if (dirty && !window.confirm("Discard your unsaved changes?")) return;
              navigate("/admin/products");
            }}
          >
            <X size={16} /> Cancel
          </button>
          <button
            className="admin-btn admin-btn-outline icon-left"
            onClick={() => handleSave("draft")}
            disabled={saving || uploading}
            title="Save without showing it in the shop"
          >
            <Save size={16} /> {isLive ? "Unpublish & save draft" : "Save draft"}
          </button>
          <button
            className="admin-btn icon-left"
            onClick={() => handleSave("publish")}
            disabled={saving || uploading}
            title={canPublish ? "" : `Still needed: ${missingRequired.map((c) => c.label).join(", ")}`}
          >
            <Send size={16} />
            {uploading ? "Uploading image…" : saving ? "Saving…" : isLive ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>

      <div className="edit-product-layout">
        <div className="edit-product-main">
          {/* ── 1. Basics ─────────────────────────────────── */}
          <div className="admin-card">
            <h3 className="card-heading"><span className="ep-step">1</span> Basics</h3>
            <div className="form-group">
              <label htmlFor="ep-title">Product name</label>
              <input
                id="ep-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`admin-input full-width ${errors.title ? "has-error" : ""}`}
                placeholder={'e.g. "Surili Raag" glass organza silk saree with zardozi work'}
              />
              <p className="field-hint">Piece name in quotes, then fabric, type and work — the format the shop already uses.</p>
              {fieldError("title")}
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="ep-category">Category</label>
                <div className="cat-select-wrap">
                  {catLoading ? (
                    <select className="admin-input full-width admin-select-native" disabled>
                      <option>Loading categories…</option>
                    </select>
                  ) : (
                    <select
                      id="ep-category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`admin-input full-width admin-select-native ${errors.category ? "has-error" : ""}`}
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
                {formData.category === "__new__" && (
                  <div className="new-cat-row">
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="New category name…"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <button
                      type="button"
                      className="admin-btn icon-left"
                      style={{ padding: "8px 14px", fontSize: "0.8rem" }}
                      onClick={() => {
                        if (!newCatName.trim()) return;
                        const name = newCatName.trim();
                        setCategories((prev) => [...prev, { id: `cat_new_${Date.now()}`, name }]);
                        update({ category: name });
                        setNewCatName("");
                      }}
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                )}
                {fieldError("category")}
              </div>
              <div className="form-group half-width">
                <label htmlFor="ep-subcategory">Subcategory <span className="label-optional">Optional</span></label>
                <input
                  id="ep-subcategory"
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="admin-input full-width"
                  placeholder="e.g. Bridal, Ready to Wear"
                />
              </div>
            </div>

            <div className="ep-toggle-row">
              <label className="ep-switch">
                <input
                  type="checkbox"
                  checked={formData.isOneOfOne}
                  onChange={(e) => setOneOfOne(e.target.checked)}
                />
                <span className="ep-switch-track" aria-hidden="true" />
                <span>
                  <strong>One of One piece</strong>
                  <span className="field-hint ep-inline-hint">
                    A single unit: stock is fixed at 1, the One of One badge is added, and it appears in the One of One edit.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* ── 2. Details ────────────────────────────────── */}
          <div className="admin-card">
            <h3 className="card-heading"><span className="ep-step">2</span> Details</h3>

            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="ep-fabric">Fabric family <span className="label-optional">Shop filter</span></label>
                <input
                  id="ep-fabric"
                  type="text"
                  name="fabric"
                  value={formData.fabric}
                  onChange={handleChange}
                  className={`admin-input full-width ${errors.fabric ? "has-error" : ""}`}
                  placeholder="e.g. Organza"
                  list="fabric-families"
                />
                <datalist id="fabric-families">
                  {fabricFamilies.map((f) => <option key={f} value={f} />)}
                </datalist>
                <p className="field-hint">Pick an existing family so the shop filter stays tidy. Exact fabric goes below.</p>
                {fieldError("fabric")}
              </div>
              <div className="form-group half-width">
                <label htmlFor="ep-craft">Craft family <span className="label-optional">Shop filter</span></label>
                <input
                  id="ep-craft"
                  type="text"
                  name="craft"
                  value={formData.craft}
                  onChange={handleChange}
                  className={`admin-input full-width ${errors.craft ? "has-error" : ""}`}
                  placeholder="e.g. Zardozi"
                  list="craft-families"
                />
                <datalist id="craft-families">
                  {[...new Set([...craftFamilies, "Zardozi"])].map((c) => <option key={c} value={c} />)}
                </datalist>
                <p className="field-hint">Exact work (e.g. "zardozi with titli booti") goes below.</p>
                {fieldError("craft")}
              </div>
            </div>

            {formData.useRawDescription ? (
              <div className="form-group">
                <label htmlFor="ep-raw">Description (HTML)</label>
                <textarea
                  id="ep-raw"
                  name="rawDescription"
                  value={formData.rawDescription}
                  onChange={handleChange}
                  className="admin-input full-width"
                  rows="10"
                />
                <p className="field-hint">This description contains HTML, so it is edited as-is.</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="ep-intro">Description</label>
                  <textarea
                    id="ep-intro"
                    name="intro"
                    value={formData.intro}
                    onChange={handleChange}
                    className="admin-input full-width"
                    rows="4"
                    placeholder="One or two sentences on what makes this piece special."
                  />
                </div>

                <label className="sub-label">Product details <span className="label-optional">Shown as a list on the product page</span></label>
                <div className="ep-details-grid">
                  {DETAIL_FIELDS.map((f) => (
                    <div className="form-group" key={f.key}>
                      <label htmlFor={`ep-d-${f.key}`}>{f.label}</label>
                      <input
                        id={`ep-d-${f.key}`}
                        type="text"
                        className="admin-input full-width"
                        value={formData.details[f.key] || ""}
                        placeholder={f.placeholder}
                        onChange={(e) => setDetail(f.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label htmlFor="ep-extra">Other details <span className="label-optional">One per line, e.g. "Care: Dry clean only"</span></label>
                  <textarea
                    id="ep-extra"
                    name="extraDetails"
                    value={formData.extraDetails}
                    onChange={handleChange}
                    className="admin-input full-width"
                    rows="2"
                  />
                </div>

                <details className="ep-preview">
                  <summary>Preview description as customers see it</summary>
                  <pre>{description || "—"}</pre>
                </details>
              </>
            )}
          </div>

          {/* ── 3. Price & stock ──────────────────────────── */}
          <div className="admin-card">
            <h3 className="card-heading"><span className="ep-step">3</span> Price &amp; stock</h3>
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="ep-price">Regular price (₹)</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">₹</span>
                  <input
                    id="ep-price"
                    type="number"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`admin-input full-width ${errors.price ? "has-error" : ""}`}
                  />
                </div>
                {fieldError("price")}
              </div>
              <div className="form-group half-width">
                <label htmlFor="ep-sale">Sale price (₹) <span className="label-optional">Optional</span></label>
                <div className="input-with-prefix">
                  <span className="input-prefix">₹</span>
                  <input
                    id="ep-sale"
                    type="number"
                    min="0"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    className={`admin-input full-width ${errors.salePrice ? "has-error" : ""}`}
                  />
                </div>
                {discountPct > 0 && <p className="field-hint">Shown as {discountPct}% off.</p>}
                {fieldError("salePrice")}
              </div>
            </div>
            {price > 0 && (
              <p className="ep-price-summary">
                Customers pay <strong>₹{(hasSale && salePrice < price ? salePrice : price).toLocaleString("en-IN")}</strong>
                {" "}· free shipping online · COD adds the handling fee from Settings
              </p>
            )}

            {!formData.isOneOfOne && (
              <div className="ep-segmented" role="radiogroup" aria-label="Product type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!isVariable}
                  className={!isVariable ? "is-active" : ""}
                  onClick={() => update({ productType: "simple" })}
                >
                  Single piece / one size
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isVariable}
                  className={isVariable ? "is-active" : ""}
                  onClick={() => update({ productType: "variable" })}
                >
                  <Layers size={13} /> Multiple sizes
                </button>
              </div>
            )}

            <div className="form-row mt-3">
              <div className="form-group half-width">
                <label htmlFor="ep-sku">SKU</label>
                <div className="ep-input-action">
                  <input
                    id="ep-sku"
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`admin-input full-width ${errors.sku ? "has-error" : ""}`}
                    placeholder={suggestSku(formData.title, formData.category)}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    title="Generate from name and category"
                    onClick={() => {
                      clearError("sku");
                      update({ sku: suggestSku(formData.title, formData.category) });
                    }}
                  >
                    <Wand2 size={14} />
                  </button>
                </div>
                <p className="field-hint">Leave empty to use the suggestion shown.</p>
                {fieldError("sku")}
              </div>
              {!isVariable && (
                <div className="form-group half-width">
                  <label htmlFor="ep-stock">Units in stock</label>
                  <input
                    id="ep-stock"
                    type="number"
                    min="0"
                    max={formData.isOneOfOne ? 1 : undefined}
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    disabled={formData.isOneOfOne}
                    className="admin-input full-width"
                  />
                  <p className="field-hint">
                    {formData.isOneOfOne
                      ? "One of One pieces have a single unit. Set to 0 by marking it sold."
                      : "Stock goes down automatically when an order is paid or a COD order is placed."}
                  </p>
                  {formData.isOneOfOne && Number(formData.stock) > 0 && !isNew && (
                    <button type="button" className="text-link" onClick={() => update({ stock: "0", stockStatus: "Out of Stock" })}>
                      Mark as sold
                    </button>
                  )}
                </div>
              )}
            </div>

            {isVariable && (
              <div className="ep-variations">
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label htmlFor="ep-attr">Option name</label>
                  <input
                    id="ep-attr"
                    type="text"
                    name="attributeName"
                    value={formData.attributeName}
                    onChange={handleChange}
                    className="admin-input"
                    placeholder="e.g. Size"
                    style={{ maxWidth: 240 }}
                  />
                </div>

                {formData.variations.length > 0 && (
                  <div className="variation-table-wrap">
                    <table className="variation-table">
                      <thead>
                        <tr>
                          <th>{formData.attributeName || "Option"}</th>
                          <th>Units</th>
                          <th>Price difference (₹)</th>
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
                                placeholder="e.g. 38 / M"
                                value={v.size}
                                onChange={(e) => updateVariation(idx, "size", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="admin-input full-width"
                                min="0"
                                value={v.stock}
                                onChange={(e) => updateVariation(idx, "stock", parseInt(e.target.value) || 0)}
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
                                  onChange={(e) => updateVariation(idx, "priceModifier", parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="variation-remove-btn"
                                title="Remove"
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
                  <button type="button" className="admin-btn admin-btn-outline icon-left" onClick={addVariation}>
                    <Plus size={14} /> Add size
                  </button>
                  <button type="button" className="admin-btn admin-btn-outline icon-left" onClick={populateBlouseSizes}>
                    <Layers size={14} /> Blouse sizes (36–44)
                  </button>
                  <button type="button" className="admin-btn admin-btn-outline icon-left" onClick={populateStandardSizes}>
                    <Layers size={14} /> Standard sizes (XS–XXL)
                  </button>
                </div>
                {fieldError("variations")}

                {formData.variations.length > 0 && (
                  <p className="variation-hint">
                    Total stock: <strong>{formData.variations.reduce((s, v) => s + (Number(v.stock) || 0), 0)}</strong> units
                    across {formData.variations.length} size{formData.variations.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="edit-product-sidebar">
          {/* ── Publishing checklist ──────────────────────── */}
          <div className="admin-card ep-publish-card">
            <h3 className="card-heading">Ready to publish?</h3>
            <ul className="ep-checklist">
              {checklist.map((c) => (
                <li key={c.key} className={c.done ? "is-done" : c.required ? "is-missing" : "is-optional"}>
                  {c.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  <span>{c.label}</span>
                  {!c.required && <em>recommended</em>}
                </li>
              ))}
            </ul>
            <p className="field-hint">
              {canPublish
                ? "Everything required is in place."
                : `Save as a draft now and publish once ${missingRequired.length === 1 ? "this is" : "these are"} done.`}
            </p>
          </div>

          <div className="admin-card">
            <div className="card-header-row">
              <h3 className="card-heading" style={{ margin: 0 }}>Photos</h3>
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

            {fieldError("image")}
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

          <div className="admin-card">
            <h3 className="card-heading">Organisation</h3>
            <div className="form-group">
              <label htmlFor="badge-select">Badge</label>
              <div className="cat-select-wrap">
                <select
                  id="badge-select"
                  name="badge"
                  value={formData.badge || (formData.isOneOfOne ? "One of One" : "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__new__") {
                      update({ badge: "__new__" });
                    } else if (val === "One of One") {
                      setOneOfOne(true);
                    } else {
                      update({ badge: val, isOneOfOne: false });
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
                  update({ displayOrder: isNaN(val) ? "" : val });
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
                  onChange={(e) => update({ isArchived: e.target.checked })}
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
                  onChange={(e) => update({ needsReview: e.target.checked })}
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
