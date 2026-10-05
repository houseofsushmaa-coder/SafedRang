import { Router } from "express";
import multer from "multer";
import { ProductController } from "./product.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ctrl = new ProductController();

// ── PUBLIC ROUTES (no auth) ──────────────────────
router.get("/", ctrl.list);
router.get("/:idOrSlug", ctrl.getOne);

// ── ADMIN ROUTES ─────────────────────────────────
const adminRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "PRODUCT_MANAGER",
] as const;

router.post("/", authenticate, authorize(...adminRoles), ctrl.create);
router.put("/:id", authenticate, authorize(...adminRoles), ctrl.update);
router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  ctrl.remove,
);
router.post(
  "/bulk/update",
  authenticate,
  authorize(...adminRoles),
  ctrl.bulkUpdate,
);
router.post(
  "/bulk/import",
  authenticate,
  authorize(...adminRoles),
  upload.single("file"),
  ctrl.bulkImport,
);
router.post(
  "/bulk/delete",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  ctrl.bulkDelete,
);
router.post(
  "/:id/images",
  authenticate,
  authorize(...adminRoles),
  ctrl.addImages,
);
router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize(...adminRoles),
  ctrl.deleteImage,
);
router.put(
  "/:id/images/reorder",
  authenticate,
  authorize(...adminRoles),
  ctrl.reorderImages,
);
router.put(
  "/:id/stock",
  authenticate,
  authorize(...adminRoles),
  ctrl.updateStock,
);

export default router;
