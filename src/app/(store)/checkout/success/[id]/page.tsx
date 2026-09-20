import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { CheckCircle2, Clock } from "lucide-react";
import { getPluginState } from "@/lib/plugins/store";
import Script from "next/script";

export default async function SuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const data = getOrder((await params).id);
  if (!data) notFound();
  const { order, items } = data;
  const s = await getSettings();
  const paid = order.paymentStatus === "paid" || order.paymentStatus === "cod";
  const an = getPluginState("analytics");
  return (
    <div className="container-x py-16 max-w-2xl">
      {an.enabled && paid && (
        <Script id="purchase-evt">{`try{window.gtag&&gtag('event','purchase',{transaction_id:'${order.orderNumber}',value:${(order.total / 100).toFixed(2)},currency:'${s.currency}'});window.fbq&&fbq('track','Purchase',{value:${(order.total / 100).toFixed(2)},currency:'${s.currency}'});}catch(e){}`}</Script>
      )}
      <div className="text-center">
        {paid ? <CheckCircle2 className="h-14 w-14 mx-auto text-green-600" /> : <Clock className="h-14 w-14 mx-auto text-amber-500" />}
        <h1 className="font-display text-3xl md:text-4xl font-semibold mt-4">{paid ? "Thank you for your order!" : "Payment pending"}</h1>
        <p className="text-gray-600 mt-2">Order <b>#{order.orderNumber}</b> · A confirmation has been sent to {order.email}</p>
        {!paid && <p className="text-sm text-amber-700 mt-2">We haven&apos;t received payment confirmation yet. If you completed payment, this page will update shortly.</p>}
      </div>
      <div className="card mt-8 divide-y">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 p-4 text-sm">
            <div className="h-14 w-14 rounded-md bg-gray-100 overflow-hidden">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex-1"><div>{i.name}</div>{i.variantTitle && <div className="text-xs text-gray-500">{i.variantTitle}</div>}<div className="text-xs text-gray-500">Qty {i.quantity}</div></div>
            <div>{formatMoney(i.price * i.quantity, s.currency)}</div>
          </div>
        ))}
        <div className="p-4 text-sm space-y-1">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatMoney(order.subtotal, s.currency)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>-{formatMoney(order.discount, s.currency)}</span></div>}
          <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shipping ? formatMoney(order.shipping, s.currency) : "Free"}</span></div>
          <div className="flex justify-between font-semibold text-base pt-2"><span>Total</span><span>{formatMoney(order.total, s.currency)}</span></div>
        </div>
      </div>
      <div className="card mt-4 p-4 text-sm">
        <div className="font-medium mb-1">Shipping to</div>
        <div className="text-gray-600">{order.shippingAddress.name}, {order.shippingAddress.line1}{order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</div>
        <div className="text-gray-500 mt-2">{s.shipping.estimateText}</div>
      </div>
      <div className="mt-8 flex gap-3 justify-center">
        <Link href={`/account/orders/${order.id}`} className="btn-outline">Track order</Link>
        <Link href="/shop" className="btn-primary">Continue shopping</Link>
      </div>
    </div>
  );
}
