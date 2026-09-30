import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, sendSuccess, sendError } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../../config';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure S3
const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// Multer: memory storage (before S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, GIF allowed'));
    }
  },
});

const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PRODUCT_MANAGER'] as const;

// Upload single image
router.post('/image', authenticate, authorize(...ADMIN), upload.single('image'), asyncHandler(async (req: any, res: any) => {
  if (!req.file) return sendError(res, 'No image provided', 422);

  const ext = path.extname(req.file.originalname).toLowerCase();
  const key = `products/${uuidv4()}${ext}`;

  if (config.aws.accessKeyId && config.aws.bucket) {
    await s3.send(new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));
    const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
    return sendSuccess(res, { url, key }, 'Image uploaded');
  } else {
    // Local fallback during development
    return sendSuccess(res, {
      url: `https://via.placeholder.com/450x572?text=Image+${Date.now()}`,
      key,
      note: 'AWS not configured — returning placeholder',
    }, 'Image uploaded (placeholder)');
  }
}));

// Upload multiple images
router.post('/images', authenticate, authorize(...ADMIN), upload.array('images', 10), asyncHandler(async (req: any, res: any) => {
  if (!req.files?.length) return sendError(res, 'No images provided', 422);

  const urls = [];
  for (const file of req.files as Express.Multer.File[]) {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `products/${uuidv4()}${ext}`;

    if (config.aws.accessKeyId && config.aws.bucket) {
      await s3.send(new PutObjectCommand({
        Bucket: config.aws.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      urls.push({ url: `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`, key });
    } else {
      urls.push({ url: `https://via.placeholder.com/450x572?text=Image+${Date.now()}`, key });
    }
  }

  return sendSuccess(res, urls, 'Images uploaded');
}));

export default router;
