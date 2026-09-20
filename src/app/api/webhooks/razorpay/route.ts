import { NextResponse } from "next/server";
import { razorpayVerifyWebhook } from "@/lib/plugins/payments";
import { markOrderPaid, markOrderFailed } from "@/lib/orders";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!razorpayVerifyWebhook(raw, sig)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const evt = JSON.parse(raw) as { event: string; payload: { payment: { entity: { id: string; order_id: string; error_description?: string } } } };
  const p = evt.payload?.payment?.entity;
  if (!p) return NextResponse.json({ ok: true });
  const order = db.select().from(schema.orders).where(eq(schema.orders.paymentRef, p.order_id)).get();
  if (!order) return NextResponse.json({ ok: true });
  if (evt.event === "payment.captured") await markOrderPaid(order.id, "razorpay", p.id);
  else if (evt.event === "payment.failed") await markOrderFailed(order.id, "razorpay", p.error_description ?? "failed");
  return NextResponse.json({ ok: true });
}
