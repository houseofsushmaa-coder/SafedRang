import { supabase } from "../lib/supabase";
import { loadTrackingIntegrations, saveTrackingIntegrations as saveTrackingData } from "../lib/tracking";

// ==============================================================================
// SAFED RANG — ADMIN DATA SERVICE
// Every number shown in the admin comes from the database. When there is no
// data yet, functions return empty values (never invented sample figures).
// ==============================================================================

// ── Shared helpers ─────────────────────────────────────────────────────────────
const upper = (v) => String(v || "").toUpperCase();
const orderTotal = (o) => Number(o.total_amount ?? o.total ?? 0) || 0;
const isPaid = (o) => upper(o.payment_status) === "PAID";
const isCancelled = (o) => ["CANCELLED", "RETURNED", "REFUNDED"].includes(upper(o.order_status));
const isCod = (o) => upper(o.payment_method) === "COD";
const itemsOf = (o) => (Array.isArray(o.items) ? o.items : []);

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// Local calendar date key (toISOString would shift IST evenings into the next day)
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** [start, end) for a period, plus the equally long period before it. */
export function periodRange(period = "last30", now = new Date()) {
  const today = startOfDay(now);
  let start;
  let end = addDays(today, 1);
  switch (period) {
    case "today": start = today; break;
    case "yesterday": start = addDays(today, -1); end = today; break;
    case "last7": start = addDays(today, -6); break;
    case "thisMonth": start = new Date(today.getFullYear(), today.getMonth(), 1); break;
    case "prevMonth":
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "last90": start = addDays(today, -89); break;
    case "all": start = new Date(2000, 0, 1); break;
    case "last30":
    default: start = addDays(today, -29);
  }
  const span = end - start;
  return { start, end, prevStart: new Date(start - span), prevEnd: start };
}

const inRange = (o, start, end) => {
  const t = new Date(o.created_at || o.createdAt || 0);
  return t >= start && t < end;
};

/** % change vs the previous period, or null when there's nothing to compare. */
const pctChange = (now, before) => (before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null);

async function fetchAllOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Sold quantities/revenue per product from paid orders. */
function productSales(orders) {
  const map = new Map();
  for (const o of orders) {
    for (const it of itemsOf(o)) {
      const id = String(it.productId || it.id || it.title || it.name || "unknown");
      const qty = Number(it.quantity || 1);
      const price = Number(it.price || 0);
      const row = map.get(id) || { productId: id, product: { name: it.title || it.name || "Product" }, _sum: { quantity: 0 }, revenue: 0 };
      row._sum.quantity += qty;
      row.revenue += price * qty;
      map.set(id, row);
    }
  }
  return [...map.values()].sort((a, b) => b._sum.quantity - a._sum.quantity || b.revenue - a.revenue);
}

// Handcrafted pieces are stocked one or two at a time, so "low stock" means
// the last piece is left. (Every product's lowStockThreshold is the column
// default of 5, which would flag almost the whole catalogue.)
export const LOW_STOCK_AT = 1;
export const isLowStock = (stock) => Number(stock) > 0 && Number(stock) <= LOW_STOCK_AT;

const PAYMENT_LABELS = { COD: "Cash on Delivery", CASHFREE: "Online (Cashfree)" };

const safeJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// ─────────────────────────────────────────────
// 1. DASHBOARD & ANALYTICS
// ─────────────────────────────────────────────
// Fulfilment status → customer email it triggers (see supabase/functions/_shared/notify.ts).
export const ORDER_STATUS_EMAIL = {
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
};

// Order email settings (read by the server: supabase/functions/_shared/notify.ts).
export const EMAIL_EVENTS = [
  ["order_placed", "Order placed", "Order confirmation with items, total and address"],
  ["shipped", "Shipped", "Courier name, tracking number and tracking link"],
  ["out_for_delivery", "Out for delivery", "Arriving today (COD amount reminder)"],
  ["delivered", "Delivered", "Thank-you note with care tips"],
  ["cancelled", "Cancelled", "Cancellation, with refund note for paid orders"],
  ["returned", "Returned", "Return received"],
];
const EMAIL_DEFAULT_TOGGLES = {
  order_placed: { customer: true, admin: true },
  shipped: { customer: true, admin: false },
  out_for_delivery: { customer: true, admin: false },
  delivered: { customer: true, admin: false },
  cancelled: { customer: true, admin: true },
  returned: { customer: true, admin: true },
};
const isEmailAddress = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());
export function normaliseEmailConfig(raw) {
  const c = (typeof raw === "string" ? safeJson(raw) : raw) || {};
  const list = Array.isArray(c.adminEmails) ? c.adminEmails : String(c.adminEmails || "").split(/[\s,;]+/);
  return {
    adminEmails: [...new Set(list.map((e) => String(e).trim().toLowerCase()).filter(isEmailAddress))],
    fromName: String(c.fromName ?? "Safed Rang").trim(),
    fromEmail: String(c.fromEmail ?? "").trim(),
    replyTo: String(c.replyTo ?? "").trim(),
    events: Object.fromEntries(
      Object.entries(EMAIL_DEFAULT_TOGGLES).map(([k, d]) => [k, { ...d, ...(c.events?.[k] || {}) }])
    ),
  };
}

export const adminService = {
  /**
   * Dashboard overview for a period, compared with the period before it.
   */
  async getDashboard(period = "last30") {
    try {
      const { start, end, prevStart, prevEnd } = periodRange(period);
      const [orders, productsRes, profilesRes] = await Promise.all([
        fetchAllOrders(),
        supabase.from("products").select("id, name, stock, stock_status, status, is_archived, \"lowStockThreshold\"").limit(2000),
        supabase.from("profiles").select("id, role, created_at").limit(5000),
      ]);
      if (productsRes.error) throw productsRes.error;

      const current = orders.filter((o) => inRange(o, start, end));
      const previous = orders.filter((o) => inRange(o, prevStart, prevEnd));
      const paidNow = current.filter(isPaid);
      const paidBefore = previous.filter(isPaid);

      const revenue = paidNow.reduce((s, o) => s + orderTotal(o), 0);
      const revenueBefore = paidBefore.reduce((s, o) => s + orderTotal(o), 0);
      const aov = paidNow.length ? Math.round(revenue / paidNow.length) : 0;
      const aovBefore = paidBefore.length ? Math.round(revenueBefore / paidBefore.length) : 0;

      const refunded = current.filter((o) => ["REFUNDED", "PARTIALLY_REFUNDED"].includes(upper(o.payment_status)));

      // Live, published catalogue (drafts and archived pieces excluded)
      const products = (productsRes.data || []).filter((p) => !p.is_archived && upper(p.status) !== "DRAFT" && upper(p.status) !== "ARCHIVED");
      const lowStockProducts = products
        .filter((p) => isLowStock(p.stock))
        .map((p) => ({ ...p, title: p.name }));
      const outOfStock = products.filter((p) => Number(p.stock) <= 0).length;

      const customers = (profilesRes.data || []).filter((p) => upper(p.role) === "CUSTOMER" || !p.role);
      const newCustomers = customers.filter((p) => p.created_at && inRange(p, start, end)).length;

      const recentOrders = orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNumber: o.id,
        customerName: o.customer_name || "Customer",
        customerEmail: o.customer_email || "",
        total: orderTotal(o),
        status: upper(o.order_status || "PENDING"),
        paymentStatus: upper(o.payment_status || "PENDING"),
        paymentMethod: PAYMENT_LABELS[upper(o.payment_method)] || o.payment_method || "—",
        createdAt: o.created_at,
        itemsCount: itemsOf(o).reduce((s, it) => s + Number(it.quantity || 1), 0),
      }));

      return {
        success: true,
        data: {
          revenue: { total: revenue, refunded: refunded.reduce((s, o) => s + orderTotal(o), 0), change: pctChange(revenue, revenueBefore) },
          orders: {
            total: current.length,
            change: pctChange(current.length, previous.length),
            pending: current.filter((o) => ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"].includes(upper(o.order_status))).length,
            processing: current.filter((o) => upper(o.order_status) === "PROCESSING").length,
            shipped: current.filter((o) => upper(o.order_status) === "SHIPPED").length,
            delivered: current.filter((o) => upper(o.order_status) === "DELIVERED").length,
            cancelled: current.filter(isCancelled).length,
          },
          customers: { total: customers.length, new: newCustomers },
          products: { total: products.length, lowStock: lowStockProducts.length, outOfStock },
          avgOrderValue: aov,
          avgOrderValueChange: pctChange(aov, aovBefore),
          lowStockProducts,
          bestSellers: productSales(paidNow).slice(0, 5),
          recentOrders,
          refunds: { count: refunded.length, amount: refunded.reduce((s, o) => s + orderTotal(o), 0) },
          totalProducts: products.length,
        },
      };
    } catch (err) {
      console.error("adminService.getDashboard error:", err);
      return { success: false, error: err.message, data: null };
    }
  },

  /**
   * Daily revenue/orders series for the period (paid orders).
   */
  async getSalesChart(period = "last30") {
    try {
      const { start, end } = periodRange(period);
      const orders = (await fetchAllOrders()).filter((o) => inRange(o, start, end) && isPaid(o));
      const byDay = new Map();
      for (const o of orders) {
        const k = dayKey(new Date(o.created_at));
        const row = byDay.get(k) || { revenue: 0, orders: 0 };
        row.revenue += orderTotal(o);
        row.orders += 1;
        byDay.set(k, row);
      }
      const points = [];
      for (let d = new Date(start); d < end; d = addDays(d, 1)) {
        const k = dayKey(d);
        points.push({ date: k, revenue: byDay.get(k)?.revenue || 0, orders: byDay.get(k)?.orders || 0 });
      }
      return points;
    } catch (err) {
      console.error("adminService.getSalesChart error:", err);
      return [];
    }
  },

  /**
   * Overview analytics from real orders. Traffic and funnel data need a
   * connected analytics tool (GA4), so they are not estimated here.
   */
  async getAnalytics(period = "last30") {
    const { start, end, prevStart, prevEnd } = periodRange(period);
    const [orders, profilesRes] = await Promise.all([
      fetchAllOrders(),
      supabase.from("profiles").select("id, role, created_at").limit(5000),
    ]);
    const current = orders.filter((o) => inRange(o, start, end));
    const previous = orders.filter((o) => inRange(o, prevStart, prevEnd));
    const paid = current.filter(isPaid);
    const paidBefore = previous.filter(isPaid);
    const revenue = paid.reduce((s, o) => s + orderTotal(o), 0);
    const revenueBefore = paidBefore.reduce((s, o) => s + orderTotal(o), 0);

    // Repeat customers: emails with 2+ paid orders, across all time.
    const paidAll = orders.filter(isPaid);
    const perCustomer = new Map();
    for (const o of paidAll) {
      const key = String(o.customer_email || o.user_id || "").toLowerCase();
      if (key) perCustomer.set(key, (perCustomer.get(key) || 0) + 1);
    }
    const buyers = perCustomer.size;
    const repeatBuyers = [...perCustomer.values()].filter((n) => n > 1).length;

    // Online checkouts started vs completed in the period (COD orders are placed directly).
    const online = current.filter((o) => !isCod(o));
    const onlinePaid = online.filter(isPaid).length;

    const customers = (profilesRes.data || []).filter((p) => upper(p.role) === "CUSTOMER" || !p.role);

    return {
      revenue: { total: revenue, change: pctChange(revenue, revenueBefore) },
      orders: {
        total: current.length,
        paid: paid.length,
        change: pctChange(current.length, previous.length),
        cod: current.filter(isCod).length,
        online: online.length,
        cancelled: current.filter(isCancelled).length,
      },
      avgOrderValue: paid.length ? Math.round(revenue / paid.length) : 0,
      onlineCheckout: { started: online.length, paid: onlinePaid, rate: online.length ? Math.round((onlinePaid / online.length) * 100) : null },
      repeatCustomerRate: buyers ? Math.round((repeatBuyers / buyers) * 100) : null,
      buyers,
      repeatBuyers,
      customers: { total: customers.length, new: customers.filter((p) => p.created_at && inRange(p, start, end)).length },
      bestSellers: productSales(paid).slice(0, 8),
    };
  },

  /**
   * Sales report: category, product, time-of-day and payment breakdowns.
   */
  async getSalesAnalytics(period = "last30") {
    const { start, end } = periodRange(period);
    const [orders, productsRes] = await Promise.all([
      fetchAllOrders(),
      supabase.from("products").select("id, name, price, salePrice, stock, category_name, status, is_archived").limit(2000),
    ]);
    if (productsRes.error) throw productsRes.error;
    const products = productsRes.data || [];
    const productById = new Map(products.map((p) => [String(p.id), p]));

    const current = orders.filter((o) => inRange(o, start, end));
    const paid = current.filter(isPaid);
    const netSales = paid.reduce((s, o) => s + orderTotal(o), 0);
    const grossSales = current.filter((o) => !isCancelled(o)).reduce((s, o) => s + orderTotal(o), 0);
    const cancelledValue = current.filter(isCancelled).reduce((s, o) => s + orderTotal(o), 0);
    const unitsSold = paid.reduce((s, o) => s + itemsOf(o).reduce((n, it) => n + Number(it.quantity || 1), 0), 0);

    // Category breakdown from the product each line belongs to
    const categories = new Map();
    for (const o of paid) {
      for (const it of itemsOf(o)) {
        const p = productById.get(String(it.productId || it.id));
        const cat = p?.category_name || "Uncategorised";
        const row = categories.get(cat) || { name: cat, revenue: 0, units: 0 };
        row.revenue += Number(it.price || 0) * Number(it.quantity || 1);
        row.units += Number(it.quantity || 1);
        categories.set(cat, row);
      }
    }
    const categoryData = [...categories.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .map((c) => ({ ...c, share: netSales ? Math.round((c.revenue / netSales) * 100) : 0 }));

    // When orders are placed (local time)
    const buckets = [["00–06", 0, 6], ["06–10", 6, 10], ["10–14", 10, 14], ["14–18", 14, 18], ["18–22", 18, 22], ["22–24", 22, 24]];
    const hourlyDistribution = buckets.map(([hour, from, to]) => {
      const list = paid.filter((o) => {
        const h = new Date(o.created_at).getHours();
        return h >= from && h < to;
      });
      return { hour, orders: list.length, revenue: list.reduce((s, o) => s + orderTotal(o), 0) };
    });
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeekTrends = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const list = paid.filter((o) => new Date(o.created_at).getDay() === d);
      return { day: dayNames[d], orders: list.length, revenue: list.reduce((s, o) => s + orderTotal(o), 0) };
    });

    // Payment methods across all orders placed in the period
    const methods = new Map();
    for (const o of current.filter((x) => !isCancelled(x))) {
      const label = PAYMENT_LABELS[upper(o.payment_method)] || o.payment_method || "Other";
      methods.set(label, (methods.get(label) || 0) + 1);
    }
    const methodTotal = [...methods.values()].reduce((a, b) => a + b, 0);
    const paymentMethods = [...methods.entries()].map(([method, count]) => ({
      method,
      orders: count,
      share: methodTotal ? Math.round((count / methodTotal) * 100) : 0,
    }));

    const sales = productSales(paid);
    const topProducts = sales.slice(0, 8).map((s) => {
      const p = productById.get(s.productId);
      return { id: s.productId, name: p?.name || s.product.name, units: s._sum.quantity, revenue: s.revenue, stock: p?.stock ?? null };
    });

    // Live, in-stock products with no sales in the period
    const soldIds = new Set(sales.map((s) => s.productId));
    const unsoldInStock = products
      .filter((p) => !p.is_archived && upper(p.status) === "PUBLISHED" && Number(p.stock) > 0 && !soldIds.has(String(p.id)))
      .length;

    return {
      grossSales,
      netSales,
      cancelledValue,
      paidOrders: paid.length,
      ordersPlaced: current.length,
      unitsSold,
      upt: paid.length ? (unitsSold / paid.length).toFixed(2) : null,
      aov: paid.length ? Math.round(netSales / paid.length) : 0,
      categoryData,
      hourlyDistribution,
      dayOfWeekTrends,
      paymentMethods,
      topProducts,
      unsoldInStock,
    };
  },

  // ─────────────────────────────────────────────
  // 2. ORDERS MANAGEMENT
  // ─────────────────────────────────────────────
  async getOrders() {
    try {
      const data = await fetchAllOrders();
      return data.map((o) => {
        const rawName = o.customer_name || o.shipping_address?.name || o.shippingAddress?.name || "Customer";
        const nameParts = rawName.trim().split(" ");
        return {
          id: o.id,
          orderNumber: o.order_id || o.orderNumber || o.id,
          createdAt: o.created_at || o.createdAt,
          customer: {
            firstName: nameParts[0] || "Customer",
            lastName: nameParts.slice(1).join(" "),
            email: o.customer_email || o.shipping_address?.email || "",
            phone: o.customer_phone || o.shipping_address?.phone || "",
          },
          shippingAddress: o.shipping_address || o.shippingAddress || {},
          items: itemsOf(o),
          paymentMethod: PAYMENT_LABELS[upper(o.payment_method)] || o.payment_method || "—",
          paymentMethodCode: upper(o.payment_method),
          total: orderTotal(o),
          shippingCharge: Number(o.shipping_charge ?? o.shippingCharge ?? 0),
          // Fulfilment and payment are separate: an order can be SHIPPED and still PENDING payment (COD).
          orderStatus: upper(o.order_status || o.orderStatus || "PENDING"),
          paymentStatus: upper(o.payment_status || o.paymentStatus || "PENDING"),
          shiprocket: o.shiprocket || null,
        };
      });
    } catch (err) {
      console.warn("Could not fetch orders from Supabase:", err.message);
      return [];
    }
  },

  /**
   * Changes the fulfilment status only. Payment status follows the rules:
   *  - a COD order marked DELIVERED is now PAID (cash collected)
   *  - cancelling returns the items to stock (once)
   */
  async updateOrderStatus(orderId, newStatus, { notify = true } = {}) {
    const status = upper(newStatus);
    const allowed = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];
    if (!allowed.includes(status)) throw new Error(`Unknown order status: ${newStatus}`);

    const { data: order, error: readError } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (readError) throw readError;
    if (!order) throw new Error("Order not found.");

    const updates = { order_status: status, orderStatus: status, updated_at: new Date().toISOString() };
    if (status === "DELIVERED" && isCod(order) && upper(order.payment_status) === "PENDING") {
      updates.payment_status = "PAID";
      updates.paymentStatus = "PAID";
    }

    const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select();
    if (error) throw error;

    const wasCancelled = isCancelled(order);
    const stockWasTaken = isCod(order) || isPaid(order);
    if (["CANCELLED", "RETURNED"].includes(status) && !wasCancelled && stockWasTaken) {
      await this.restockItems(itemsOf(order));
    }

    // Customer email for the new status (shipped, delivered, cancelled…), sent by the server.
    let email = null;
    const event = ORDER_STATUS_EMAIL[status];
    if (notify && event && upper(order.order_status) !== status) {
      try {
        email = (await this.orderEmail("send", { orderId, event })).result;
      } catch (err) {
        email = { customer: `error: ${err.message}` };
      }
    }
    return { data, email };
  },

  /** Calls the "order-email" server function (admin only). */
  async orderEmail(action, payload = {}) {
    const { data, error } = await supabase.functions.invoke("order-email", { body: { action, ...payload } });
    if (error) {
      let message = error.message;
      try {
        const body = await error.context?.json?.();
        if (body?.error) message = body.error;
      } catch {}
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  },

  /** Returns order lines to stock (used when an order is cancelled). */
  async restockItems(items) {
    for (const item of items) {
      const { data: p } = await supabase.from("products").select("id, stock, product_type, variations").eq("id", item.productId).maybeSingle();
      if (!p) continue;
      const qty = Number(item.quantity || 1);
      const variations = Array.isArray(p.variations) ? p.variations : [];
      if (p.product_type === "variable" && variations.length && item.selectedSize) {
        const next = variations.map((v) => (String(v.size) === String(item.selectedSize) ? { ...v, stock: Number(v.stock || 0) + qty } : v));
        await supabase.from("products").update({ variations: next, stock: next.reduce((s, v) => s + (Number(v.stock) || 0), 0), stock_status: "In Stock" }).eq("id", p.id);
      } else {
        await supabase.from("products").update({ stock: Number(p.stock || 0) + qty, stock_status: "In Stock" }).eq("id", p.id);
      }
    }
  },

  /**
   * Online checkouts that were started but not paid (30+ minutes old).
   * COD orders are excluded — they are real orders awaiting delivery.
   */
  async getAbandonedCarts() {
    try {
      const cutoff = Date.now() - 30 * 60 * 1000;
      const orders = await fetchAllOrders();
      return orders
        .filter((o) => !isCod(o) && ["PENDING", "FAILED"].includes(upper(o.payment_status)) && !isCancelled(o))
        .filter((o) => new Date(o.created_at).getTime() < cutoff)
        .map((o) => {
          const items = itemsOf(o);
          const itemNames = items.map((it) => it.title || it.name).filter(Boolean).join(", ");
          const customerName = o.customer_name || "there";
          const phone = o.customer_phone || "";
          const digits = phone.replace(/\D/g, "");
          const waNumber = digits.length === 10 ? `91${digits}` : digits.length === 12 && digits.startsWith("91") ? digits : "";
          const waMessage = `Namaste ${customerName} ji, this is Safed Rang. We noticed your order for "${itemNames || "your selection"}" wasn't completed. If anything went wrong with the payment or you have a question about the piece, just reply here — we're happy to help.`;
          return {
            id: o.id,
            orderId: o.id,
            customerName: o.customer_name || "Customer",
            customerEmail: o.customer_email || "",
            customerPhone: phone,
            cleanPhone: waNumber,
            items,
            itemNames,
            total: orderTotal(o),
            createdAt: o.created_at,
            paymentStatus: upper(o.payment_status),
            waLink: waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}` : null,
            recovered: false,
          };
        });
    } catch (err) {
      console.error("adminService.getAbandonedCarts error:", err);
      return [];
    }
  },

  // ─────────────────────────────────────────────
  // 3. INVENTORY & STOCK
  // ─────────────────────────────────────────────
  async updateStock(productId, newStock) {
    const stockNum = Math.max(0, Number(newStock));
    const status = stockNum > 0 ? (isLowStock(stockNum) ? "Low Stock" : "In Stock") : "Out of Stock";

    const { error } = await supabase
      .from("products")
      .update({
        stock: stockNum,
        stock_status: status,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) throw error;
    return { stock: stockNum, status };
  },

  // ─────────────────────────────────────────────
  // 4. CATEGORIES
  // ─────────────────────────────────────────────
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("categories table error:", e);
    }

    // Fallback: categories actually used by live products
    const { data: rows } = await supabase.from("products").select("category_name").limit(2000);
    const uniqueCats = Array.from(new Set((rows || []).map((p) => p.category_name).filter(Boolean))).sort();

    return uniqueCats.map((name, idx) => ({
      id: `cat_${idx + 1}`,
      name,
      description: `Collection of handcrafted ${name}`,
      status: "ACTIVE",
      sortOrder: idx,
    }));
  },

  // categories was created by Prisma: id, slug and updatedAt have no database
  // defaults, so they're supplied here.
  async saveCategory(cat) {
    const now = new Date().toISOString();
    const slug = (cat.slug || cat.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const fields = {
      name: String(cat.name || "").trim(),
      slug,
      description: cat.description || null,
      status: cat.status || "ACTIVE",
      updatedAt: now,
    };
    const isExisting = cat.id && !String(cat.id).startsWith("cat_");
    const { error } = isExisting
      ? await supabase.from("categories").update(fields).eq("id", cat.id)
      : await supabase.from("categories").insert([{ id: crypto.randomUUID(), createdAt: now, ...fields }]);
    if (error) throw error;
  },

  async deleteCategory(id) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },

  // ─────────────────────────────────────────────
  // 4b. BADGES
  // ─────────────────────────────────────────────
  async getBadges() {
    try {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("badges table error:", e);
    }

    return [
      { id: "badge_1", name: "One of One", slug: "one-of-one", description: "Exclusive one-of-one luxury creations", color: "#6E1E2A", status: "ACTIVE", sort_order: 0 },
      { id: "badge_2", name: "Best Seller", slug: "best-seller", description: "Most loved and highest selling pieces", color: "#AE8A54", status: "ACTIVE", sort_order: 1 },
      { id: "badge_3", name: "New Arrival", slug: "new-arrival", description: "Latest additions to the Safed Rang collection", color: "#2D5A43", status: "ACTIVE", sort_order: 2 },
      { id: "badge_4", name: "Limited Edition", slug: "limited-edition", description: "Special seasonal and rare pieces", color: "#7A2E5C", status: "ACTIVE", sort_order: 3 },
      { id: "badge_5", name: "Handcrafted", slug: "handcrafted", description: "Authentic artisan hand embroidery", color: "#8B5E34", status: "ACTIVE", sort_order: 4 },
      { id: "badge_6", name: "Trending", slug: "trending", description: "Currently trending styles", color: "#A13D2D", status: "ACTIVE", sort_order: 5 },
    ];
  },

  async saveBadge(badge) {
    const slug = (badge.slug || badge.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim();
    if (badge.id && !badge.id.startsWith("badge_temp_")) {
      const { error } = await supabase
        .from("badges")
        .update({
          name: badge.name.trim(),
          slug,
          description: badge.description || null,
          color: badge.color || "#6E1E2A",
          status: badge.status || "ACTIVE",
          sort_order: Number(badge.sort_order || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", badge.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("badges").insert([
        {
          id: `badge_${Date.now()}`,
          name: badge.name.trim(),
          slug,
          description: badge.description || null,
          color: badge.color || "#6E1E2A",
          status: badge.status || "ACTIVE",
          sort_order: Number(badge.sort_order || 0),
        },
      ]);
      if (error) throw error;
    }
  },

  async deleteBadge(id) {
    const { error } = await supabase.from("badges").delete().eq("id", id);
    if (error) throw error;
  },

  // ─────────────────────────────────────────────
  // 5. COUPONS
  // Note: checkout does not apply coupon codes yet (see Coupons page notice).
  // ─────────────────────────────────────────────
  // The coupons table's columns (Prisma-created) are mapped to the page's field names here.
  async getCoupons() {
    const { data, error } = await supabase.from("coupons").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []).map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value),
      minOrderAmount: c.minimumOrderAmount != null ? Number(c.minimumOrderAmount) : null,
      maxDiscount: c.maximumDiscount != null ? Number(c.maximumDiscount) : null,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount || 0,
      expiresAt: c.expiryDate,
      isActive: upper(c.status) === "ACTIVE",
      status: c.status,
    }));
  },

  async saveCoupon(coupon) {
    const now = new Date().toISOString();
    const row = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minimumOrderAmount: coupon.minOrderAmount ?? null,
      maximumDiscount: coupon.maxDiscount ?? null,
      usageLimit: coupon.usageLimit ?? null,
      expiryDate: coupon.expiresAt || null,
      status: coupon.isActive ? "ACTIVE" : "INACTIVE",
      updatedAt: now,
    };
    const { error } = coupon.id
      ? await supabase.from("coupons").update(row).eq("id", coupon.id)
      : await supabase.from("coupons").insert([{ id: crypto.randomUUID(), usedCount: 0, createdAt: now, ...row }]);
    if (error) throw error;
  },

  async deleteCoupon(id) {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) throw error;
  },

  // ─────────────────────────────────────────────
  // 6. PAYMENTS & TRANSACTIONS
  // ─────────────────────────────────────────────
  async getPayments() {
    const orders = await fetchAllOrders();
    return orders.map((o) => ({
      id: o.id,
      transactionId: o.id,
      orderNumber: o.id,
      customerName: o.customer_name || "Customer",
      customerEmail: o.customer_email || "—",
      amount: orderTotal(o),
      currency: "INR",
      paymentMethod: PAYMENT_LABELS[upper(o.payment_method)] || o.payment_method || "—",
      gateway: isCod(o) ? "Cash on Delivery" : "Cashfree",
      status: upper(o.payment_status || "PENDING"),
      createdAt: o.created_at,
    }));
  },

  // ─────────────────────────────────────────────
  // 7. SETTINGS
  // Stored as JSON values in `settings` (group, key) — the same shape the
  // checkout and the order functions read, e.g. shipping.cod_charge = {"amount": 50}.
  // ─────────────────────────────────────────────
  async getSettings() {
    const { data, error } = await supabase.from("settings").select("group, key, value");
    if (error) throw error;
    const raw = {};
    for (const row of data || []) {
      raw[`${row.group}.${row.key}`] = typeof row.value === "string" ? safeJson(row.value) : row.value;
    }
    const text = (k, fallback = "") => {
      const v = raw[k];
      return v && typeof v === "object" ? v.text ?? fallback : v ?? fallback;
    };
    const fee = Number(raw["shipping.cod_charge"]?.amount ?? raw["shipping.cod_charge"]);
    return {
      store: {
        name: text("general.site_name", "Safed Rang"),
        email: text("general.store_email"),
        phone: text("general.store_phone"),
        address: text("general.store_address"),
      },
      cod: {
        enabled: raw["shipping.cod_enabled"]?.enabled ?? raw["shipping.cod_enabled"] !== false,
        fee: Number.isFinite(fee) ? fee : 39,
      },
      email: normaliseEmailConfig(raw["email.config"]),
    };
  },

  async saveSettings({ store, cod, email }) {
    const rows = [
      { group: "general", key: "site_name", value: { text: String(store.name || "").trim() } },
      { group: "general", key: "store_email", value: { text: String(store.email || "").trim() } },
      { group: "general", key: "store_phone", value: { text: String(store.phone || "").trim() } },
      { group: "general", key: "store_address", value: { text: String(store.address || "").trim() } },
      { group: "shipping", key: "cod_enabled", value: { enabled: Boolean(cod.enabled) } },
      { group: "shipping", key: "cod_charge", value: { amount: Math.max(0, Number(cod.fee) || 0) } },
    ];
    if (email) rows.push({ group: "email", key: "config", value: normaliseEmailConfig(email) });
    const { error } = await supabase.from("settings").upsert(rows, { onConflict: "group,key" });
    if (error) throw error;
  },

  // ─────────────────────────────────────────────
  // SHIPROCKET (server function "courier-create"; credentials stay in Supabase secrets)
  // ─────────────────────────────────────────────
  async shiprocket(action, payload = {}) {
    const { data, error } = await supabase.functions.invoke("courier-create", { body: { action, ...payload } });
    if (error) {
      // Non-2xx: the function's JSON message is in error.context.
      let message = error.message;
      try {
        const body = await error.context?.json?.();
        if (body?.error) message = body.error;
      } catch {}
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  },

  // ─────────────────────────────────────────────
  // 8. TRACKING & INTEGRATIONS
  // ─────────────────────────────────────────────
  async getTrackingIntegrations() {
    return await loadTrackingIntegrations();
  },

  async saveTrackingIntegrations(configs) {
    return await saveTrackingData(configs);
  },
};
