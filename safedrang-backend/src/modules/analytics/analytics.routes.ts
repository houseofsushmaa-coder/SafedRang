import { Router } from "express";
import { asyncHandler, sendSuccess } from "../../utils/response";
import { AnalyticsService } from "./analytics.service";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();
const analyticsService = new AnalyticsService();

const ADMIN = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

router.get(
  "/dashboard",
  authenticate,
  authorize(...ADMIN),
  asyncHandler(async (req: any, res: any) => {
    const { filter, from, to } = req.query;
    const data = await analyticsService.getDashboard(filter, from, to);
    return sendSuccess(res, data);
  }),
);

router.get(
  "/sales-chart",
  authenticate,
  authorize(...ADMIN),
  asyncHandler(async (req: any, res: any) => {
    const data = await analyticsService.getSalesChart(req.query.filter);
    return sendSuccess(res, data);
  }),
);

export default router;
