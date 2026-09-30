import { Router } from 'express';
import { asyncHandler, sendSuccess, sendError, sendPaginated, getPagination } from '../../utils/response';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] as const;

// Shipping zones/rules
router.get('/zones', authenticate, authorize(...ADMIN), asyncHandler(async (_req: any, res: any) => {
  const zones = await prisma.setting.findFirst({ where: { key: 'shipping_zones' } });
  return sendSuccess(res, zones?.value ?? []);
}));

router.put('/zones', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const zones = await prisma.setting.upsert({
    where: { key: 'shipping_zones' },
    update: { value: req.body },
    create: { key: 'shipping_zones', value: req.body, group: 'shipping' },
  });
  return sendSuccess(res, zones, 'Shipping zones updated');
}));

// Calculate shipping for a given pincode/order amount
router.post('/calculate', asyncHandler(async (req: any, res: any) => {
  const { pincode, orderAmount } = req.body;
  if (!pincode || !orderAmount) return sendError(res, 'pincode and orderAmount required', 422);

  const settings = await prisma.setting.findMany({
    where: { key: { in: ['free_shipping_threshold', 'cod_charge', 'shipping_zones'] } },
  });

  const threshold = settings.find(s => s.key === 'free_shipping_threshold');
  const codCharge = settings.find(s => s.key === 'cod_charge');

  const freeThreshold = (threshold?.value as any)?.amount ?? 999;
  const isFreeShipping = orderAmount >= freeThreshold;

  return sendSuccess(res, {
    pincode,
    isFreeShipping,
    shippingCharge: isFreeShipping ? 0 : 99,
    codCharge: (codCharge?.value as any)?.amount ?? 50,
    estimatedDays: '5-7 business days',
  });
}));

export default router;
