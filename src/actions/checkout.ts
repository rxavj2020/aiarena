"use server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { resolveCart, computeTotals, nextOrderNumber, writeCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { id } from "@/lib/utils";
import { activePaymentGateway } from "@/lib/plugins/store";
import { razorpayCreateOrder, cashfreeCreateOrder } from "@/lib/plugins/payments";
import { addEvent, decrementStock, notifyNewOrder } from "@/lib/orders";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { mirrorRow } from "@/lib/plugins/firestore";

const addressSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(8, "Enter a valid phone number"),
  line1: z.string().min(3, "Enter your address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  postalCode: z.string().min(4, "Enter a valid PIN code"),
  country: z.string().default("IN"),
});

export type CheckoutResult =
  | { ok: false; error: string }
  | { ok: true; kind: "cod"; orderId: string }
  | { ok: true; kind: "razorpay"; orderId: string; gatewayOrderId: string; keyId: string; amount: number; currency: string; name: string; email: string; phone: string; themeColor?: string; storeName: string }
  | { ok: true; kind: "cashfree"; orderId: string; paymentSessionId: string; mode: string };

export async function validateCoupon(code: string) {
  const lines = await resolveCart();
  const t = await computeTotals(lines, code);
  return t.couponError ? { ok: false as const, error: t.couponError } : { ok: true as const, discount: t.discount };
}

export async function placeOrder(input: { email: string; address: z.infer<typeof addressSchema>; paymentMethod: "cod" | "online"; couponCode?: string; note?: string; saveAddress?: boolean }): Promise<CheckoutResult> {
  const s = await getSettings();
  const session = await getSession();
  const email = z.string().email().safeParse(input.email);
  if (!email.success) return { ok: false, error: "Enter a valid email address" };
  const addr = addressSchema.safeParse(input.address);
  if (!addr.success) return { ok: false, error: addr.error.issues[0].message };
  const lines = await resolveCart();
  if (!lines.length) return { ok: false, error: "Your cart is empty" };
  for (const l of lines) if (l.trackStock && l.qty > l.stock) return { ok: false, error: `${l.name} only has ${l.stock} in stock` };

  const gateway = activePaymentGateway();
  if (input.paymentMethod === "online" && !gateway) return { ok: false, error: "Online payments are not configured. Please choose Cash on Delivery." };
  if (input.paymentMethod === "cod" && !s.shipping.codEnabled) return { ok: false, error: "Cash on Delivery is not available" };

  const t = await computeTotals(lines, input.couponCode, input.paymentMethod);
  if (input.couponCode && t.couponError) return { ok: false, error: t.couponError };

  const orderId = id("ord_");
  const orderNumber = nextOrderNumber();
  db.insert(schema.orders)
    .values({
      id: orderId,
      orderNumber,
      userId: session?.id ?? null,
      email: email.data.toLowerCase(),
      phone: addr.data.phone,
      status: "pending",
      paymentStatus: input.paymentMethod === "cod" ? "cod" : "unpaid",
      paymentProvider: input.paymentMethod === "cod" ? "cod" : gateway,
      subtotal: t.subtotal,
      discount: t.discount,
      shipping: t.shipping,
      tax: t.tax,
      total: t.total,
      couponCode: t.couponCode,
      shippingAddress: addr.data,
      customerNote: input.note,
    })
    .run();
  db.insert(schema.orderItems)
    .values(lines.map((l) => ({ id: id("oi_"), orderId, productId: l.productId, variantId: l.variantId, name: l.name, variantTitle: l.variantTitle, sku: l.sku, image: l.image, price: l.price, quantity: l.qty })))
    .run();
  addEvent(orderId, "created", `Order placed (${input.paymentMethod === "cod" ? "Cash on Delivery" : gateway})`);
  for (const it of db.select({ id: schema.orderItems.id }).from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)).all()) mirrorRow("order_items", it.id);

  if (session && input.saveAddress) {
    db.insert(schema.addresses).values({ id: id("adr_"), userId: session.id, ...addr.data, isDefault: false }).run();
  }

  if (input.paymentMethod === "cod") {
    db.update(schema.orders).set({ status: "confirmed" }).where(eq(schema.orders.id, orderId)).run();
    decrementStock(orderId);
    await writeCart([]);
    notifyNewOrder(orderId).catch(() => {});
    return { ok: true, kind: "cod", orderId };
  }

  const h = await headers();
  const origin = process.env.SITE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  try {
    if (gateway === "razorpay") {
      const r = await razorpayCreateOrder(t.total, `order_${orderNumber}`, s.currency);
      db.update(schema.orders).set({ paymentRef: r.gatewayOrderId }).where(eq(schema.orders.id, orderId)).run();
      return { ok: true, kind: "razorpay", orderId, gatewayOrderId: r.gatewayOrderId, keyId: r.keyId, amount: t.total, currency: s.currency, name: addr.data.name, email: email.data, phone: addr.data.phone, themeColor: r.themeColor, storeName: s.storeName };
    }
    const r = await cashfreeCreateOrder({ orderId, amount: t.total, currency: s.currency, customer: { id: session?.id ?? "guest_" + orderNumber, email: email.data, phone: addr.data.phone, name: addr.data.name }, returnUrl: `${origin}/api/payments/cashfree/return?order_id=${orderId}`, notifyUrl: `${origin}/api/webhooks/cashfree` });
    db.update(schema.orders).set({ paymentRef: r.cfOrderId }).where(eq(schema.orders.id, orderId)).run();
    return { ok: true, kind: "cashfree", orderId, paymentSessionId: r.paymentSessionId, mode: r.mode };
  } catch (e) {
    addEvent(orderId, "payment", `Gateway error: ${e instanceof Error ? e.message : String(e)}`);
    return { ok: false, error: "Could not start payment. Please try again or choose Cash on Delivery." };
  }
}

export async function getSavedAddresses() {
  const s = await getSession();
  if (!s) return [];
  return db.select().from(schema.addresses).where(eq(schema.addresses.userId, s.id)).all();
}
