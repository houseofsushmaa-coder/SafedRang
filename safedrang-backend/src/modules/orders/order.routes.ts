import { Router } from "express";
import express from "express";
import { OrderController } from "./order.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();
const ctrl = new OrderController();

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "ORDER_MANAGER",
] as const;

// ── Cashfree Webhook (raw body required for signature verification) ──────────
// Must be registered BEFORE the json body parser middleware would apply.
// express.raw() captures the raw request body as a Buffer.
router.post(
  "/cashfree-webhook",
  express.raw({ type: "*/*" }),
  ctrl.cashfreeWebhook,
);

// ── Customer Routes ───────────────────────────────────────────────────────────
// Create an internal order (validates cart, calculates totals server-side)
router.post("/", authenticate, ctrl.create);

// Create an internal order as a Guest (no auth required)
router.post("/guest", ctrl.guestCreate);

// Create a Cashfree payment session for an existing pending order (auth removed for guest access)
router.post("/cashfree-order", ctrl.createCashfreePaymentOrder);

// Server-side payment verification after customer returns from Cashfree
router.post("/verify-payment", ctrl.verifyPayment);

// Customer's own orders
router.get("/my", authenticate, ctrl.myOrders);

// Get a single order (auth required)
router.get("/:id", authenticate, ctrl.getOne);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get("/", authenticate, authorize(...ADMIN_ROLES), ctrl.list);

router.put(
  "/:id/status",
  authenticate,
  authorize(...ADMIN_ROLES),
  ctrl.updateStatus,
);

router.put(
  "/:id/tracking",
  authenticate,
  authorize(...ADMIN_ROLES),
  ctrl.addTracking,
);

router.post(
  "/:id/refund",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"),
  ctrl.refund,
);

export default router;
