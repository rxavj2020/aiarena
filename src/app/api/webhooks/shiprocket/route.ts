import { NextResponse } from "next/server";
import { getPluginState } from "@/lib/plugins/store";
import { mapShiprocketStatus } from "@/lib/plugins/shiprocket";
import { db, schema } from "@/lib/db";
import { eq, or } from "drizzle-orm";
import { addEvent, updateOrderStatus } from "@/lib/orders";

export async function POST(req: Request) {
  const c = getPluginState("shiprocket").config;
  const key = req.headers.get("x-api-key") ?? "";
  if (!c.webhookToken || key !== c.webhookToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) as { awb?: string; order_id?: string; current_status?: string; shipment_status?: string; etd?: string; scans?: unknown[] };
  const status = b.current_status ?? b.shipment_status ?? "";
  const num = Number(b.order_id);
  const order = db.select().from(schema.orders).where(or(b.awb ? eq(schema.orders.trackingNumber, b.awb) : undefined, !isNaN(num) ? eq(schema.orders.orderNumber, num) : undefined)).get();
  if (!order) return NextResponse.json({ ok: true, ignored: true });
  addEvent(order.id, "shipping", `Shiprocket: ${status}${b.etd ? ` (ETA ${b.etd})` : ""}`);
  const mapped = mapShiprocketStatus(status);
  if (mapped && mapped !== order.status && !(["delivered", "cancelled", "refunded"].includes(order.status))) await updateOrderStatus(order.id, mapped, { notify: mapped === "delivered" || mapped === "shipped" });
  return NextResponse.json({ ok: true });
}
