import React, { createContext, useContext, useState, useEffect } from "react";
import { CURRENCY_META, SUPPORTED_CURRENCY_CODES } from "../data/countries";

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(
    localStorage.getItem("safed_currency") || "INR"
  );
  const [rates, setRates] = useState({ INR: 1 });
  const [loading, setLoading] = useState(true);

  // Fetch live exchange rates (base = INR)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
        const data = await res.json();
        setRates(data.rates);
      } catch (err) {
        console.error("Failed to fetch exchange rates", err);
        // Fallback approximate rates (base INR)
        setRates({
          INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, AUD: 0.018,
          CAD: 0.016, NZD: 0.02, AED: 0.044, SAR: 0.045, QAR: 0.044,
          KWD: 0.0037, BHD: 0.0045, OMR: 0.0046, SGD: 0.016, MYR: 0.056,
          JPY: 1.8, KRW: 16, HKD: 0.094, CHF: 0.011, BDT: 1.32,
          PKR: 3.3, LKR: 3.7, NPR: 1.6,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    localStorage.setItem("safed_currency", currency);
  }, [currency]);

  const changeCurrency = (code) => {
    if (CURRENCY_META[code]) {
      setCurrency(code);
    }
  };

  const formatPrice = (amountInInr) => {
    if (amountInInr === undefined || amountInInr === null) return "";

    const rate = rates[currency] || 1;
    const converted = amountInInr * rate;

    const meta = CURRENCY_META[currency];
    const locale = meta?.locale || "en-US";

    // JPY, KRW have no fractional units
    const noDecimals = ["JPY", "KRW", "INR"].includes(currency);

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: noDecimals ? 0 : 2,
        minimumFractionDigits: noDecimals ? 0 : 2,
      }).format(converted);
    } catch {
      // Fallback if Intl doesn't know the currency
      const sym = meta?.symbol || currency;
      return `${sym}${converted.toFixed(noDecimals ? 0 : 2)}`;
    }
  };

  // Convert a raw INR amount to the selected currency (numeric)
  const convertPrice = (amountInInr) => {
    const rate = rates[currency] || 1;
    return amountInInr * rate;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        changeCurrency,
        formatPrice,
        convertPrice,
        supportedCurrencies: CURRENCY_META,
        supportedCodes: SUPPORTED_CURRENCY_CODES,
        loadingRates: loading,
        rates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
