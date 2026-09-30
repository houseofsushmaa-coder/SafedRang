import { prisma } from '../../config/database';
import { ProductStatus, Prisma } from '@prisma/client';
import { createError } from '../../middleware/error.middleware';
import { generateSlug } from '../../utils/response';

export class ProductService {
  async create(data: {
    name: string; sku: string; price: number; salePrice?: number; costPrice?: number;
    description?: string; shortDescription?: string; stock?: number; lowStockThreshold?: number;
    categoryId?: string; status?: ProductStatus; featured?: boolean; bestseller?: boolean;
    newArrival?: boolean; weight?: number; fabric?: string; craft?: string;
    seoTitle?: string; seoDescription?: string; hsnCode?: string; taxRate?: number;
    images?: { url: string; altText?: string; sortOrder?: number }[];
  }) {
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) throw createError('SKU already exists', 409);

    const slug = await this.generateUniqueSlug(data.name);

    return prisma.product.create({
      data: {
        ...data,
        slug,
        price: data.price,
        salePrice: data.salePrice ?? null,
        costPrice: data.costPrice ?? null,
        stock: data.stock ?? 0,
        images: data.images ? { create: data.images } : undefined,
      },
      include: { images: true, category: true },
    });
  }

  async findAll(query: {
    page?: number; limit?: number; skip?: number;
    status?: ProductStatus; categoryId?: string; featured?: boolean;
    bestseller?: boolean; newArrival?: boolean;
    search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
    minPrice?: number; maxPrice?: number;
  }) {
    const where: Prisma.ProductWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.featured !== undefined) where.featured = query.featured;
    if (query.bestseller !== undefined) where.bestseller = query.bestseller;
    if (query.newArrival !== undefined) where.newArrival = query.newArrival;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    (orderBy as Record<string, string>)[sortField] = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: query.skip ?? 0,
        take: query.limit ?? 20,
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: true },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(idOrSlug: string) {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        variants: true,
      },
    });
    if (!product) throw createError('Product not found', 404);
    return product;
  }

  async update(id: string, data: Partial<{
    name: string; sku: string; price: number; salePrice: number | null;
    description: string; shortDescription: string; stock: number;
    status: ProductStatus; featured: boolean; bestseller: boolean;
    newArrival: boolean; fabric: string; craft: string;
    seoTitle: string; seoDescription: string; taxRate: number;
    categoryId: string;
  }>) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw createError('Product not found', 404);

    if (data.sku && data.sku !== product.sku) {
      const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existing) throw createError('SKU already in use', 409);
    }

    return prisma.product.update({
      where: { id },
      data,
      include: { images: true, category: true },
    });
  }

  async delete(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw createError('Product not found', 404);
    return prisma.product.delete({ where: { id } });
  }

  async addImages(productId: string, images: { url: string; altText?: string; sortOrder?: number }[]) {
    await prisma.productImage.createMany({
      data: images.map((img) => ({ ...img, productId })),
    });
    return prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async deleteImage(imageId: string) {
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) throw createError('Image not found', 404);
    return prisma.productImage.delete({ where: { id: imageId } });
  }

  async reorderImages(productId: string, imageOrders: { id: string; sortOrder: number }[]) {
    await Promise.all(
      imageOrders.map(({ id, sortOrder }) =>
        prisma.productImage.update({ where: { id }, data: { sortOrder } })
      )
    );
  }

  async bulkUpdate(ids: string[], data: Partial<{ status: ProductStatus; featured: boolean; price: number; stock: number }>) {
    return prisma.product.updateMany({ where: { id: { in: ids } }, data });
  }

  async bulkDelete(ids: string[]) {
    return prisma.product.deleteMany({ where: { id: { in: ids } } });
  }

  async updateStock(productId: string, quantity: number, reason?: string, variantId?: string) {
    return prisma.$transaction(async (tx) => {
      if (variantId) {
        const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
        if (!variant) throw createError('Variant not found', 404);
        const newStock = variant.stock + quantity;
        if (newStock < 0) throw createError('Insufficient stock', 400);
        const updated = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: newStock },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId,
            variantId,
            type: quantity > 0 ? 'ADJUSTMENT' : 'SALE',
            quantity: Math.abs(quantity),
            previousStock: variant.stock,
            newStock,
            reason,
          },
        });
        return updated;
      } else {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw createError('Product not found', 404);
        const newStock = product.stock + quantity;
        if (newStock < 0) throw createError('Insufficient stock', 400);
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: newStock },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId,
            type: quantity > 0 ? 'ADJUSTMENT' : 'SALE',
            quantity: Math.abs(quantity),
            previousStock: product.stock,
            newStock,
            reason,
          },
        });
        return updated;
      }
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = generateSlug(name);
    let suffix = 0;
    while (await prisma.product.findUnique({ where: { slug } })) {
      suffix++;
      slug = `${generateSlug(name)}-${suffix}`;
    }
    return slug;
  }
}
