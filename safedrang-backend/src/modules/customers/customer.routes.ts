import { Router } from 'express';
import { asyncHandler, sendSuccess, sendError, sendPaginated, getPagination } from '../../utils/response';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CUSTOMER_SUPPORT'] as const;

// Customer: view own profile
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({
    where: { userId: req.user!.id },
    include: { addresses: true },
  });
  if (!customer) return sendError(res, 'Customer not found', 404);
  return sendSuccess(res, customer);
}));

// Customer: update own profile
router.put('/me', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });
  if (!customer) return sendError(res, 'Not found', 404);
  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { name: req.body.name, phone: req.body.phone },
  });
  await prisma.user.update({ where: { id: req.user!.id }, data: { name: req.body.name } });
  return sendSuccess(res, updated, 'Profile updated');
}));

// Customer: wishlist
router.get('/me/wishlist', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });
  if (!customer) return sendError(res, 'Not found', 404);
  const wishlist = await prisma.wishlist.findMany({
    where: { customerId: customer.id },
    include: { product: { include: { images: { take: 1 } } } },
  });
  return sendSuccess(res, wishlist);
}));

router.post('/me/wishlist/:productId', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });
  if (!customer) return sendError(res, 'Not found', 404);
  const item = await prisma.wishlist.upsert({
    where: { customerId_productId: { customerId: customer.id, productId: req.params.productId as string } },
    create: { customerId: customer.id, productId: req.params.productId as string },
    update: {},
  });
  return sendSuccess(res, item, 'Added to wishlist');
}));

router.delete('/me/wishlist/:productId', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });
  if (!customer) return sendError(res, 'Not found', 404);
  await prisma.wishlist.deleteMany({ where: { customerId: customer.id, productId: req.params.productId as string } });
  return sendSuccess(res, null, 'Removed from wishlist');
}));

// Customer: addresses
router.get('/me/addresses', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });
  if (!customer) return sendError(res, 'Not found', 404);
  const addresses = await prisma.address.findMany({ where: { customerId: customer.id } });
  return sendSuccess(res, addresses);
}));

router.post('/me/addresses', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });
  if (!customer) return sendError(res, 'Not found', 404);
  if (req.body.isDefault) {
    await prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({ data: { ...req.body, customerId: customer.id } });
  return sendSuccess(res, address, 'Address added', 201);
}));

router.put('/me/addresses/:id', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });
  if (!customer) return sendError(res, 'Not found', 404);
  if (req.body.isDefault) {
    await prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.update({ where: { id: req.params.id as string }, data: req.body });
  return sendSuccess(res, address, 'Address updated');
}));

router.delete('/me/addresses/:id', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  await prisma.address.delete({ where: { id: req.params.id as string } });
  return sendSuccess(res, null, 'Address deleted');
}));

// ── ADMIN routes ──────────────────────────────────────
router.get('/', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const q = req.query as Record<string, string>;
  const { page, limit, skip } = getPagination(q);
  const { search } = q;
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.customer.count({ where }),
  ]);
  return sendPaginated(res, data, total, page, limit);
}));

router.get('/:id', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id as string },
    include: { addresses: true, orders: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!customer) return sendError(res, 'Customer not found', 404);
  return sendSuccess(res, customer);
}));

export default router;
