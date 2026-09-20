import { getPluginState } from "./store";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { addEvent } from "@/lib/orders";
import type { Order, OrderItem } from "@/lib/db/schema";

const API = "https://apiv2.shiprocket.in/v1/external";
let tokenCache: { token: string; exp: number; key: string } | null = null;

async function token(c = getPluginState("shiprocket").config) {
  const key = c.email + ":" + c.password;
  if (tokenCache && tokenCache.key === key && tokenCache.exp > Date.now()) return tokenCache.token;
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: c.email, password: c.password }) });
  if (!r.ok) throw new Error("Shiprocket login failed — check API user credentials");
  const j = (await r.json()) as { token: string };
  tokenCache = { token: j.token, exp: Date.now() + 8 * 3600_000, key };
  return j.token;
}

async function sr<T>(path: string, init?: RequestInit, c?: Record<string, string>): Promise<T> {
  const t = await token(c);
  const r = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const text = await r.text();
  let j: unknown = {};
  try { j = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(`Shiprocket ${r.status}: ${((j as { message?: string }).message ?? text).slice(0, 300)}`);
  return j as T;
}

export async function testShiprocket(c: Record<string, string>) {
  tokenCache = null;
  await token(c);
  const p = await sr<{ data: { shipping_address: { pickup_location: string; pin_code: string }[] } }>("/settings/company/pickup", undefined, c);
  const names = p.data?.shipping_address?.map((a) => a.pickup_location) ?? [];
  if (c.pickupLocation && !names.includes(c.pickupLocation)) throw new Error(`Authenticated, but pickup location "${c.pickupLocation}" not found. Available: ${names.join(", ") || "none"}`);
  return `Authenticated · pickup locations: ${names.join(", ") || "none configured"}`;
}

function dims() {
  const c = getPluginState("shiprocket").config;
  const [l, b, h] = (c.defaultDims || "20x15x10").split(/[x×]/i).map((n) => Number(n) || 10);
  return { weight: Number(c.defaultWeightKg) || 0.5, length: l, breadth: b, height: h };
}

export function orderWeightKg(items: OrderItem[]) {
  const ids = items.map((i) => i.productId).filter(Boolean) as string[];
  if (!ids.length) return dims().weight;
  let grams = 0;
  for (const it of items) {
    const p = it.productId ? db.select({ w: schema.products.weightGrams }).from(schema.products).where(eq(schema.products.id, it.productId)).get() : null;
    grams += (p?.w ?? 0) * it.quantity;
  }
  return grams > 0 ? Math.max(0.1, grams / 1000) : dims().weight;
}

export type CourierOption = { courier_company_id: number; courier_name: string; rate: number; etd: string; estimated_delivery_days: string; rating: number; cod: number; recommended?: boolean };

export async function getCouriers(order: Order, items: OrderItem[]) {
  const c = getPluginState("shiprocket").config;
  const q = new URLSearchParams({ pickup_postcode: c.pickupPostcode, delivery_postcode: order.shippingAddress.postalCode, cod: order.paymentStatus === "cod" ? "1" : "0", weight: String(orderWeightKg(items)), declared_value: String(order.total / 100) });
  const j = await sr<{ data?: { available_courier_companies?: CourierOption[]; recommended_courier_company_id?: number } }>(`/courier/serviceability/?${q}`);
  const list = j.data?.available_courier_companies ?? [];
  const rec = j.data?.recommended_courier_company_id;
  return list.map((x) => ({ ...x, recommended: x.courier_company_id === rec })).sort((a, b) => a.rate - b.rate);
}

/** Create the order in Shiprocket (adhoc). Idempotent per local order. */
export async function createShiprocketOrder(orderId: string) {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) throw new Error("Order not found");
  if (o.shiprocketOrderId) return { shiprocketOrderId: o.shiprocketOrderId, shipmentId: o.shiprocketShipmentId! };
  const items = db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)).all();
  const c = getPluginState("shiprocket").config;
  const d = dims();
  const a = o.shippingAddress;
  const [first, ...rest] = a.name.trim().split(/\s+/);
  const body = {
    order_id: String(o.orderNumber), order_date: o.createdAt.slice(0, 10), pickup_location: c.pickupLocation, channel_id: "",
    billing_customer_name: first, billing_last_name: rest.join(" ") || ".", billing_address: a.line1, billing_address_2: a.line2 ?? "", billing_city: a.city, billing_pincode: a.postalCode, billing_state: a.state, billing_country: "India",
    billing_email: o.email, billing_phone: a.phone.replace(/\D/g, "").slice(-10), shipping_is_billing: true,
    order_items: items.map((i) => ({ name: i.name + (i.variantTitle ? ` (${i.variantTitle})` : ""), sku: i.sku || i.productId || i.id, units: i.quantity, selling_price: i.price / 100 })),
    payment_method: o.paymentStatus === "cod" ? "COD" : "Prepaid", shipping_charges: o.shipping / 100, total_discount: o.discount / 100, sub_total: (o.subtotal - o.discount) / 100,
    length: d.length, breadth: d.breadth, height: d.height, weight: orderWeightKg(items),
  };
  const j = await sr<{ order_id: number; shipment_id: number; status?: string }>("/orders/create/adhoc", { method: "POST", body: JSON.stringify(body) });
  db.update(schema.orders).set({ shiprocketOrderId: String(j.order_id), shiprocketShipmentId: String(j.shipment_id), carrier: o.carrier ?? "Shiprocket" }).where(eq(schema.orders.id, orderId)).run();
  addEvent(orderId, "shipping", `Shiprocket order created (#${j.order_id}, shipment ${j.shipment_id})`);
  return { shiprocketOrderId: String(j.order_id), shipmentId: String(j.shipment_id) };
}

/** Assign AWB (optionally with a chosen courier), schedule pickup, generate label; stores tracking on order. */
export async function shipOrder(orderId: string, courierId?: number) {
  const { shipmentId } = await createShiprocketOrder(orderId);
  const awb = await sr<{ awb_assign_status: number; response?: { data?: { awb_code: string; courier_name: string; courier_company_id: number } }; message?: string }>("/courier/assign/awb", { method: "POST", body: JSON.stringify({ shipment_id: shipmentId, ...(courierId ? { courier_id: courierId } : {}) }) });
  const data = awb.response?.data;
  if (!data?.awb_code) throw new Error(awb.message || "AWB assignment failed (check wallet balance / serviceability)");
  let pickupMsg = "";
  try {
    const p = await sr<{ response?: { pickup_scheduled_date?: string; pickup_token_number?: string } }>("/courier/generate/pickup", { method: "POST", body: JSON.stringify({ shipment_id: [shipmentId] }) });
    pickupMsg = p.response?.pickup_scheduled_date ? ` · pickup ${p.response.pickup_scheduled_date}` : "";
  } catch (e) { pickupMsg = ` · pickup not scheduled: ${(e as Error).message.slice(0, 80)}`; }
  let labelUrl: string | null = null;
  try {
    const l = await sr<{ label_url?: string }>("/courier/generate/label", { method: "POST", body: JSON.stringify({ shipment_id: [shipmentId] }) });
    labelUrl = l.label_url ?? null;
  } catch {}
  db.update(schema.orders)
    .set({ trackingNumber: data.awb_code, carrier: data.courier_name, trackingUrl: `https://shiprocket.co/tracking/${data.awb_code}`, labelUrl, status: "shipped", updatedAt: new Date().toISOString() })
    .where(eq(schema.orders.id, orderId)).run();
  addEvent(orderId, "shipping", `AWB ${data.awb_code} assigned to ${data.courier_name}${pickupMsg}`);
  return { awb: data.awb_code, courier: data.courier_name, labelUrl };
}

export async function trackOrder(orderId: string) {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o?.trackingNumber) throw new Error("No AWB on this order");
  const j = await sr<{ tracking_data?: { shipment_status?: number; shipment_track?: { current_status: string; edd?: string }[]; shipment_track_activities?: { date: string; activity: string; location: string }[] } }>(`/courier/track/awb/${o.trackingNumber}`);
  const t = j.tracking_data;
  return { status: t?.shipment_track?.[0]?.current_status ?? "Unknown", edd: t?.shipment_track?.[0]?.edd, activities: t?.shipment_track_activities ?? [] };
}

export async function cancelShipment(orderId: string) {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o?.shiprocketOrderId) throw new Error("No Shiprocket order");
  await sr("/orders/cancel", { method: "POST", body: JSON.stringify({ ids: [Number(o.shiprocketOrderId)] }) });
  db.update(schema.orders).set({ shiprocketOrderId: null, shiprocketShipmentId: null, trackingNumber: null, trackingUrl: null, labelUrl: null }).where(eq(schema.orders.id, orderId)).run();
  addEvent(orderId, "shipping", "Shiprocket shipment cancelled");
}

/** Map Shiprocket status text → local order status. */
export function mapShiprocketStatus(s: string): Order["status"] | null {
  const u = s.toUpperCase();
  if (u.includes("DELIVERED") && !u.includes("UNDELIVERED") && !u.includes("RTO")) return "delivered";
  if (u.includes("CANCEL")) return "cancelled";
  if (u.includes("RTO")) return "cancelled";
  if (["SHIPPED", "IN TRANSIT", "OUT FOR DELIVERY", "PICKED UP", "REACHED"].some((k) => u.includes(k))) return "shipped";
  if (["PICKUP", "AWB", "READY"].some((k) => u.includes(k))) return "processing";
  return null;
}
