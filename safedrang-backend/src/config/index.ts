import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || "fallback_access_secret_change_in_prod",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "fallback_refresh_secret_change_in_prod",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },

  cashfree: {
    appId: process.env.CASHFREE_APP_ID || "",
    secretKey: process.env.CASHFREE_SECRET_KEY || "",
    environment: (process.env.CASHFREE_ENV || "SANDBOX").toUpperCase() as "SANDBOX" | "PRODUCTION",
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "ap-south-1",
    bucket: process.env.AWS_S3_BUCKET || "safedrang-media",
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "Safed Rang <noreply@safedrang.com>",
  },

  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || "",
    password: process.env.SHIPROCKET_PASSWORD || "",
  },

  business: {
    name: process.env.BUSINESS_NAME || "Safed Rang",
    gstin: process.env.BUSINESS_GSTIN || "",
    address: process.env.BUSINESS_ADDRESS || "Lucknow, UP, India",
    invoicePrefix: process.env.INVOICE_PREFIX || "SR",
  },
};
