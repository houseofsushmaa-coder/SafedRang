import express, { Application } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { connectDB } from "./config/database";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

// Routes
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/product.routes";
import categoryRoutes from "./modules/categories/category.routes";
import orderRoutes from "./modules/orders/order.routes";
import customerRoutes from "./modules/customers/customer.routes";
import couponRoutes from "./modules/coupons/coupon.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import uploadRoutes from "./modules/uploads/upload.routes";
import shippingRoutes from "./modules/shipping/shipping.routes";
import settingsRoutes from "./modules/settings/settings.routes";

const app: Application = express();

// ── Security Middleware ──────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Rate Limiting ────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min window (was 15 min)
  max: 100,                 // 100 attempts (was 10) — relax for dev
  message: {
    success: false,
    message: "Too many auth attempts, please try again later.",
  },
});
app.use(limiter);

// ── Body Parsers ─────────────────────────────────────
// Note: Razorpay webhook needs raw body — handled in order.routes.ts using express.raw()
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── HTTP Logging ─────────────────────────────────────
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// ── Health Check ─────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────
const V1 = config.apiPrefix;
app.use(`${V1}/auth`, authLimiter, authRoutes);
app.use(`${V1}/products`, productRoutes);
app.use(`${V1}/categories`, categoryRoutes);
app.use(`${V1}/orders`, orderRoutes);
app.use(`${V1}/customers`, customerRoutes);
app.use(`${V1}/coupons`, couponRoutes);
app.use(`${V1}/inventory`, inventoryRoutes);
app.use(`${V1}/analytics`, analyticsRoutes);
app.use(`${V1}/uploads`, uploadRoutes);
app.use(`${V1}/shipping`, shippingRoutes);
app.use(`${V1}/settings`, settingsRoutes);

// ── 404 & Error Handlers ─────────────────────────────
// (Keep API 404 handler for API routes only)
app.use(V1, notFoundHandler);
app.use(errorHandler);

// ── Serve React Frontend ─────────────────────────────
const frontendPath = path.join(__dirname, "../public");
app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ── Start Server ──────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(config.port, () => {
    logger.info(
      `🚀 Safed Rang API running on http://localhost:${config.port}${config.apiPrefix}`,
    );
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
  });
};

startServer().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
