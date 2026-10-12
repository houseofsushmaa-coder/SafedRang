import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { adminService } from "../admin/adminService";

export const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // 1. Get GA4 ID from env or saved settings
    const initGA = async () => {
      let gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;

      if (!gaId) {
        try {
          const settings = await adminService.getSettings();
          gaId = settings?.seo?.google_analytics_id;
        } catch {}
      }

      if (!gaId || !gaId.startsWith("G-")) {
        return;
      }

      // Check if script already injected
      if (!document.getElementById("ga-gtag-script")) {
        const script = document.createElement("script");
        script.id = "ga-gtag-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
          window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", gaId, {
          send_page_view: false, // We manually send page_views on route change
        });
      }

      // Track page view on route change (storefront only)
      if (window.gtag && !location.pathname.startsWith("/admin")) {
        window.gtag("event", "page_view", {
          page_path: location.pathname + location.search,
          page_location: window.location.href,
          page_title: document.title,
        });
      }
    };

    initGA();
  }, [location]);

  return null;
};

export default GoogleAnalytics;
