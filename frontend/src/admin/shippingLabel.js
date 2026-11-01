// Printable parcel labels — 4 × 6 inch (the standard courier / thermal label size),
// black on white, one order per page. jsPDF is loaded only when a label is made.

const PAGE_W = 101.6;
const PAGE_H = 152.4;
const M = 5; // outer margin (mm)
const INNER_W = PAGE_W - M * 2;

// Code 128 bar/space widths for values 0–106 (106 = stop).
const CODE128 = (
  "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 " +
  "123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 " +
  "232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 " +
  "313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 " +
  "111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 " +
  "111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 " +
  "114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112"
).split(" ");

/** Code 128-B module widths for a printable-ASCII string (with check digit and stop). */
export function code128Widths(text) {
  const values = [104];
  for (const ch of String(text)) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) throw new Error("Barcode supports plain characters only.");
    values.push(code - 32);
  }
  const check = values.reduce((sum, v, i) => sum + v * (i || 1), 0) % 103;
  values.push(check, 106);
  return values.flatMap((v) => CODE128[v].split("").map(Number));
}

// Standard PDF fonts only cover Latin text; swap the rupee sign and drop other symbols.
const clean = (s) =>
  String(s ?? "")
    .replace(/₹/g, "Rs. ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,-]+|[\s,-]+$/g, "");

const money = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const addressOf = (order) => {
  const a = typeof order.shippingAddress === "string" ? { address: order.shippingAddress } : order.shippingAddress || {};
  const name = a.name || `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "Customer";
  return {
    name: clean(name),
    lines: [a.address, a.apartment].map(clean).filter(Boolean),
    cityState: [a.city, a.state].map(clean).filter(Boolean).join(", "),
    pincode: clean(a.pincode),
    country: clean(a.country && !/^india$/i.test(a.country) ? a.country : ""),
    phone: clean(a.phone || order.customer?.phone),
  };
};

/** True when the courier should collect cash for this order. */
export const collectsCash = (order) => order.paymentMethodCode === "COD" && order.paymentStatus !== "PAID";

function drawLabel(doc, order, sender) {
  const to = addressOf(order);
  const cod = collectsCash(order);
  let y = M;

  doc.setDrawColor(0);
  doc.setTextColor(0);
  doc.setLineWidth(0.5);
  doc.rect(M, M, INNER_W, PAGE_H - M * 2);

  // ── Header: brand + payment mode ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(clean(sender.name || "Safed Rang").toUpperCase(), M + 4, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("safedrang.com", M + 4, y + 13.5);

  const boxW = 40;
  const boxX = M + INNER_W - boxW - 3;
  if (cod) {
    doc.setFillColor(0);
    doc.rect(boxX, y + 3, boxW, 13, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("COD", boxX + boxW / 2, y + 8.5, { align: "center" });
    doc.setFontSize(9);
    doc.text(`COLLECT ${money(order.total)}`, boxX + boxW / 2, y + 13.5, { align: "center" });
    doc.setTextColor(0);
  } else {
    doc.setLineWidth(0.6);
    doc.rect(boxX, y + 3, boxW, 13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PREPAID", boxX + boxW / 2, y + 8.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Do not collect cash", boxX + boxW / 2, y + 13.5, { align: "center" });
  }
  y += 19;
  doc.setLineWidth(0.5);
  doc.line(M, y, M + INNER_W, y);

  // ── Ship to ──
  const left = M + 4;
  const textW = INNER_W - 8;
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SHIP TO", left, y);
  y += 6;
  doc.setFontSize(14);
  doc.text(doc.splitTextToSize(to.name, textW).slice(0, 2), left, y);
  y += 6.2 * Math.min(2, doc.splitTextToSize(to.name, textW).length);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const addrLines = [...to.lines, to.cityState, to.country].filter(Boolean).flatMap((l) => doc.splitTextToSize(l, textW));
  const shown = addrLines.slice(0, 6);
  doc.text(shown, left, y);
  y += shown.length * 4.6 + 1.5;

  // PIN code — the courier sorts by it, so it is the largest text on the label.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PIN", left, y + 5);
  doc.setFontSize(22);
  doc.text(to.pincode || "------", left + 8, y + 6.5);
  if (to.phone) {
    doc.setFontSize(11);
    doc.text(`Ph: ${to.phone}`, M + INNER_W - 4, y + 5.5, { align: "right" });
  }
  y += 11;
  doc.line(M, y, M + INNER_W, y);

  // ── Order details + barcode ──
  y += 5;
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const pieces = (order.items || []).reduce((s, it) => s + Number(it.quantity || 1), 0);
  const col = INNER_W / 3;
  const cells = [
    ["ORDER DATE", date || "-"],
    ["PIECES", String(pieces || "-")],
    ["WEIGHT", "______ g"],
  ];
  cells.forEach(([label, value], i) => {
    const x = left + col * i;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(value, x, y + 4.5);
  });
  y += 8;

  const orderNo = clean(order.orderNumber || order.id);
  try {
    const widths = code128Widths(orderNo);
    const modules = widths.reduce((a, b) => a + b, 0);
    const maxW = INNER_W - 12;
    const unit = Math.min(0.5, maxW / modules);
    const barW = unit * modules;
    let x = M + (INNER_W - barW) / 2;
    doc.setFillColor(0);
    widths.forEach((w, i) => {
      if (i % 2 === 0) doc.rect(x, y, unit * w, 12, "F");
      x += unit * w;
    });
    y += 12;
  } catch {
    // Unusual characters in the order number: skip the barcode, keep the text.
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`ORDER  ${orderNo}`, PAGE_W / 2, y + 4.5, { align: "center" });
  y += 7;
  doc.line(M, y, M + INNER_W, y);

  // ── Contents ──
  y += 5;
  doc.setFontSize(7.5);
  doc.text("CONTENTS", left, y);
  doc.text(`DECLARED VALUE ${money(order.total)}`, M + INNER_W - 4, y, { align: "right" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const items = order.items || [];
  const fromTop = PAGE_H - M - 22; // the "From" block starts here
  const maxItemLines = Math.max(2, Math.floor((fromTop - y + 1) / 3.8));
  const itemLines = items.map((it) => `${it.quantity || 1} x  ${clean(it.title || it.name || "Product")}`);
  const fitted = itemLines.length > maxItemLines
    ? [...itemLines.slice(0, maxItemLines - 1), `+ ${itemLines.length - maxItemLines + 1} more item(s)`]
    : itemLines;
  fitted.forEach((line) => {
    doc.text(doc.splitTextToSize(line, textW)[0], left, y);
    y += 3.8;
  });
  if (!items.length) doc.text("Handcrafted textile (see invoice)", left, y);

  // ── From / return address ──
  y = fromTop;
  doc.line(M, y, M + INNER_W, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("FROM / RETURN TO", left, y);
  y += 4;
  doc.setFontSize(8.5);
  doc.text(clean(sender.name || "Safed Rang"), left, y);
  y += 3.6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const fromLines = [sender.address || "Lucknow, Uttar Pradesh, India", sender.phone && `Ph: ${sender.phone}`]
    .map(clean)
    .filter(Boolean)
    .flatMap((l) => doc.splitTextToSize(l, textW))
    .slice(0, 3);
  doc.text(fromLines, left, y, { lineHeightFactor: 1.15 });

  doc.setFontSize(6);
  doc.text("If undelivered, please return to the address above.", PAGE_W / 2, PAGE_H - M - 1.8, { align: "center" });
}

/**
 * Downloads one PDF with a 4 × 6 inch label per order.
 * `sender` = { name, phone, address } from Settings.
 */
export async function buildShippingLabels(orders, sender = {}) {
  if (!orders?.length) throw new Error("No orders to print.");
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: [PAGE_W, PAGE_H], orientation: "portrait" });
  doc.setProperties({ title: "Safed Rang shipping labels", creator: "Safed Rang admin" });

  orders.forEach((order, i) => {
    if (i > 0) doc.addPage([PAGE_W, PAGE_H], "portrait");
    drawLabel(doc, order, sender);
  });
  return doc;
}

export async function downloadShippingLabels(orders, sender = {}) {
  const doc = await buildShippingLabels(orders, sender);

  const name =
    orders.length === 1
      ? `Label_${clean(orders[0].orderNumber || orders[0].id).replace(/[^\w-]/g, "_")}.pdf`
      : `Labels_${orders.length}_orders_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(name);
}
