import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(
    localStorage.getItem("safed_currency") || "INR"
  );
  const [rates, setRates] = useState({ INR: 1 });
  const [loading, setLoading] = useState(true);

  // Define supported currencies and their symbols
  const supportedCurrencies = {
    INR: { symbol: "₹", locale: "en-IN" },
    USD: { symbol: "$", locale: "en-US" },
    EUR: { symbol: "€", locale: "en-IE" },
    GBP: { symbol: "£", locale: "en-GB" },
    AUD: { symbol: "A$", locale: "en-AU" },
    CAD: { symbol: "C$", locale: "en-CA" },
    AED: { symbol: "د.إ", locale: "en-AE" },
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        // Use a free public API for exchange rates (base INR)
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
        const data = await res.json();
        setRates(data.rates);
      } catch (err) {
        console.error("Failed to fetch exchange rates", err);
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
    if (supportedCurrencies[code]) {
      setCurrency(code);
    }
  };

  const formatPrice = (amountInInr) => {
    if (amountInInr === undefined || amountInInr === null) return "";
    
    const rate = rates[currency] || 1;
    const converted = amountInInr * rate;
    
    const locale = supportedCurrencies[currency]?.locale || "en-IN";
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      maximumFractionDigits: currency === "INR" ? 0 : 2,
      minimumFractionDigits: currency === "INR" ? 0 : 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        changeCurrency,
        formatPrice,
        supportedCurrencies,
        loadingRates: loading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
