import { NextResponse } from "next/server";
import { cashfreeFetchOrder } from "@/lib/plugins/payments";
import { markOrderPaid } from "@/lib/orders";
import { orderSiteBase, clearOrderCart } from "@/lib/tenant-site";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");
  // `base` is the website the shopper checked out on (e.g. /store/my-shop).
  // Only site-scoped paths are honoured so a crafted link can't leave the site.
  const rawBase = url.searchParams.get("base") ?? "";
  const base = /^\/store\/[a-z0-9-]+$/.test(rawBase) ? rawBase : orderId ? orderSiteBase(orderId) : "";
  if (!orderId) return NextResponse.redirect(new URL("/cart", url.origin));
  try {
    const o = await cashfreeFetchOrder(orderId);
    if (o.order_status === "PAID") {
      await markOrderPaid(orderId, "cashfree", o.cf_order_id);
      await clearOrderCart(orderId);
    }
  } catch {}
  return NextResponse.redirect(new URL(`${base}/checkout/success/${orderId}`, url.origin));
}
