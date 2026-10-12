import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Disable automatic browser scroll restoration so it never jumps down
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (hash) {
      // If navigating to a specific in-page anchor (#anchor), scroll to it
      const targetElement = document.getElementById(hash.replace("#", ""));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // Instantly scroll window to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    // Cross-browser fail-safe for html/body scroll positions
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // Also reset any scrollable main elements or admin containers
    const mainContainer = document.querySelector("main") || document.querySelector(".app-layout");
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [pathname, search, hash]);

  return null;
}
