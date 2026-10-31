import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "../lib/tracking";
import "./WhatsAppButton.css";

const ONLINE_WHATSAPP_ICON =
  "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";
const WHATSAPP_NUMBER = "919151566602";

export default function WhatsAppButton() {
  const location = useLocation();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Do not display over admin panel
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  // wa.me opens the app on phones and WhatsApp Web / Desktop on computers.
  // Include the page so the team knows what the shopper is looking at.
  const message = location.pathname.startsWith("/product/")
    ? `Hello Safed Rang, I have a question about this piece: ${window.location.origin}${location.pathname}`
    : "Hello Safed Rang, I have a question.";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="global-whatsapp-floating"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      onClick={() => trackEvent("whatsapp_click", { context: "floating_button", page_path: location.pathname })}
    >
      <span className="whatsapp-tooltip">Chat with us on WhatsApp</span>
      <div className="whatsapp-btn-pulse">
        <img
          src={ONLINE_WHATSAPP_ICON}
          alt="WhatsApp"
          className="whatsapp-online-icon"
          onLoad={() => setImageLoaded(true)}
          style={{ display: imageLoaded ? "block" : "none" }}
        />
        {!imageLoaded && (
          <svg
            className="whatsapp-online-icon"
            viewBox="0 0 24 24"
            fill="#FFFFFF"
            width="32"
            height="32"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.78 14.17c-.24.68-1.2 1.26-1.68 1.34-.44.07-1.02.1-1.65-.1-.4-.13-.91-.29-1.57-.58-2.78-1.21-4.59-4.04-4.73-4.22-.14-.19-1.13-1.5-1.13-2.87 0-1.36.71-2.03.96-2.31.25-.28.56-.35.74-.35.19 0 .38 0 .54.01.18.01.41-.07.64.48.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.3.37-.43.5-.14.14-.29.3-.12.59.17.29.74 1.22 1.6 1.98 1.1 0.98 2.03 1.29 2.32 1.43.29.14.46.12.63-.07.17-.19.74-.86.94-1.16.2-.29.39-.24.66-.14.27.1 1.71.81 2 .96.3.14.49.22.56.34.07.13.07.74-.17 1.42z" />
          </svg>
        )}
      </div>
    </a>
  );
}
