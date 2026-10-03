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

const orderService = new OrderService();

export class OrderController {
  // Customer: Create new order
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await import("../../config/database").then((m) =>
      m.prisma.customer.findUnique({
        where: { userId: req.user!.id },
      }),
    );
    if (!customer) return sendError(res, "Customer profile not found", 404);
    const order = await orderService.createOrder(customer.id, req.body);
    return sendSuccess(res, order, "Order created", 201);
  });

  // Customer: Create Razorpay payment order
  createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;
    const rzpOrder = await orderService.createRazorpayOrder(orderId);
    return sendSuccess(res, rzpOrder, "Razorpay order created");
  });

  // Customer: Verify Razorpay payment
  verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.verifyRazorpayPayment(req.body);
    return sendSuccess(res, order, "Payment verified");
  });

  // Razorpay Webhook
  webhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    await orderService.handleWebhook(JSON.stringify(req.body), signature);
    return res.status(200).json({ received: true });
  });

  // Admin: List orders
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
      orderStatus: orderStatus as string,
      paymentStatus: paymentStatus as string,
      search: search as string,
      from: from as string,
      to: to as string,
    });
    return sendPaginated(res, data, total, page, limit);
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
    const customer = await import("../../config/database").then((m) =>
      m.prisma.customer.findUnique({
        where: { userId: req.user!.id },
      }),
    );
    if (!customer) return sendError(res, "Customer not found", 404);
    const { data, total } = await orderService.getOrders({
      page,
      limit,
      skip,
      customerId: customer.id,
    });
    return sendPaginated(res, data, total, page, limit);
  });

  // Admin: Update status
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
