import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Order, OrderItem } from "@/lib/db/schema";
import { Check } from "lucide-react";

const STEPS = ["confirmed", "processing", "shipped", "delivered"];

export function OrderDetail({ order: o, items, events, currency }: { order: Order; items: OrderItem[]; events: { id: string; type: string; message: string; createdAt: string }[]; currency: string }) {
  const stepIdx = STEPS.indexOf(o.status);
  const cancelled = o.status === "cancelled" || o.status === "refunded";
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 className="font-display text-3xl font-semibold">Order #{o.orderNumber}</h1><div className="text-sm text-gray-500">{formatDate(o.createdAt)}</div></div>
        <StatusBadge status={o.status} />
      </div>
      {!cancelled && (
        <div className="card p-5 mb-6">
          <div className="flex items-center">
            {STEPS.map((st, i) => (
              <div key={st} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${i <= stepIdx ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}`}>{i <= stepIdx ? <Check className="h-4 w-4" /> : i + 1}</div>
                  <div className="text-[11px] mt-1.5 capitalize text-gray-600">{st}</div>
                </div>
                {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 -mt-5 ${i < stepIdx ? "bg-green-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          {o.trackingNumber && <div className="mt-4 text-sm bg-gray-50 rounded-lg p-3">Tracking: <b>{o.carrier ? o.carrier + " · " : ""}{o.trackingNumber}</b>{o.trackingUrl && <> · <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="underline">Track package</a></>}</div>}
        </div>
      )}
      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="card divide-y">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-4 p-4 text-sm">
              <div className="h-16 w-16 rounded-md bg-gray-100 overflow-hidden">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div>
              <div className="flex-1"><div className="font-medium">{i.name}</div>{i.variantTitle && <div className="text-xs text-gray-500">{i.variantTitle}</div>}<div className="text-xs text-gray-500">{formatMoney(i.price, currency)} × {i.quantity}</div></div>
              <div className="font-medium">{formatMoney(i.price * i.quantity, currency)}</div>
            </div>
          ))}
          <div className="p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatMoney(o.subtotal, currency)}</span></div>
            {o.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount {o.couponCode && `(${o.couponCode})`}</span><span>-{formatMoney(o.discount, currency)}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{o.shipping ? formatMoney(o.shipping, currency) : "Free"}</span></div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t mt-2"><span>Total</span><span>{formatMoney(o.total, currency)}</span></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4 text-sm"><div className="font-medium mb-1">Shipping address</div><div className="text-gray-600 leading-relaxed">{o.shippingAddress.name}<br />{o.shippingAddress.line1}{o.shippingAddress.line2 && <>, {o.shippingAddress.line2}</>}<br />{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}<br />{o.shippingAddress.phone}</div></div>
          <div className="card p-4 text-sm"><div className="font-medium mb-1">Payment</div><div className="text-gray-600 capitalize">{o.paymentStatus} {o.paymentProvider && `· ${o.paymentProvider}`}</div></div>
          <div className="card p-4 text-sm"><div className="font-medium mb-2">History</div><ul className="space-y-2">{events.filter((e) => e.type !== "email").map((e) => <li key={e.id} className="text-xs"><div className="text-gray-800">{e.message}</div><div className="text-gray-400">{formatDate(e.createdAt)}</div></li>)}</ul></div>
        </div>
      </div>
    </div>
  );
}
