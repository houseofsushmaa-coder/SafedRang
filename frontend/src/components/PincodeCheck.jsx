import { useEffect, useState } from "react";
import { MapPin, Truck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { COUNTRY_MAP } from "../data/countries";
import { trackEvent } from "../lib/tracking";

// The last checked PIN, reused here and to pre-fill checkout.
export const PINCODE_STORAGE_KEY = "sr_delivery_pincode";

// Published timelines (FAQ): dispatch in 2–3 business days, then 4–7 in transit.
const MIN_BUSINESS_DAYS = 6;
const MAX_BUSINESS_DAYS = 10;

const addBusinessDays = (from, days) => {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++; // couriers work Saturdays; skip Sundays
  }
  return d;
};

const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

// Map India Post state names onto the checkout's state list.
const INDIA_STATES = COUNTRY_MAP.IN?.states || [];
const normState = (s) => String(s || "").toLowerCase().replace(/\band\b/g, "&").replace(/\s+/g, " ").trim();
export const matchIndianState = (name) => {
  const n = normState(name);
  if (!n) return "";
  return INDIA_STATES.find((s) => normState(s) === n) || INDIA_STATES.find((s) => normState(s).includes(n)) || "";
};

/** Looks a PIN up in India Post's public directory. */
async function lookupPincode(pin) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: controller.signal });
    const [data] = await res.json();
    if (data?.Status !== "Success" || !data.PostOffice?.length) return { status: "invalid" };
    const office = data.PostOffice.find((o) => o.DeliveryStatus === "Delivery") || data.PostOffice[0];
    return { status: "ok", district: office.District, state: office.State };
  } catch {
    return { status: "unknown" };
  } finally {
    clearTimeout(timer);
  }
}

export default function PincodeCheck({ codAvailable = true }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const check = async (pin) => {
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setResult({ status: "format" });
      return;
    }
    setChecking(true);
    const found = await lookupPincode(pin);
    setChecking(false);
    setResult(found);
    trackEvent("pincode_check", { result: found.status });
    if (found.status === "ok") {
      try {
        localStorage.setItem(
          PINCODE_STORAGE_KEY,
          JSON.stringify({ pincode: pin, city: found.district, state: matchIndianState(found.state) })
        );
      } catch {}
    }
  };

  // Show the result for a PIN checked on an earlier visit (no new lookup).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PINCODE_STORAGE_KEY) || "null");
      if (saved?.pincode && saved.city) {
        setPincode(saved.pincode);
        setResult({ status: "ok", district: saved.city, state: saved.state || saved.city });
      }
    } catch {}
  }, []);

  const today = new Date();
  const deliveryWindow = `${fmt(addBusinessDays(today, MIN_BUSINESS_DAYS))} – ${fmt(addBusinessDays(today, MAX_BUSINESS_DAYS))}`;

  return (
    <form
      className="pincode-checker"
      onSubmit={(e) => {
        e.preventDefault();
        check(pincode.trim());
      }}
    >
      <label className="pincode-header" htmlFor="pdp-pincode">
        <MapPin size={16} /> <span>Check delivery to your PIN code</span>
      </label>
      <div className="pincode-input-group">
        <input
          id="pdp-pincode"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Enter 6-digit PIN code"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            if (result) setResult(null);
          }}
          aria-describedby="pdp-pincode-result"
        />
        <button type="submit" className="btn-pincode" disabled={checking || pincode.length !== 6}>
          {checking ? <Loader2 size={14} className="pincode-spin" /> : "Check"}
        </button>
      </div>

      <div id="pdp-pincode-result" aria-live="polite">
        {result?.status === "ok" && (
          <div className="pincode-result is-ok">
            <p className="pincode-result-line">
              <CheckCircle2 size={15} />
              <span>
                Delivers to <strong>{result.district}, {result.state}</strong>
              </span>
            </p>
            <p className="pincode-result-line">
              <Truck size={15} />
              <span>
                Estimated delivery <strong>{deliveryWindow}</strong>
              </span>
            </p>
            <p className="pincode-result-note">
              Free shipping with online payment{codAvailable ? " · Cash on Delivery available" : ""}
            </p>
          </div>
        )}
        {result?.status === "invalid" && (
          <p className="pincode-result is-error">
            <AlertCircle size={15} /> We couldn't find PIN code {pincode}. Please check it and try again.
          </p>
        )}
        {result?.status === "format" && (
          <p className="pincode-result is-error">
            <AlertCircle size={15} /> Please enter a valid 6-digit PIN code.
          </p>
        )}
        {result?.status === "unknown" && (
          <p className="pincode-result is-info">
            <Truck size={15} /> We deliver across India — usually by <strong>{deliveryWindow}</strong>.
          </p>
        )}
      </div>
    </form>
  );
}
