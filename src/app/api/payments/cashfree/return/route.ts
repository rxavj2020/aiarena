import { NextResponse } from "next/server";
import { cashfreeFetchOrder } from "@/lib/plugins/payments";
import { markOrderPaid } from "@/lib/orders";
import { writeCart } from "@/lib/cart";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");
  if (!orderId) return NextResponse.redirect(new URL("/cart", url.origin));
  try {
    const o = await cashfreeFetchOrder(orderId);
    if (o.order_status === "PAID") {
      await markOrderPaid(orderId, "cashfree", o.cf_order_id);
      await writeCart([]);
    }
  } catch {}
  return NextResponse.redirect(new URL(`/checkout/success/${orderId}`, url.origin));
}
