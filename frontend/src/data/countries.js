/**
 * SafedRang — International Countries Config
 * Each entry: { name, code (ISO 3166-1 alpha-2), dialCode, flag emoji, currency, states[] }
 */

export const COUNTRIES = [
  // ── South Asia (priority) ───────────────────────────
  {
    name: "India",
    code: "IN",
    dialCode: "+91",
    flag: "🇮🇳",
    currency: "INR",
    states: [
      "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
      "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
      "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
      "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
      "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
      "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli & Daman & Diu",
      "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"
    ],
  },
  {
    name: "Bangladesh",
    code: "BD",
    dialCode: "+880",
    flag: "🇧🇩",
    currency: "BDT",
    states: ["Dhaka","Chittagong","Rajshahi","Khulna","Sylhet","Barishal","Rangpur","Mymensingh"],
  },
  {
    name: "Pakistan",
    code: "PK",
    dialCode: "+92",
    flag: "🇵🇰",
    currency: "PKR",
    states: ["Punjab","Sindh","Khyber Pakhtunkhwa","Balochistan","Islamabad Capital Territory","Gilgit-Baltistan","Azad Jammu & Kashmir"],
  },
  {
    name: "Sri Lanka",
    code: "LK",
    dialCode: "+94",
    flag: "🇱🇰",
    currency: "LKR",
    states: ["Western","Central","Southern","Uva","Sabaragamuwa","North Western","North Central","Northern","Eastern"],
  },
  {
    name: "Nepal",
    code: "NP",
    dialCode: "+977",
    flag: "🇳🇵",
    currency: "NPR",
    states: ["Koshi","Madhesh","Bagmati","Gandaki","Lumbini","Karnali","Sudurpashchim"],
  },

  // ── Middle East ─────────────────────────────────────
  {
    name: "United Arab Emirates",
    code: "AE",
    dialCode: "+971",
    flag: "🇦🇪",
    currency: "AED",
    states: ["Abu Dhabi","Dubai","Sharjah","Ajman","Umm Al Quwain","Ras Al Khaimah","Fujairah"],
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    dialCode: "+966",
    flag: "🇸🇦",
    currency: "SAR",
    states: ["Riyadh","Makkah","Madinah","Eastern Province","Asir","Tabuk","Qassim","Hail","Jizan","Najran","Al Bahah","Al Jawf","Northern Borders"],
  },
  {
    name: "Qatar",
    code: "QA",
    dialCode: "+974",
    flag: "🇶🇦",
    currency: "QAR",
    states: ["Ad Dawhah","Al Khawr","Ash Shamal","Al Wakrah","Ar Rayyan","Al Daayen","Al Shahaniya","Umm Salal"],
  },
  {
    name: "Kuwait",
    code: "KW",
    dialCode: "+965",
    flag: "🇰🇼",
    currency: "KWD",
    states: ["Al Ahmadi","Al Farwaniyah","Al Jahra","Al Kuwayt","Hawalli","Mubarak Al-Kabeer"],
  },
  {
    name: "Bahrain",
    code: "BH",
    dialCode: "+973",
    flag: "🇧🇭",
    currency: "BHD",
    states: ["Capital","Muharraq","Northern","Southern"],
  },
  {
    name: "Oman",
    code: "OM",
    dialCode: "+968",
    flag: "🇴🇲",
    currency: "OMR",
    states: ["Muscat","Dhofar","Musandam","Al Buraimi","Ad Dakhiliyah","Al Batinah North","Al Batinah South","Ash Sharqiyah North","Ash Sharqiyah South","Al Wusta","Adh Dhahirah"],
  },

  // ── English-speaking world ───────────────────────────
  {
    name: "United States",
    code: "US",
    dialCode: "+1",
    flag: "🇺🇸",
    currency: "USD",
    states: [
      "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
      "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
      "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
      "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
      "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
      "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
      "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
      "Wisconsin","Wyoming","District of Columbia"
    ],
  },
  {
    name: "United Kingdom",
    code: "GB",
    dialCode: "+44",
    flag: "🇬🇧",
    currency: "GBP",
    states: ["England","Scotland","Wales","Northern Ireland"],
  },
  {
    name: "Canada",
    code: "CA",
    dialCode: "+1",
    flag: "🇨🇦",
    currency: "CAD",
    states: ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan","Northwest Territories","Nunavut","Yukon"],
  },
  {
    name: "Australia",
    code: "AU",
    dialCode: "+61",
    flag: "🇦🇺",
    currency: "AUD",
    states: ["New South Wales","Victoria","Queensland","South Australia","Western Australia","Tasmania","Australian Capital Territory","Northern Territory"],
  },
  {
    name: "New Zealand",
    code: "NZ",
    dialCode: "+64",
    flag: "🇳🇿",
    currency: "NZD",
    states: ["Northland","Auckland","Waikato","Bay of Plenty","Gisborne","Hawke's Bay","Taranaki","Manawatu-Whanganui","Wellington","Tasman","Nelson","Marlborough","West Coast","Canterbury","Otago","Southland"],
  },

  // ── Europe ──────────────────────────────────────────
  {
    name: "Germany",
    code: "DE",
    dialCode: "+49",
    flag: "🇩🇪",
    currency: "EUR",
    states: ["Baden-Württemberg","Bavaria","Berlin","Brandenburg","Bremen","Hamburg","Hesse","Lower Saxony","Mecklenburg-Vorpommern","North Rhine-Westphalia","Rhineland-Palatinate","Saarland","Saxony","Saxony-Anhalt","Schleswig-Holstein","Thuringia"],
  },
  {
    name: "France",
    code: "FR",
    dialCode: "+33",
    flag: "🇫🇷",
    currency: "EUR",
    states: ["Île-de-France","Auvergne-Rhône-Alpes","Hauts-de-France","Nouvelle-Aquitaine","Occitanie","Provence-Alpes-Côte d'Azur","Grand Est","Pays de la Loire","Bretagne","Normandie","Bourgogne-Franche-Comté","Centre-Val de Loire","Corse"],
  },
  {
    name: "Italy",
    code: "IT",
    dialCode: "+39",
    flag: "🇮🇹",
    currency: "EUR",
    states: ["Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia","Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna","Sicilia","Toscana","Trentino-Alto Adige","Umbria","Valle d'Aosta","Veneto"],
  },
  {
    name: "Netherlands",
    code: "NL",
    dialCode: "+31",
    flag: "🇳🇱",
    currency: "EUR",
    states: ["Drenthe","Flevoland","Friesland","Gelderland","Groningen","Limburg","North Brabant","North Holland","Overijssel","South Holland","Utrecht","Zeeland"],
  },
  {
    name: "Spain",
    code: "ES",
    dialCode: "+34",
    flag: "🇪🇸",
    currency: "EUR",
    states: ["Andalusia","Aragon","Asturias","Balearic Islands","Basque Country","Canary Islands","Cantabria","Castile and León","Castilla-La Mancha","Catalonia","Extremadura","Galicia","La Rioja","Madrid","Murcia","Navarre","Valencia"],
  },
  {
    name: "Switzerland",
    code: "CH",
    dialCode: "+41",
    flag: "🇨🇭",
    currency: "CHF",
    states: ["Aargau","Appenzell Ausserrhoden","Appenzell Innerrhoden","Basel-Landschaft","Basel-Stadt","Bern","Fribourg","Geneva","Glarus","Graubünden","Jura","Lucerne","Neuchâtel","Nidwalden","Obwalden","Schaffhausen","Schwyz","Solothurn","St. Gallen","Thurgau","Ticino","Uri","Valais","Vaud","Zug","Zürich"],
  },

  // ── Asia-Pacific ────────────────────────────────────
  {
    name: "Singapore",
    code: "SG",
    dialCode: "+65",
    flag: "🇸🇬",
    currency: "SGD",
    states: ["Central Region","East Region","North Region","North-East Region","West Region"],
  },
  {
    name: "Malaysia",
    code: "MY",
    dialCode: "+60",
    flag: "🇲🇾",
    currency: "MYR",
    states: ["Johor","Kedah","Kelantan","Kuala Lumpur","Labuan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Putrajaya","Sabah","Sarawak","Selangor","Terengganu"],
  },
  {
    name: "Japan",
    code: "JP",
    dialCode: "+81",
    flag: "🇯🇵",
    currency: "JPY",
    states: ["Tokyo","Osaka","Kyoto","Hokkaido","Aichi","Fukuoka","Kanagawa","Saitama","Chiba","Hyogo"],
  },
  {
    name: "South Korea",
    code: "KR",
    dialCode: "+82",
    flag: "🇰🇷",
    currency: "KRW",
    states: ["Seoul","Busan","Incheon","Daegu","Daejeon","Gwangju","Ulsan","Sejong","Gyeonggi","Gangwon","North Chungcheong","South Chungcheong","North Jeolla","South Jeolla","North Gyeongsang","South Gyeongsang","Jeju"],
  },
  {
    name: "Hong Kong",
    code: "HK",
    dialCode: "+852",
    flag: "🇭🇰",
    currency: "HKD",
    states: ["Hong Kong Island","Kowloon","New Territories"],
  },
];

/** Map country code → country object (for fast lookup) */
export const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

/** Map currency code → { symbol, locale } */
export const CURRENCY_META = {
  INR: { symbol: "₹",   locale: "en-IN" },
  USD: { symbol: "$",   locale: "en-US" },
  EUR: { symbol: "€",   locale: "en-IE" },
  GBP: { symbol: "£",   locale: "en-GB" },
  AUD: { symbol: "A$",  locale: "en-AU" },
  CAD: { symbol: "C$",  locale: "en-CA" },
  NZD: { symbol: "NZ$", locale: "en-NZ" },
  AED: { symbol: "د.إ", locale: "ar-AE" },
  SAR: { symbol: "﷼",   locale: "ar-SA" },
  QAR: { symbol: "﷼",   locale: "ar-QA" },
  KWD: { symbol: "د.ك", locale: "ar-KW" },
  BHD: { symbol: "د.ب", locale: "ar-BH" },
  OMR: { symbol: "﷼",   locale: "ar-OM" },
  SGD: { symbol: "S$",  locale: "en-SG" },
  MYR: { symbol: "RM",  locale: "ms-MY" },
  JPY: { symbol: "¥",   locale: "ja-JP" },
  KRW: { symbol: "₩",   locale: "ko-KR" },
  HKD: { symbol: "HK$", locale: "zh-HK" },
  CHF: { symbol: "Fr",  locale: "de-CH" },
  BDT: { symbol: "৳",   locale: "bn-BD" },
  PKR: { symbol: "Rs",  locale: "ur-PK" },
  LKR: { symbol: "Rs",  locale: "si-LK" },
  NPR: { symbol: "Rs",  locale: "ne-NP" },
};

/** Get all unique currency codes from COUNTRIES */
export const SUPPORTED_CURRENCY_CODES = [...new Set(COUNTRIES.map((c) => c.currency))];
