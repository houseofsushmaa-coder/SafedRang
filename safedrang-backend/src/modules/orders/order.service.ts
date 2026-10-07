import crypto from "crypto";
import axios from "axios";
import { prisma } from "../../config/database";
import { config } from "../../config";
import { createError } from "../../middleware/error.middleware";
import { generateOrderNumber } from "../../utils/response";
import { logger } from "../../utils/logger";

// ── Cashfree API helper ──────────────────────────────────────────────────────

const CF_BASE_URL =
  config.cashfree.environment === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CF_SDK_ENV =
  config.cashfree.environment === "PRODUCTION" ? "production" : "sandbox";

const cfHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-version": "2023-08-01",
  "x-client-id": config.cashfree.appId,
  "x-client-secret": config.cashfree.secretKey,
});

export { CF_SDK_ENV };

// ── Cashfree order creation ───────────────────────────────────────────────────

async function createCashfreeOrder(payload: {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
  order_note?: string;
}) {
  const res = await axios.post(`${CF_BASE_URL}/orders`, payload, {
    headers: cfHeaders(),
    timeout: 15_000,
  });
  return res.data as {
    cf_order_id: string;
    order_id: string;
    payment_session_id: string;
    order_status: string;
  };
}

// ── Cashfree payment status ───────────────────────────────────────────────────

async function getCashfreeOrderPayments(cfOrderId: string) {
  const res = await axios.get(`${CF_BASE_URL}/orders/${cfOrderId}/payments`, {
    headers: cfHeaders(),
    timeout: 15_000,
  });
  return res.data as Array<{
    cf_payment_id: number;
    order_id: string;
    payment_status: string; // SUCCESS | FAILED | USER_DROPPED | NOT_ATTEMPTED | PENDING
    payment_amount: number;
    payment_currency: string;
    payment_message?: string;
    payment_time?: string;
  }>;
}

async function getCashfreeOrder(cfOrderId: string) {
  const res = await axios.get(`${CF_BASE_URL}/orders/${cfOrderId}`, {
    headers: cfHeaders(),
    timeout: 15_000,
  });
  return res.data as {
    cf_order_id: string;
    order_id: string;
    order_status: string; // ACTIVE | PAID | EXPIRED
    order_amount: number;
    order_currency: string;
    payment_session_id: string;
  };
}

// ── Webhook signature verification ───────────────────────────────────────────

function verifyCashfreeWebhookSignature(
  timestamp: string,
  rawBody: string,
  signature: string,
): boolean {
  const data = timestamp + rawBody;
  const expected = crypto
    .createHmac("sha256", config.cashfree.secretKey)
    .update(data)
    .digest("base64");
  return expected === signature;
}

// ── OrderService ─────────────────────────────────────────────────────────────

export class OrderService {
  /**
   * Creates an internal order (PENDING) from validated cart data.
   * All prices are fetched from DB — never from the client.
   */
  async createOrder(
    customerId: string,
    data: {
      items: { productId: string; variantId?: string; quantity: number }[];
      shippingAddress: object;
      billingAddress?: object;
      couponCode?: string;
      paymentMethod: "CASHFREE" | "COD";
      customerNote?: string;
      shippingMethod?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate items, lock stock, calculate subtotal from DB prices
      let subtotal = 0;
      const orderItems = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { images: { take: 1 } },
        });
        if (!product)
          throw createError(`Product ${item.productId} not found`, 404);
        if (product.status !== "PUBLISHED")
          throw createError(`Product "${product.name}" is not available`, 400);

        let price = Number(product.salePrice ?? product.price);
        let stock = product.stock;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant) throw createError("Variant not found", 404);
          price = Number(variant.salePrice ?? variant.price ?? price);
          stock = variant.stock;
        }

        if (stock < item.quantity)
          throw createError(
            `Insufficient stock for "${product.name}"`,
            400,
          );

        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: item.productId,
          variantId: item.variantId ?? null,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price,
          total: itemTotal,
          tax: (Number(product.taxRate) * price * item.quantity) / 100,
          imageUrl: product.images[0]?.url ?? null,
        });
      }

      // 2. Validate coupon server-side
      let discount = 0;
      let couponId: string | undefined;
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: data.couponCode },
        });
        if (!coupon || !coupon.status)
          throw createError("Invalid coupon code", 400);
        if (coupon.expiryDate && coupon.expiryDate < new Date())
          throw createError("Coupon expired", 400);
        if (
          coupon.minimumOrderAmount &&
          subtotal < Number(coupon.minimumOrderAmount)
        ) {
          throw createError(
            `Minimum order amount ₹${coupon.minimumOrderAmount} required`,
            400,
          );
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw createError("Coupon usage limit reached", 400);
        }
        discount =
          coupon.type === "PERCENTAGE"
            ? Math.min(
                (subtotal * Number(coupon.value)) / 100,
                Number(coupon.maximumDiscount ?? Infinity),
              )
            : Math.min(Number(coupon.value), subtotal);
        couponId = coupon.id;
      }

      // 3. Server-side shipping calculation
      const shippingSettings = await tx.setting.findMany({
        where: { key: { in: ["free_shipping_threshold", "default_shipping_charge"] } },
      });
      const freeThreshold =
        Number(
          (shippingSettings.find((s) => s.key === "free_shipping_threshold")
            ?.value as any)?.amount,
        ) || 999;
      const defaultShipping =
        Number(
          (shippingSettings.find((s) => s.key === "default_shipping_charge")
            ?.value as any)?.amount,
        ) || 99;
      const shippingCharge =
        subtotal - discount >= freeThreshold ? 0 : defaultShipping;

      // 4. Calculate totals
      const tax = orderItems.reduce((sum, i) => sum + i.tax, 0);
      const total = subtotal - discount + shippingCharge + tax;

      // 5. Create the internal order
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId,
          subtotal,
          discount,
          shippingCharge,
          tax,
          total,
          paymentMethod: data.paymentMethod as "CASHFREE" | "COD",
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          couponId,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress ?? data.shippingAddress,
          customerNote: data.customerNote,
          shippingMethod: data.shippingMethod,
          items: { create: orderItems },
          statusHistory: {
            create: { status: "PENDING", note: "Order placed" },
          },
        },
        include: { items: true },
      });

      // 6. For COD: deduct stock immediately, update coupon + customer stats
      if (data.paymentMethod === "COD") {
        for (const item of data.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
        if (couponId) {
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: total },
          },
        });
      }

      return order;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });
  }

  /**
   * Creates a Cashfree payment order server-side and returns only the
   * payment_session_id to the frontend. Idempotent: if a pending payment
   * already exists for this order, reuses it.
   */
  async createCashfreePaymentOrder(
    orderId: string,
    customerDetails: {
      name: string;
      email: string;
      phone: string;
    },
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, user: { select: { id: true } } } },
        payments: { where: { status: { in: ["PENDING", "PAYMENT_INITIATED"] } }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) throw createError("Order not found", 404);

    // Guard: do not re-initiate payment for an already-paid order
    if (order.paymentStatus === "PAID") {
      throw createError(
        "This order has already been paid. Please contact support if you were charged.",
        409,
      );
    }

    // Idempotency: if a valid session already exists, return it
    const existingPayment = order.payments[0];
    if (
      existingPayment?.cfPaymentSessionId &&
      existingPayment.status === "PAYMENT_INITIATED"
    ) {
      // Verify session is still active at Cashfree
      try {
        const cfOrder = await getCashfreeOrder(existingPayment.cfOrderId!);
        if (cfOrder.order_status === "ACTIVE") {
          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentSessionId: existingPayment.cfPaymentSessionId,
            cfEnvironment: CF_SDK_ENV,
            amount: Number(order.total),
          };
        }
      } catch {
        // Session expired/invalid — fall through to create a fresh one
      }
    }

    // Generate a safe, unique Cashfree order ID
    const cfOrderId = `SR${order.orderNumber.replace(/[^A-Z0-9]/g, "")}${Date.now().toString(36).toUpperCase()}`;

    // Idempotency key for this payment attempt
    const idempotencyKey = `${orderId}-${Date.now()}`;

    // Build return URL from configured base URL
    const baseUrl = config.frontendUrl.replace(/\/$/, "");
    let returnUrl = `${baseUrl}/payment/verify?order_id=${order.id}&cf_order_id=${cfOrderId}`;
    let webhookUrl = `${baseUrl.replace(/(:\d+)$/, "").replace("localhost", "127.0.0.1")}/api/v1/orders/cashfree-webhook`;

    // Cashfree Production requires HTTPS
    if (CF_SDK_ENV === "production") {
      returnUrl = returnUrl.replace("http://", "https://");
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        webhookUrl = "https://example.com/webhook"; // Dummy webhook for localhost only
      } else {
        webhookUrl = `${baseUrl}/api/v1/orders/cashfree-webhook`; // Real webhook for live server
      }
    }

    // Create Cashfree order server-side
    let cfOrderData: Awaited<ReturnType<typeof createCashfreeOrder>>;
    try {
      cfOrderData = await createCashfreeOrder({
        order_id: cfOrderId,
        order_amount: Number(Number(order.total).toFixed(2)),
        order_currency: "INR",
        customer_details: {
          customer_id: order.customer.id,
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: webhookUrl,
        },
        order_note: `Order ${order.orderNumber}`,
      });
    } catch (err: any) {
      const cfMsg =
        err?.response?.data?.message || err?.message || "Unknown error";
      logger.error(`Cashfree order creation failed: ${cfMsg}`, {
        orderId,
        cfOrderId,
      });
      throw createError(
        "Unable to initialize payment. Please try again.",
        502,
      );
    }

    // Persist payment record
    await prisma.payment.create({
      data: {
        orderId,
        gateway: "cashfree",
        cfOrderId: cfOrderData.order_id,
        cfPaymentSessionId: cfOrderData.payment_session_id,
        idempotencyKey,
        amount: order.total,
        currency: "INR",
        status: "PAYMENT_INITIATED",
      },
    });

    // Mark order as payment initiated
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAYMENT_INITIATED" },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentSessionId: cfOrderData.payment_session_id,
      cfEnvironment: CF_SDK_ENV,
      amount: Number(order.total),
    };
  }

  /**
   * Server-side payment verification after customer returns from Cashfree.
   * Fetches payment status from Cashfree directly — never trusts the browser.
   */
  async verifyCashfreePayment(orderId: string, cfOrderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
    });
    if (!order) throw createError("Order not found", 404);

    // If already paid, return success without re-processing
    if (order.paymentStatus === "PAID") {
      return {
        status: "PAID",
        orderNumber: order.orderNumber,
        total: Number(order.total),
        alreadyConfirmed: true,
      };
    }

    // Fetch actual payment status from Cashfree
    let payments: Awaited<ReturnType<typeof getCashfreeOrderPayments>>;
    let cfOrderData: Awaited<ReturnType<typeof getCashfreeOrder>>;
    try {
      [payments, cfOrderData] = await Promise.all([
        getCashfreeOrderPayments(cfOrderId),
        getCashfreeOrder(cfOrderId),
      ]);
    } catch (err: any) {
      logger.error(`Cashfree verification fetch failed: ${err.message}`);
      throw createError(
        "Unable to verify payment status. Please contact support with your order number.",
        502,
      );
    }

    // Find the payment record linked to this CF order
    const paymentRecord = order.payments.find((p) => p.cfOrderId === cfOrderId);

    // Check amounts match (anti-tampering)
    const expectedAmount = Number(Number(order.total).toFixed(2));

    // Find successful payment
    const successfulPayment = payments.find(
      (p) =>
        p.payment_status === "SUCCESS" &&
        Math.abs(p.payment_amount - expectedAmount) < 1, // allow ₹1 float tolerance
    );

    if (successfulPayment) {
      // Verify server-side amount integrity
      if (Math.abs(successfulPayment.payment_amount - expectedAmount) >= 1) {
        logger.error(`Amount mismatch! Expected ${expectedAmount}, got ${successfulPayment.payment_amount} for order ${orderId}`);
        throw createError("Payment amount mismatch. Contact support.", 400);
      }

      await this._confirmPayment(order, paymentRecord?.id, {
        cfPaymentId: String(successfulPayment.cf_payment_id),
        cfOrderId,
        gatewayResponse: successfulPayment,
      });

      return {
        status: "PAID",
        orderNumber: order.orderNumber,
        total: Number(order.total),
        alreadyConfirmed: false,
      };
    }

    // Check for failed/dropped payment
    const failedPayment = payments.find((p) =>
      ["FAILED", "USER_DROPPED"].includes(p.payment_status),
    );

    if (failedPayment || cfOrderData.order_status === "EXPIRED") {
      // Update payment record to FAILED
      if (paymentRecord) {
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: "FAILED",
            gatewayResponse: failedPayment ?? { order_status: "EXPIRED" },
          },
        });
      }
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      });

      return {
        status: "FAILED",
        orderNumber: order.orderNumber,
        total: Number(order.total),
      };
    }

    // Payment pending
    return {
      status: "PENDING",
      orderNumber: order.orderNumber,
      total: Number(order.total),
    };
  }

  /**
   * Cashfree webhook handler.
   * CRITICAL: Must use raw body for signature verification.
   */
  async handleCashfreeWebhook(
    rawBody: string,
    signature: string,
    timestamp: string,
  ) {
    // 1. Verify signature FIRST before parsing
    if (!verifyCashfreeWebhookSignature(timestamp, rawBody, signature)) {
      logger.warn("Invalid Cashfree webhook signature received");
      throw createError("Invalid webhook signature", 401);
    }

    // 2. Parse only after signature is valid
    const event = JSON.parse(rawBody);
    const eventType: string = event.type;
    const data = event.data;

    logger.info(`Cashfree webhook received: ${eventType}`);

    // 3. Idempotency: skip if we've already processed this event
    const eventId: string = event.id || "";
    if (eventId) {
      const alreadyProcessed = await prisma.payment.findFirst({
        where: { webhookEventId: eventId },
      });
      if (alreadyProcessed) {
        logger.info(`Webhook ${eventId} already processed, skipping`);
        return { received: true, skipped: true };
      }
    }

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      const cfOrderId: string = data.order?.order_id;
      const cfPaymentId: string = String(data.payment?.cf_payment_id ?? "");
      const paymentAmount: number = data.payment?.payment_amount;
      const paymentCurrency: string = data.payment?.payment_currency || "INR";

      if (!cfOrderId) {
        logger.warn("Webhook missing order_id", event);
        return { received: true };
      }

      // Find our internal payment record by cfOrderId
      const paymentRecord = await prisma.payment.findFirst({
        where: { cfOrderId },
        include: {
          order: {
            include: { items: true },
          },
        },
      });

      if (!paymentRecord) {
        logger.warn(`No payment record for CF order ${cfOrderId}`);
        return { received: true };
      }

      // Idempotency: skip if order is already paid
      if (paymentRecord.order.paymentStatus === "PAID") {
        logger.info(`Order ${paymentRecord.orderId} already PAID, skipping webhook`);
        if (eventId) {
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { webhookEventId: eventId },
          }).catch(() => {});
        }
        return { received: true, skipped: true };
      }

      // Verify amounts
      const expectedAmount = Number(Number(paymentRecord.order.total).toFixed(2));
      if (Math.abs(paymentAmount - expectedAmount) >= 1) {
        logger.error(
          `Webhook amount mismatch! Order ${paymentRecord.orderId}: expected ${expectedAmount}, got ${paymentAmount}`,
        );
        return { received: true, warning: "amount_mismatch" };
      }

      await this._confirmPayment(paymentRecord.order, paymentRecord.id, {
        cfPaymentId,
        cfOrderId,
        gatewayResponse: data,
        webhookEventId: eventId || undefined,
      });
    } else if (eventType === "PAYMENT_FAILED_WEBHOOK") {
      const cfOrderId: string = data.order?.order_id;
      if (cfOrderId) {
        const paymentRecord = await prisma.payment.findFirst({
          where: { cfOrderId },
          include: { order: true },
        });
        if (
          paymentRecord &&
          paymentRecord.order.paymentStatus !== "PAID" &&
          paymentRecord.order.paymentStatus !== "FAILED"
        ) {
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: {
              status: "FAILED",
              gatewayResponse: data,
              ...(eventId && { webhookEventId: eventId }),
            },
          });
          await prisma.order.update({
            where: { id: paymentRecord.orderId },
            data: { paymentStatus: "FAILED" },
          });
        }
      }
    }

    return { received: true };
  }

  /**
   * Confirms a payment: marks order PAID, deducts stock, updates customer stats.
   * Fully idempotent.
   */
  private async _confirmPayment(
    order: any,
    paymentRecordId: string | undefined,
    details: {
      cfPaymentId: string;
      cfOrderId: string;
      gatewayResponse: any;
      webhookEventId?: string;
    },
  ) {
    await prisma.$transaction(async (tx) => {
      // Update payment record
      if (paymentRecordId) {
        await tx.payment.update({
          where: { id: paymentRecordId },
          data: {
            cfPaymentId: details.cfPaymentId,
            transactionId: details.cfPaymentId,
            status: "PAID",
            gatewayResponse: details.gatewayResponse,
            ...(details.webhookEventId && {
              webhookEventId: details.webhookEventId,
            }),
          },
        });
      }

      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          note: `Payment confirmed via Cashfree (CF Payment ID: ${details.cfPaymentId})`,
        },
      });

      // Deduct stock (idempotent: only if order was not yet PAID)
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Update customer stats
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: order.total },
        },
      });

      // Update coupon usage
      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
    }, {
      maxWait: 10000,
      timeout: 30000,
    });
  }

  // ── Admin / Customer read methods ──────────────────────────────────────────

  async getOrders(query: {
    page?: number;
    limit?: number;
    skip?: number;
    customerId?: string;
    orderStatus?: string;
    paymentStatus?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};
    if (query.customerId) where.customerId = query.customerId;
    if (query.orderStatus) where.orderStatus = query.orderStatus;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: "insensitive" } },
        { customer: { name: { contains: query.search, mode: "insensitive" } } },
        { customer: { phone: { contains: query.search } } },
        {
          customer: { email: { contains: query.search, mode: "insensitive" } },
        },
      ];
    }
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: query.skip ?? 0,
        take: query.limit ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: { include: { product: { select: { name: true } } } },
          payments: { select: { cfOrderId: true, cfPaymentId: true, status: true, gateway: true, amount: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { data, total };
  }

  async getOrder(id: string) {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        customer: true,
        items: { include: { product: { include: { images: { take: 1 } } } } },
        payments: true,
        refunds: true,
        shipments: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) throw createError("Order not found", 404);
    return order;
  }

  async getPayments(query: {
    page?: number;
    limit?: number;
    skip?: number;
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (query.status && query.status !== "ALL") where.status = query.status;
    if (query.search) {
      where.OR = [
        { cfOrderId: { contains: query.search, mode: "insensitive" } },
        { cfPaymentId: { contains: query.search, mode: "insensitive" } },
        { transactionId: { contains: query.search, mode: "insensitive" } },
        { order: { orderNumber: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: query.skip ?? 0,
        take: query.limit ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: { orderNumber: true, customer: { select: { name: true, email: true } } },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  async updateStatus(orderId: string, status: string, note?: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status as any },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId, status: status as any, note },
    });
    return this.getOrder(orderId);
  }

  async updateTracking(
    orderId: string,
    trackingNumber: string,
    trackingUrl?: string,
    provider?: string,
  ) {
    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        trackingNumber,
        trackingUrl,
        provider: provider ?? "manual",
        status: "CREATED",
      },
    });
    await this.updateStatus(
      orderId,
      "SHIPPED",
      `Shipped via ${provider ?? "manual"} - ${trackingNumber}`,
    );
    return shipment;
  }

  async initiateRefund(orderId: string, amount: number, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { where: { status: "PAID" } } },
    });
    if (!order) throw createError("Order not found", 404);
    if (!order.payments.length)
      throw createError("No confirmed payment found", 400);

    const payment = order.payments[0];

    // Initiate Cashfree refund
    let gatewayRefundId: string | undefined;
    if (payment.cfPaymentId && config.cashfree.appId) {
      try {
        const refundRes = await axios.post(
          `${CF_BASE_URL}/orders/${payment.cfOrderId}/refunds`,
          {
            refund_amount: amount,
            refund_id: `REFUND-${orderId}-${Date.now()}`,
            refund_note: reason ?? "Customer request",
          },
          { headers: cfHeaders(), timeout: 15_000 },
        );
        gatewayRefundId = refundRes.data?.cf_refund_id;
      } catch (e: any) {
        logger.error(`Cashfree refund initiation failed: ${e?.message}`);
        // Log but don't fail — admin can process manually
      }
    }

    const refund = await prisma.refund.create({
      data: {
        orderId,
        paymentId: payment.id,
        amount,
        reason,
        status: gatewayRefundId ? "PROCESSING" : "PENDING",
        gatewayRefundId,
      },
    });

    const isFullRefund = amount >= Number(order.total);
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
        orderStatus: isFullRefund ? "REFUNDED" : order.orderStatus,
      },
    });

    return refund;
  }
}
