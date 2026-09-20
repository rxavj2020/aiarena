import nodemailer from "nodemailer";
import { getPluginState } from "./store";
import { db, schema } from "@/lib/db";
import { id } from "@/lib/utils";
import { getSettingsSync } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/db/schema";

export function mailConfigured() {
  const s = getPluginState("smtp");
  return s.enabled && !!s.config.host && !!s.config.user;
}

export function makeTransport(config?: Record<string, string>) {
  const c = config ?? getPluginState("smtp").config;
  return nodemailer.createTransport({
    host: c.host,
    port: Number(c.port || 587),
    secure: c.secure === "true" || c.secure === "1" || Number(c.port) === 465,
    auth: { user: c.user, pass: c.pass },
  });
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; config?: Record<string, string> }) {
  const s = getPluginState("smtp");
  const c = opts.config ?? s.config;
  const enabled = opts.config ? true : s.enabled;
  if (!enabled || !c.host) {
    db.insert(schema.mailLog).values({ id: id("ml_"), to: opts.to, subject: opts.subject, ok: false, error: "SMTP plugin not configured" }).run();
    return { ok: false, error: "SMTP plugin not configured" };
  }
  try {
    const t = makeTransport(c);
    await t.sendMail({ from: `"${c.fromName || getSettingsSync().storeName}" <${c.fromEmail || c.user}>`, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    db.insert(schema.mailLog).values({ id: id("ml_"), to: opts.to, subject: opts.subject, ok: true }).run();
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    db.insert(schema.mailLog).values({ id: id("ml_"), to: opts.to, subject: opts.subject, ok: false, error }).run();
    return { ok: false, error };
  }
}

function layout(title: string, body: string) {
  const s = getSettingsSync();
  return `<!doctype html><html><body style="margin:0;background:#f6f6f7;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
    <div style="background:${s.primaryColor};padding:20px 28px;color:#fff;font-size:20px;font-weight:700">${s.storeName}</div>
    <div style="padding:28px"><h2 style="margin:0 0 12px;font-size:20px">${title}</h2>${body}</div>
    <div style="padding:16px 28px;background:#fafafa;color:#777;font-size:12px">${s.footerText} · ${s.supportEmail} · ${s.supportPhone}</div>
  </div></body></html>`;
}

function itemsTable(items: OrderItem[], currency: string) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${i.name}${i.variantTitle ? ` <span style="color:#777">(${i.variantTitle})</span>` : ""} × ${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatMoney(i.price * i.quantity, currency)}</td></tr>`
    )
    .join("")}</table>`;
}

function totals(o: Order, currency: string) {
  const row = (l: string, v: string, b = false) => `<tr><td style="padding:4px 0;color:#555">${l}</td><td style="padding:4px 0;text-align:right;${b ? "font-weight:700;font-size:16px" : ""}">${v}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse">${row("Subtotal", formatMoney(o.subtotal, currency))}${o.discount ? row("Discount", "-" + formatMoney(o.discount, currency)) : ""}${row("Shipping", o.shipping ? formatMoney(o.shipping, currency) : "Free")}${o.tax ? row("Tax", formatMoney(o.tax, currency)) : ""}${row("Total", formatMoney(o.total, currency), true)}</table>`;
}

function address(o: Order) {
  const a = o.shippingAddress;
  return `<p style="color:#555;line-height:1.5">${a.name}<br>${a.line1}${a.line2 ? ", " + a.line2 : ""}<br>${a.city}, ${a.state} ${a.postalCode}<br>${a.country}<br>${a.phone}</p>`;
}

export async function sendOrderConfirmation(order: Order, items: OrderItem[]) {
  const s = getSettingsSync();
  if (!s.notifications.sendCustomerConfirmation) return;
  const siteUrl = process.env.SITE_URL ?? "";
  const html = layout(
    `Thanks for your order, ${order.shippingAddress.name.split(" ")[0]}!`,
    `<p>Your order <b>#${order.orderNumber}</b> has been received${order.paymentStatus === "paid" ? " and payment confirmed" : order.paymentStatus === "cod" ? " (Cash on Delivery)" : ""}. We'll email you when it ships.</p>
    ${itemsTable(items, s.currency)}${totals(order, s.currency)}
    <h3 style="margin:20px 0 4px;font-size:14px">Shipping to</h3>${address(order)}
    <p style="margin-top:20px"><a href="${siteUrl}/account/orders/${order.id}" style="background:${s.accentColor};color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">View your order</a></p>`
  );
  await sendMail({ to: order.email, subject: `Order #${order.orderNumber} confirmed — ${s.storeName}`, html });
}

export async function sendAdminNewOrder(order: Order, items: OrderItem[]) {
  const s = getSettingsSync();
  if (!s.notifications.sendAdminNewOrder) return;
  const smtp = getPluginState("smtp").config;
  const to = s.notifications.adminOrderEmail || smtp.adminEmail || smtp.fromEmail;
  if (!to) return;
  const siteUrl = process.env.SITE_URL ?? "";
  const html = layout(
    `New order #${order.orderNumber} — ${formatMoney(order.total, s.currency)}`,
    `<p><b>${order.shippingAddress.name}</b> · ${order.email} · ${order.phone ?? order.shippingAddress.phone}</p>
    <p>Payment: <b>${order.paymentStatus.toUpperCase()}</b>${order.paymentProvider ? " via " + order.paymentProvider : ""}</p>
    ${itemsTable(items, s.currency)}${totals(order, s.currency)}
    <h3 style="margin:20px 0 4px;font-size:14px">Ship to</h3>${address(order)}
    ${order.customerNote ? `<p><b>Customer note:</b> ${order.customerNote}</p>` : ""}
    <p style="margin-top:20px"><a href="${siteUrl}/admin/orders/${order.id}" style="background:${s.primaryColor};color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open in admin</a></p>`
  );
  await sendMail({ to, subject: `🛒 New order #${order.orderNumber} — ${formatMoney(order.total, s.currency)}`, html });
}

export async function sendShippingUpdate(order: Order) {
  const s = getSettingsSync();
  if (!s.notifications.sendShippingUpdates) return;
  const map: Record<string, string> = {
    shipped: "Your order is on its way!",
    delivered: "Your order has been delivered",
    cancelled: "Your order has been cancelled",
    refunded: "Your refund has been processed",
    confirmed: "Your order is confirmed",
    processing: "We're preparing your order",
  };
  const title = map[order.status];
  if (!title) return;
  const track = order.trackingNumber ? `<p>Tracking: <b>${order.carrier ? order.carrier + " " : ""}${order.trackingNumber}</b>${order.trackingUrl ? ` — <a href="${order.trackingUrl}">Track package</a>` : ""}</p>` : "";
  const html = layout(title, `<p>Update for order <b>#${order.orderNumber}</b>: status is now <b>${order.status}</b>.</p>${track}`);
  await sendMail({ to: order.email, subject: `Order #${order.orderNumber}: ${title}`, html });
}

export async function sendContactMessage(from: { name: string; email: string; message: string }) {
  const s = getSettingsSync();
  const smtp = getPluginState("smtp").config;
  const to = s.notifications.adminOrderEmail || smtp.adminEmail || s.supportEmail;
  return sendMail({ to, subject: `Contact form: ${from.name}`, html: layout("New contact message", `<p><b>${from.name}</b> &lt;${from.email}&gt;</p><p style="white-space:pre-wrap">${from.message}</p>`) });
}
