import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "../../config/database";
import { config } from "../../config";
import { createError } from "../../middleware/error.middleware";
import { generateOrderNumber } from "../../utils/response";

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export class OrderService {
  async createOrder(
    customerId: string,
    data: {
      items: { productId: string; variantId?: string; quantity: number }[];
      shippingAddress: object;
      billingAddress?: object;
      couponCode?: string;
      paymentMethod: "RAZORPAY" | "COD";
      customerNote?: string;
      shippingMethod?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate items and lock stock
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
          throw createError(`Insufficient stock for "${product.name}"`, 400);

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

      // 2. Validate coupon
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

      // 3. Calculate totals
      const shippingCharge = subtotal - discount > 999 ? 0 : 99; // Free shipping above ₹999
      const tax = orderItems.reduce((sum, i) => sum + i.tax, 0);
      const total = subtotal - discount + shippingCharge + tax;

      // 4. Create order
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId,
          subtotal,
          discount,
          shippingCharge,
          tax,
          total,
          paymentMethod: data.paymentMethod as "RAZORPAY" | "COD",
          paymentStatus: data.paymentMethod === "COD" ? "PENDING" : "PENDING",
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

      // 5. Deduct stock (only for COD; for Razorpay, deduct after payment confirmation)
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
        // Update coupon usage for COD
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
    });
  }

  async createRazorpayOrder(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw createError("Order not found", 404);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100),
      currency: "INR",
      receipt: order.orderNumber,
    });

    await prisma.payment.create({
      data: {
        orderId,
        gateway: "razorpay",
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        status: "PENDING",
      },
    });

    return razorpayOrder;
  }

  async verifyRazorpayPayment(data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    // CRITICAL: Verify signature server-side
    const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== data.razorpaySignature) {
      throw createError("Payment verification failed - invalid signature", 400);
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { items: true },
      });
      if (!order) throw createError("Order not found", 404);

      // Update payment record
      await tx.payment.updateMany({
        where: { razorpayOrderId: data.razorpayOrderId },
        data: {
          transactionId: data.razorpayPaymentId,
          status: "PAID",
          gatewayResponse: data as any,
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: data.orderId,
          status: "CONFIRMED",
          note: "Payment confirmed via Razorpay",
        },
      });

      // Deduct stock after confirmed payment
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

      return tx.order.findUnique({
        where: { id: data.orderId },
        include: { items: true, payments: true },
      });
    });
  }

  async handleWebhook(rawBody: string, signature: string) {
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw createError("Invalid webhook signature", 400);
    }

    const event = JSON.parse(rawBody);
    // Handle idempotently
    if (event.event === "payment.captured") {
      // Already handled via verify endpoint, but can sync here
    } else if (event.event === "refund.processed") {
      const refundId = event.payload.refund.entity.id;
      await prisma.refund.updateMany({
        where: { gatewayRefundId: refundId },
        data: { status: "COMPLETED" },
      });
    }
  }

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

    // Trigger Razorpay refund
    let gatewayRefundId: string | undefined;
    if (payment.transactionId && config.razorpay.keyId) {
      try {
        const refund = await (razorpay.payments.refund as any)(
          payment.transactionId,
          {
            amount: Math.round(amount * 100),
            speed: "normal",
            notes: { reason: reason ?? "Customer request" },
          },
        );
        gatewayRefundId = refund.id;
      } catch (e) {
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
