/**
 * Centralized API configuration for the Safedrang storefront.
 *
 * Since the backend serves the frontend from the same origin in production,
 * we use a relative base URL. In development, Vite's proxy is configured to
 * forward /api requests to the backend dev server.
 *
 * NEVER put secret keys here. This file is bundled into the browser.
 */

// Use relative URL so it works on any domain (dev, staging, production)
export const API_BASE = "/api/v1";

/**
 * Returns auth headers for admin API calls.
 * Reads from localStorage only (never hardcodes credentials).
 */
export const getAuthHeaders = () => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Formats an INR currency amount.
 */
export const formatINR = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val ?? 0);
