import { Router } from 'express';
import { asyncHandler, sendSuccess, sendError } from '../../utils/response';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] as const;

// Validate coupon (customer-facing)
router.post('/validate', authenticate, asyncHandler(async (req: any, res: any) => {
  const { code, orderAmount } = req.body;
  if (!code) return sendError(res, 'Coupon code required', 422);

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.status) return sendError(res, 'Invalid coupon code', 400);
  if (coupon.expiryDate && coupon.expiryDate < new Date()) return sendError(res, 'Coupon expired', 400);
  if (coupon.minimumOrderAmount && orderAmount < Number(coupon.minimumOrderAmount)) {
    return sendError(res, `Minimum order ₹${coupon.minimumOrderAmount} required`, 400);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return sendError(res, 'Coupon usage limit reached', 400);
  }

  const discount = coupon.type === 'PERCENTAGE'
    ? Math.min(orderAmount * Number(coupon.value) / 100, Number(coupon.maximumDiscount ?? Infinity))
    : Math.min(Number(coupon.value), orderAmount);

  return sendSuccess(res, { coupon, discount }, 'Coupon valid');
}));

// Admin CRUD
router.get('/', authenticate, authorize(...ADMIN), asyncHandler(async (_req: any, res: any) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return sendSuccess(res, coupons);
}));

router.post('/', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const coupon = await prisma.coupon.create({ data: req.body });
  return sendSuccess(res, coupon, 'Coupon created', 201);
}));

router.put('/:id', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
  return sendSuccess(res, coupon, 'Coupon updated');
}));

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: any) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  return sendSuccess(res, null, 'Coupon deleted');
}));

export default router;
