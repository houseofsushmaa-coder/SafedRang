import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  sendSuccess,
  sendError,
  sendPaginated,
  asyncHandler,
  getPagination,
} from "../../utils/response";
import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";

const orderService = new OrderService();

export class OrderController {
  // Customer: Create new order (returns order details only — NOT payment session yet)
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user!.id },
    });
    if (!customer) return sendError(res, "Customer profile not found", 404);
    const order = await orderService.createOrder(customer.id, req.body);
    return sendSuccess(res, order, "Order created", 201);
  });

  // Customer: Create Cashfree payment session for an existing pending order
  createCashfreePaymentOrder = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { orderId, customerDetails } = req.body;
      if (!orderId)
        return sendError(res, "orderId is required", 422);
      if (
        !customerDetails?.name ||
        !customerDetails?.email ||
        !customerDetails?.phone
      ) {
        return sendError(
          res,
          "customerDetails (name, email, phone) are required",
          422,
        );
      }
      const result = await orderService.createCashfreePaymentOrder(
        orderId,
        customerDetails,
      );
      // Return ONLY what the frontend needs — never the secret key
      return sendSuccess(res, {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        paymentSessionId: result.paymentSessionId,
        cfEnvironment: result.cfEnvironment,
        amount: result.amount,
      });
    },
  );

  // Customer: Server-side payment verification after Cashfree redirect
  verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, cfOrderId } = req.body;
    if (!orderId || !cfOrderId)
      return sendError(res, "orderId and cfOrderId are required", 422);
    const result = await orderService.verifyCashfreePayment(orderId, cfOrderId);
    return sendSuccess(res, result, "Payment status verified");
  });

  // Cashfree Webhook — raw body required (configured in routes)
  cashfreeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;

    if (!signature || !timestamp) {
      logger.warn("Cashfree webhook missing signature or timestamp headers");
      return res.status(400).json({ success: false, message: "Missing signature headers" });
    }

    const rawBody =
      typeof req.body === "string"
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body.toString("utf-8")
          : JSON.stringify(req.body);

    const result = await orderService.handleCashfreeWebhook(
      rawBody,
      signature,
      timestamp,
    );
    return res.status(200).json(result);
  });

  // Admin: List orders (with Cashfree payment info)
  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(
      req.query as Record<string, string>,
    );
    const q = req.query as Record<string, string>;
    const { orderStatus, paymentStatus, search, from, to } = q;
    const { data, total } = await orderService.getOrders({
      page,
      limit,
      skip,
      orderStatus,
      paymentStatus,
      search,
      from,
      to,
    });
    return sendPaginated(res, data, total, page, limit);
  });

  // Admin: List payments
  listPayments = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(
      req.query as Record<string, string>,
    );
    const q = req.query as Record<string, string>;
    const { status, search } = q;
    const { payments, total } = await orderService.getPayments({
      page,
      limit,
      skip,
      status,
      search,
    });
    return sendPaginated(res, payments, total, page, limit);
  });

  // Admin/Customer: Get one order
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrder(req.params.id as string);
    return sendSuccess(res, order);
  });

  // Customer: My orders
  myOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, skip } = getPagination(
      req.query as Record<string, string>,
    );
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user!.id },
    });
    if (!customer) return sendError(res, "Customer not found", 404);
    const { data, total } = await orderService.getOrders({
      page,
      limit,
      skip,
      customerId: customer.id,
    });
    return sendPaginated(res, data, total, page, limit);
  });

  // Admin: Update order status
  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, note } = req.body;
    const order = await orderService.updateStatus(
      req.params.id as string,
      status,
      note,
    );
    return sendSuccess(res, order, "Status updated");
  });

  // Admin: Add tracking
  addTracking = asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber, trackingUrl, provider } = req.body;
    if (!trackingNumber) return sendError(res, "Tracking number required", 422);
    const shipment = await orderService.updateTracking(
      req.params.id as string,
      trackingNumber,
      trackingUrl,
      provider,
    );
    return sendSuccess(res, shipment, "Tracking added");
  });

  // Admin: Initiate refund
  refund = asyncHandler(async (req: Request, res: Response) => {
    const { amount, reason } = req.body;
    if (!amount) return sendError(res, "Refund amount required", 422);
    const refund = await orderService.initiateRefund(
      req.params.id as string,
      amount,
      reason,
    );
    return sendSuccess(res, refund, "Refund initiated");
  });
}
