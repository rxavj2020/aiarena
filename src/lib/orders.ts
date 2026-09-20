import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { id } from "@/lib/utils";
import { sendOrderConfirmation, sendAdminNewOrder, sendShippingUpdate } from "@/lib/plugins/mail";

export function getOrder(orderId: string) {
  const order = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!order) return null;
  const items = db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)).all();
  const events = db.select().from(schema.orderEvents).where(eq(schema.orderEvents.orderId, orderId)).orderBy(schema.orderEvents.createdAt).all();
  return { order, items, events };
}

export function addEvent(orderId: string, type: string, message: string) {
  db.insert(schema.orderEvents).values({ id: id("evt_"), orderId, type, message }).run();
}

/** Called once payment succeeds (or COD placed). Idempotent. */
export async function markOrderPaid(orderId: string, provider: string, ref: string) {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) return;
  if (o.paymentStatus === "paid") return;
  db.update(schema.orders)
    .set({ paymentStatus: "paid", paymentProvider: provider, paymentRef: ref, status: o.status === "pending" ? "confirmed" : o.status, updatedAt: new Date().toISOString() })
    .where(eq(schema.orders.id, orderId))
    .run();
  addEvent(orderId, "payment", `Payment captured via ${provider} (${ref})`);
  decrementStock(orderId);
  await notifyNewOrder(orderId);
}

export async function markOrderFailed(orderId: string, provider: string, reason: string) {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o || o.paymentStatus === "paid") return;
  db.update(schema.orders).set({ paymentStatus: "failed", paymentProvider: provider, updatedAt: new Date().toISOString() }).where(eq(schema.orders.id, orderId)).run();
  addEvent(orderId, "payment", `Payment failed: ${reason}`);
}

export function decrementStock(orderId: string) {
  const items = db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)).all();
  for (const it of items) {
    if (it.variantId) db.update(schema.variants).set({ stock: sql`max(0, ${schema.variants.stock} - ${it.quantity})` }).where(eq(schema.variants.id, it.variantId)).run();
    if (it.productId) db.update(schema.products).set({ stock: sql`max(0, ${schema.products.stock} - ${it.quantity})` }).where(eq(schema.products.id, it.productId)).run();
  }
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (o?.couponCode) db.update(schema.coupons).set({ usedCount: sql`${schema.coupons.usedCount} + 1` }).where(eq(schema.coupons.code, o.couponCode)).run();
}

export async function notifyNewOrder(orderId: string) {
  const data = getOrder(orderId);
  if (!data) return;
  const results = await Promise.allSettled([sendOrderConfirmation(data.order, data.items), sendAdminNewOrder(data.order, data.items)]);
  const failed = results.filter((r) => r.status === "rejected");
  addEvent(orderId, "email", failed.length ? "Notification emails attempted (some failed — check Mail log)" : "Confirmation emails queued");
}

export async function updateOrderStatus(orderId: string, status: schema.Order["status"], opts?: { trackingNumber?: string; trackingUrl?: string; carrier?: string; note?: string; notify?: boolean }) {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) throw new Error("Order not found");
  db.update(schema.orders)
    .set({
      status,
      trackingNumber: opts?.trackingNumber ?? o.trackingNumber,
      trackingUrl: opts?.trackingUrl ?? o.trackingUrl,
      carrier: opts?.carrier ?? o.carrier,
      adminNote: opts?.note ?? o.adminNote,
      paymentStatus: status === "refunded" ? "refunded" : o.paymentStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.orders.id, orderId))
    .run();
  addEvent(orderId, "status", `Status changed ${o.status} → ${status}`);
  if (status === "cancelled" && o.status !== "cancelled" && (o.paymentStatus === "paid" || o.paymentStatus === "cod")) {
    // restock
    const items = db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)).all();
    for (const it of items) {
      if (it.variantId) db.update(schema.variants).set({ stock: sql`${schema.variants.stock} + ${it.quantity}` }).where(eq(schema.variants.id, it.variantId)).run();
      if (it.productId) db.update(schema.products).set({ stock: sql`${schema.products.stock} + ${it.quantity}` }).where(eq(schema.products.id, it.productId)).run();
    }
    addEvent(orderId, "stock", "Inventory restocked");
  }
  if (opts?.notify !== false) {
    const updated = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get()!;
    sendShippingUpdate(updated).catch(() => {});
  }
}
