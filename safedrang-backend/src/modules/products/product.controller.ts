import { Request, Response } from "express";
import { ProductService } from "./product.service";
import {
  sendSuccess,
  sendError,
  sendPaginated,
  asyncHandler,
  getPagination,
} from "../../utils/response";
import { ProductStatus } from "@prisma/client";

const productService = new ProductService();

export class ProductController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(
      req.query as Record<string, string>,
    );
    const q = req.query as Record<string, string>;
    const {
      status,
      categoryId,
      featured,
      bestseller,
      newArrival,
      search,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
    } = q;

    const { data, total } = await productService.findAll({
      page,
      limit,
      skip,
      status: status as ProductStatus,
      categoryId,
      featured:
        featured === "true" ? true : featured === "false" ? false : undefined,
      bestseller: bestseller === "true" ? true : undefined,
      newArrival: newArrival === "true" ? true : undefined,
      search,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    return sendPaginated(res, data, total, page, limit);
  });

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.findOne(req.params.idOrSlug as string);
    return sendSuccess(res, product);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.create(req.body);
    return sendSuccess(res, product, "Product created", 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.update(
      req.params.id as string,
      req.body,
    );
    return sendSuccess(res, product, "Product updated");
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await productService.delete(req.params.id as string);
    return sendSuccess(res, null, "Product deleted");
  });

  bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { ids, ...data } = req.body;
    if (!ids?.length) return sendError(res, "IDs required", 422);
    await productService.bulkUpdate(ids, data);
    return sendSuccess(res, null, "Products updated");
  });

  bulkImport = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) return sendError(res, "No file uploaded", 400);
    const result = await productService.importFromCsv(req.file.buffer);
    return sendSuccess(res, result, "Products imported successfully");
  });

  bulkDelete = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!ids?.length) return sendError(res, "IDs required", 422);
    await productService.bulkDelete(ids);
    return sendSuccess(res, null, "Products deleted");
  });

  addImages = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.addImages(
      req.params.id as string,
      req.body.images,
    );
    return sendSuccess(res, product, "Images added");
  });

  deleteImage = asyncHandler(async (req: Request, res: Response) => {
    await productService.deleteImage(req.params.imageId as string);
    return sendSuccess(res, null, "Image deleted");
  });

  reorderImages = asyncHandler(async (req: Request, res: Response) => {
    await productService.reorderImages(
      req.params.id as string,
      req.body.images,
    );
    return sendSuccess(res, null, "Images reordered");
  });

  updateStock = asyncHandler(async (req: Request, res: Response) => {
    const { quantity, reason, variantId } = req.body;
    const result = await productService.updateStock(
      req.params.id as string,
      quantity,
      reason,
      variantId,
    );
    return sendSuccess(res, result, "Stock updated");
  });
}
