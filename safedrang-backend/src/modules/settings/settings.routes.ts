import { Router } from 'express';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const ADMIN = ['SUPER_ADMIN', 'ADMIN'] as const;

// Get all settings (admin)
router.get('/', authenticate, authorize(...ADMIN), asyncHandler(async (_req: any, res: any) => {
  const settings = await prisma.setting.findMany({ orderBy: { group: 'asc' } });
  const grouped = settings.reduce((acc: Record<string, any>, s) => {
    if (!acc[s.group]) acc[s.group] = {};
    acc[s.group][s.key] = s.value;
    return acc;
  }, {});
  return sendSuccess(res, grouped);
}));

// Update setting
router.put('/:key', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const setting = await prisma.setting.upsert({
    where: { key: req.params.key },
    update: { value: req.body.value, group: req.body.group ?? 'general' },
    create: { key: req.params.key, value: req.body.value, group: req.body.group ?? 'general' },
  });
  return sendSuccess(res, setting, 'Setting updated');
}));

// Tax rates endpoint
router.get('/tax', asyncHandler(async (_req: any, res: any) => {
  const taxSetting = await prisma.setting.findUnique({ where: { key: 'tax_rate' } });
  return sendSuccess(res, taxSetting?.value ?? { gst: 5 });
}));

export default router;
