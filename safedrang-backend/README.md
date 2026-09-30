# Safed Rang — Backend API

Production-ready Node.js + TypeScript + PostgreSQL backend for the Safed Rang e-commerce platform.

## Architecture

```
Frontend (React)  →  REST API (/api/v1)  →  Express + TypeScript
                                          →  PostgreSQL (via Prisma ORM)
                                          →  S3 (image storage)
                                          →  Razorpay (payments)
                                          →  Shiprocket (shipping)
```

## Tech Stack

| Layer        | Technology           |
|--------------|----------------------|
| Runtime      | Node.js + TypeScript |
| Framework    | Express.js           |
| Database     | PostgreSQL           |
| ORM          | Prisma               |
| Auth         | JWT + Refresh Tokens |
| Payments     | Razorpay             |
| Storage      | AWS S3               |
| Logging      | Winston              |
| Validation   | Joi                  |
| Security     | Helmet, CORS, Rate-Limit |

---

## 1. Installation

```bash
cd safedrang-backend
npm install
```

---

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Min 32-char secret for access tokens |
| `JWT_REFRESH_SECRET` | Min 32-char secret for refresh tokens |
| `RAZORPAY_KEY_ID` | From Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Set in Razorpay Webhook settings |
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret |
| `AWS_S3_BUCKET` | S3 bucket name |

---

## 3. Database Setup

Install and run PostgreSQL locally (or use a cloud provider like Railway, Supabase, Render).

Then create the database:
```sql
CREATE DATABASE safedrang;
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/safedrang?schema=public"
```

---

## 4. Run Migrations

```bash
npm run prisma:migrate
# or for production
npx prisma migrate deploy
```

---

## 5. Seed Database

Populates: Super Admin user, Categories, Sample Products, Coupons, Settings.

```bash
npm run prisma:seed
```

**Default Admin Credentials:**
- Email: `admin@safedrang.com`  
- Password: `Admin@123!`

---

## 6. Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:5000`  
API prefix: `/api/v1`

---

## 7. Production Deployment

```bash
npm run build
npm start
```

**Environment:** Set `NODE_ENV=production`

Recommended Platforms: Railway, Render, AWS EC2, DigitalOcean.

---

## 8. API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected routes require:
```
Authorization: Bearer <access_token>
```

### Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register customer |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |

#### Products (Public)
| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/products` | `status,categoryId,featured,search,sortBy,sortOrder,minPrice,maxPrice,page,limit` | List products |
| GET | `/products/:idOrSlug` | — | Get product detail |

#### Products (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| POST | `/products/bulk/update` | Bulk update |
| POST | `/products/bulk/delete` | Bulk delete |
| POST | `/products/:id/images` | Add images |
| DELETE | `/products/:id/images/:imageId` | Remove image |
| PUT | `/products/:id/images/reorder` | Reorder images |
| PUT | `/products/:id/stock` | Update stock |

#### Categories (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List categories |
| GET | `/categories/:slug` | Get category |

#### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order (auth) |
| POST | `/orders/razorpay-order` | Create Razorpay payment order |
| POST | `/orders/verify-payment` | Verify Razorpay signature |
| POST | `/orders/webhook` | Razorpay webhook |
| GET | `/orders/my` | Customer's orders |
| GET | `/orders/:id` | Order detail |
| GET | `/orders` | All orders (admin) |
| PUT | `/orders/:id/status` | Update status (admin) |
| PUT | `/orders/:id/tracking` | Add tracking (admin) |
| POST | `/orders/:id/refund` | Initiate refund (admin) |

#### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers/me` | Get own profile |
| PUT | `/customers/me` | Update own profile |
| GET | `/customers/me/wishlist` | Get wishlist |
| POST | `/customers/me/wishlist/:productId` | Add to wishlist |
| DELETE | `/customers/me/wishlist/:productId` | Remove from wishlist |
| GET | `/customers/me/addresses` | Get addresses |
| POST | `/customers/me/addresses` | Add address |
| PUT | `/customers/me/addresses/:id` | Update address |
| DELETE | `/customers/me/addresses/:id` | Delete address |
| GET | `/customers` | List customers (admin) |
| GET | `/customers/:id` | Customer detail (admin) |

#### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/coupons/validate` | Validate coupon code |
| GET | `/coupons` | List coupons (admin) |
| POST | `/coupons` | Create coupon (admin) |
| PUT | `/coupons/:id` | Update coupon (admin) |
| DELETE | `/coupons/:id` | Delete coupon (admin) |

#### Analytics (Admin)
| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/analytics/dashboard` | `filter,from,to` | Dashboard metrics |
| GET | `/analytics/sales-chart` | `filter` | Sales chart data |

**Filter options:** `today`, `yesterday`, `last7`, `last30`, `thisMonth`, `prevMonth`, `custom`

#### Uploads (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/uploads/image` | Upload single image |
| POST | `/uploads/images` | Upload multiple images |

#### Inventory (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/transactions` | Inventory history |
| GET | `/inventory/low-stock` | Low stock products |
| POST | `/inventory/adjust` | Manual adjustment |

---

## 9. Razorpay Configuration

1. Create account at [razorpay.com](https://razorpay.com)
2. Get `Key ID` and `Key Secret` from Dashboard → API Keys
3. Set up Webhook at Dashboard → Webhooks:
   - URL: `https://your-domain.com/api/v1/orders/webhook`
   - Events: `payment.captured`, `refund.processed`
4. Copy Webhook Secret and add to `.env`

**Payment Flow:**
```
1. POST /orders → creates order in DB
2. POST /orders/razorpay-order → creates Razorpay order, returns rzp_order_id
3. Frontend opens Razorpay popup
4. POST /orders/verify-payment → verifies signature SERVER-SIDE
5. Stock deducted only after verified payment
```

---

## 10. Storage Configuration (AWS S3)

1. Create S3 bucket (e.g., `safedrang-media`)
2. Set bucket policy for public read
3. Create IAM user with `s3:PutObject` permission
4. Add credentials to `.env`

---

## Role & Permissions

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full access |
| `ADMIN` | Full access except system settings |
| `MANAGER` | Orders, Products, Analytics |
| `ORDER_MANAGER` | Orders only |
| `PRODUCT_MANAGER` | Products, Inventory |
| `CUSTOMER_SUPPORT` | Customers, Orders (read) |
| `VIEW_ONLY` | Read-only analytics |
| `CUSTOMER` | Own profile, orders, wishlist |

---

## Standard API Response Format

### Success
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

### Paginated
```json
{
  "success": true,
  "message": "Success",
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": null
}
```

---

## Project Structure

```
safedrang-backend/
├── prisma/
│   ├── schema.prisma       # Database schema (all 20+ tables)
│   └── seed.ts             # Seed script
├── src/
│   ├── app.ts              # Express app + server
│   ├── config/
│   │   ├── index.ts        # App configuration
│   │   └── database.ts     # Prisma client
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT auth + RBAC
│   │   └── error.middleware.ts  # Global error handler
│   ├── modules/
│   │   ├── auth/           # Register, Login, Refresh, Logout
│   │   ├── products/       # Full CRUD, variants, bulk ops
│   │   ├── categories/     # Hierarchical categories
│   │   ├── orders/         # Order lifecycle + Razorpay + webhooks
│   │   ├── customers/      # Profile, addresses, wishlist
│   │   ├── coupons/        # Coupon management + validation
│   │   ├── inventory/      # Stock management + history
│   │   ├── analytics/      # Dashboard metrics + charts
│   │   └── uploads/        # S3 image uploads
│   └── utils/
│       ├── logger.ts       # Winston logger
│       └── response.ts     # Standard response helpers
└── .env.example
```
