import { Router } from "express";
import {
  asyncHandler,
  sendSuccess,
  sendPaginated,
  getPagination,
} from "../../utils/response";
import { prisma } from "../../config/database";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();
const ADMIN = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

// Get inventory transactions
router.get(
  "/transactions",
  authenticate,
  authorize(...ADMIN),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, skip } = getPagination(req.query);
    const { productId } = req.query;
    const where: any = productId ? { productId } : {};
    const [data, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true, sku: true } } },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
  }),
);

// Get low stock products
router.get(
  "/low-stock",
  authenticate,
  authorize(...ADMIN),
  asyncHandler(async (_req: any, res: any) => {
    const products = await prisma.product.findMany({
      where: {
        stock: { lte: prisma.product.fields.lowStockThreshold as any },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
      },
      orderBy: { stock: "asc" },
    });
    return sendSuccess(res, products);
  }),
);

// Manual stock adjustment
router.post(
  "/adjust",
  authenticate,
  authorize(...ADMIN),
  asyncHandler(async (req: any, res: any) => {
    const { productId, variantId, quantity, reason } = req.body;
    const { ProductService } = await import("../products/product.service");
    const productService = new ProductService();
    const result = await productService.updateStock(
      productId,
      quantity,
      reason,
      variantId,
    );
    return sendSuccess(res, result, "Stock adjusted");
  }),
);

export default router;
