import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  loadTrackingIntegrations,
  initStorefrontTracking,
  trackEvent,
} from "../lib/tracking";

export const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      // Don't inject or run tracking on admin dashboard routes
      if (location.pathname.startsWith("/admin")) return;

      const integrations = await loadTrackingIntegrations();
      if (!isMounted) return;

      initStorefrontTracking(integrations);
      trackEvent("page_view");
    };

    setup();

    // Re-initialize if tracking settings change in admin
    const handleUpdate = (e) => {
      if (!location.pathname.startsWith("/admin")) {
        initStorefrontTracking(e.detail);
      }
    };

    window.addEventListener("safedrang:tracking_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("safedrang:tracking_updated", handleUpdate);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default GoogleAnalytics;
