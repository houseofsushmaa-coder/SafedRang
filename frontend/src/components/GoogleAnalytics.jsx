import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  loadTrackingIntegrations,
  initStorefrontTracking,
  trackEvent,
} from "../lib/tracking";

export const GoogleAnalytics = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [ready, setReady] = useState(false);

  // Load and inject provider scripts once per visit. Re-initialising on every
  // route re-ran fbq("init") / pintrk("load") and duplicated page events.
  useEffect(() => {
    if (isAdminRoute || ready) return;
    let isMounted = true;
    loadTrackingIntegrations().then((integrations) => {
      if (!isMounted) return;
      initStorefrontTracking(integrations);
      setReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, [isAdminRoute, ready]);

  // Re-initialize if tracking settings change in admin
  useEffect(() => {
    const handleUpdate = (e) => {
      if (!window.location.pathname.startsWith("/admin")) initStorefrontTracking(e.detail);
    };
    window.addEventListener("safedrang:tracking_updated", handleUpdate);
    return () => window.removeEventListener("safedrang:tracking_updated", handleUpdate);
  }, []);

  // One page_view per page (path) change, after scripts are initialised.
  // Query-string changes from shop filters are tracked as filter_apply instead,
  // so they don't inflate page views.
  useEffect(() => {
    if (!ready || isAdminRoute) return;
    // Let the new page set document.title first.
    const t = setTimeout(() => trackEvent("page_view"), 0);
    return () => clearTimeout(t);
  }, [ready, isAdminRoute, location.pathname]);

  return null;
};

export default GoogleAnalytics;
