import { Router } from 'express';
import { asyncHandler, sendSuccess, sendError, sendPaginated, getPagination } from '../../utils/response';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { generateSlug } from '../../utils/response';

const router = Router();
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PRODUCT_MANAGER'] as const;

// PUBLIC
router.get('/', asyncHandler(async (req: any, res: any) => {
  const categories = await prisma.category.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { sortOrder: 'asc' },
    include: { children: { where: { status: 'ACTIVE' } } },
  });
  return sendSuccess(res, categories);
}));

router.get('/:slug', asyncHandler(async (req: any, res: any) => {
  const cat = await prisma.category.findUnique({ where: { slug: req.params.slug }, include: { children: true } });
  if (!cat) return sendError(res, 'Category not found', 404);
  return sendSuccess(res, cat);
}));

// ADMIN
router.post('/', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const { name, description, image, parentId, sortOrder, seoTitle, seoDescription } = req.body;
  if (!name) return sendError(res, 'Name required', 422);
  const slug = generateSlug(name);
  const cat = await prisma.category.create({
    data: { name, slug, description, image, parentId, sortOrder: sortOrder ?? 0, seoTitle, seoDescription },
  });
  return sendSuccess(res, cat, 'Category created', 201);
}));

router.put('/:id', authenticate, authorize(...ADMIN), asyncHandler(async (req: any, res: any) => {
  const cat = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  return sendSuccess(res, cat, 'Category updated');
}));

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: any) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  return sendSuccess(res, null, 'Category deleted');
}));

export default router;
