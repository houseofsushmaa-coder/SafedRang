import { prisma } from "../../config/database";
import { createError } from "../../middleware/error.middleware";

export class AnalyticsService {
  private dateRange(filter: string, from?: string, to?: string) {
    const now = new Date();
    const startOf = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate());

    switch (filter) {
      case "today":
        return { gte: startOf(now), lte: now };
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return {
          gte: startOf(y),
          lte: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59),
        };
      }
      case "last7": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return { gte: d, lte: now };
      }
      case "last30": {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return { gte: d, lte: now };
      }
      case "thisMonth":
        return {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lte: now,
        };
      case "prevMonth": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return { gte: start, lte: end };
      }
      case "custom":
        if (!from || !to)
          throw createError("from and to dates required for custom range", 400);
        return { gte: new Date(from), lte: new Date(to) };
      default:
        return undefined;
    }
  }

  async getDashboard(filter = "last30", from?: string, to?: string) {
    const dateFilter = this.dateRange(filter, from, to);
    const createdAt = dateFilter ?? undefined;

    const [
      totalRevenue,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      newCustomers,
      avgOrderValue,
      bestSellers,
      lowStockProducts,
      refunds,
      totalProducts,
      recentOrdersRaw,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: "PAID", ...(createdAt && { createdAt }) },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { ...(createdAt && { createdAt }) } }),
      prisma.order.count({ where: { orderStatus: "PENDING" } }),
      prisma.order.count({
        where: { orderStatus: "DELIVERED", ...(createdAt && { createdAt }) },
      }),
      prisma.order.count({
        where: { orderStatus: "CANCELLED", ...(createdAt && { createdAt }) },
      }),
      prisma.customer.count(),
      prisma.customer.count({ where: { ...(createdAt && { createdAt }) } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID", ...(createdAt && { createdAt }) },
        _avg: { total: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.product.findMany({
        where: { stock: { lte: 5 }, status: "PUBLISHED" },
        select: { id: true, name: true, sku: true, stock: true },
        take: 10,
      }),
      prisma.refund.aggregate({
        where: { status: "COMPLETED", ...(createdAt && { createdAt }) },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.product.count(), // Total Products
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      }), // Recent Orders
    ]);

    // Get best seller product names
    const bestSellerIds = bestSellers.map((b) => b.productId);
    const bestSellerProducts = await prisma.product.findMany({
      where: { id: { in: bestSellerIds } },
      select: { id: true, name: true, sku: true, price: true },
    });

    const bestSellersWithNames = bestSellers.map((b) => ({
      ...b,
      product: bestSellerProducts.find((p) => p.id === b.productId),
    }));

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: Number(o.total),
      status: o.orderStatus,
      customerName: o.customer?.name || "Guest",
    }));

    return {
      revenue: {
        total: Number(totalRevenue._sum.total ?? 0),
        refunded: Number(refunds._sum.amount ?? 0),
        change: 0,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: pendingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      customers: { total: totalCustomers, new: newCustomers },
      products: { total: totalProducts, lowStock: lowStockProducts.length },
      avgOrderValue: Number(avgOrderValue._avg.total ?? 0),
      bestSellers: bestSellersWithNames,
      lowStockProducts,
      recentOrders,
      refunds: {
        count: refunds._count,
        amount: Number(refunds._sum.amount ?? 0),
      },
    };
  }

  async getSalesChart(filter = "last30") {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (filter === "last7" ? 7 : 30));

    const orders = await prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: startDate } },
      select: { total: true, createdAt: true },
    });

    // Group by day
    const grouped: Record<string, number> = {};
    for (const order of orders) {
      const day = order.createdAt.toISOString().split("T")[0];
      grouped[day] = (grouped[day] ?? 0) + Number(order.total);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }
}
