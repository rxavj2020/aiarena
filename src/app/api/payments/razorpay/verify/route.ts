import { NextResponse } from "next/server";
import { razorpayVerifySignature } from "@/lib/plugins/payments";
import { markOrderPaid } from "@/lib/orders";
import { writeCart } from "@/lib/cart";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const b = (await req.json()) as { orderId: string; razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
  const order = db.select().from(schema.orders).where(eq(schema.orders.id, b.orderId)).get();
  if (!order || order.paymentRef !== b.razorpay_order_id) return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  try {
    if (!razorpayVerifySignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  await markOrderPaid(b.orderId, "razorpay", b.razorpay_payment_id);
  await writeCart([]);
  return NextResponse.json({ ok: true });
}
