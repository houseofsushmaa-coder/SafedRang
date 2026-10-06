import { Router } from "express";
import { OrderController } from "../orders/order.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();
const ctrl = new OrderController();

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "ORDER_MANAGER",
] as const;

// Admin: list all payments with Cashfree details
router.get("/", authenticate, authorize(...ADMIN_ROLES), ctrl.listPayments);

export default router;
