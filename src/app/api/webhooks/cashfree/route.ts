import { NextResponse } from "next/server";
import { cashfreeVerifyWebhook } from "@/lib/plugins/payments";
import { markOrderPaid, markOrderFailed } from "@/lib/orders";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-webhook-signature") ?? "";
  const ts = req.headers.get("x-webhook-timestamp") ?? "";
  if (!cashfreeVerifyWebhook(raw, sig, ts)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const evt = JSON.parse(raw) as { type: string; data: { order: { order_id: string }; payment: { cf_payment_id: number; payment_status: string; payment_message?: string } } };
  const orderId = evt.data?.order?.order_id;
  if (!orderId) return NextResponse.json({ ok: true });
  if (evt.type === "PAYMENT_SUCCESS_WEBHOOK") await markOrderPaid(orderId, "cashfree", String(evt.data.payment.cf_payment_id));
  else if (evt.type === "PAYMENT_FAILED_WEBHOOK" || evt.type === "PAYMENT_USER_DROPPED_WEBHOOK") await markOrderFailed(orderId, "cashfree", evt.data.payment.payment_message ?? evt.type);
  return NextResponse.json({ ok: true });
}
