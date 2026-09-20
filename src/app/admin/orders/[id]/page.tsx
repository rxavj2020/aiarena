import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import { ArrowLeft, Printer } from "lucide-react";
import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const data = getOrder((await params).id);
  if (!data) notFound();
  const { order: o, items, events } = data;
  const s = await getSettings();
  const customerStats = o.userId ? db.select({ n: sql<number>`count(*)`, v: sql<number>`coalesce(sum(total),0)` }).from(schema.orders).where(eq(schema.orders.userId, o.userId)).get() : null;
  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-black inline-flex items-center gap-1 mb-3"><ArrowLeft className="h-3.5 w-3.5" /> Orders</Link>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Order #{o.orderNumber}</h1>
        <StatusBadge status={o.status} /><StatusBadge status={o.paymentStatus} />
        <span className="text-sm text-gray-500">{formatDate(o.createdAt)}</span>
        <a href={`/admin/orders/print?ids=${o.id}`} target="_blank" className="btn-outline btn-sm ml-auto"><Printer className="h-3.5 w-3.5" /> Packing slip</a>
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <div className="card">
            <table className="data">
              <thead><tr><th>Item</th><th>SKU</th><th className="text-right">Price</th><th className="text-right">Qty</th><th className="text-right">Total</th></tr></thead>
              <tbody>{items.map((i) => <tr key={i.id}><td><div className="flex items-center gap-3"><div className="h-10 w-10 rounded bg-gray-100 overflow-hidden">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div><div>{i.productId ? <Link href={`/admin/products/${i.productId}`} className="hover:underline">{i.name}</Link> : i.name}{i.variantTitle && <div className="text-xs text-gray-500">{i.variantTitle}</div>}</div></div></td><td className="text-xs text-gray-500">{i.sku}</td><td className="text-right">{formatMoney(i.price, s.currency)}</td><td className="text-right">{i.quantity}</td><td className="text-right font-medium">{formatMoney(i.price * i.quantity, s.currency)}</td></tr>)}</tbody>
            </table>
            <div className="p-4 text-sm space-y-1 max-w-xs ml-auto">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatMoney(o.subtotal, s.currency)}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount {o.couponCode && `(${o.couponCode})`}</span><span>-{formatMoney(o.discount, s.currency)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{formatMoney(o.shipping, s.currency)}</span></div>
              <div className="flex justify-between text-gray-500"><span>{s.tax.label} {s.tax.inclusive && "(incl.)"}</span><span>{formatMoney(o.tax, s.currency)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>Total</span><span>{formatMoney(o.total, s.currency)}</span></div>
            </div>
          </div>
          <OrderActions order={o} />
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Timeline</h2>
            <ul className="space-y-3">{[...events].reverse().map((e) => <li key={e.id} className="flex gap-3 text-sm"><div className="mt-1.5 h-2 w-2 rounded-full bg-gray-300 shrink-0" /><div><div>{e.message}</div><div className="text-xs text-gray-400">{formatDate(e.createdAt)} · {e.type}</div></div></li>)}</ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4 text-sm">
            <h3 className="font-semibold mb-2">Customer</h3>
            <div>{o.shippingAddress.name}</div>
            <a href={`mailto:${o.email}`} className="text-gray-600 hover:underline block">{o.email}</a>
            <a href={`tel:${o.phone ?? o.shippingAddress.phone}`} className="text-gray-600 block">{o.phone ?? o.shippingAddress.phone}</a>
            {customerStats && <div className="text-xs text-gray-500 mt-2">{customerStats.n} orders · {formatMoney(customerStats.v, s.currency)} lifetime</div>}
            {!o.userId && <div className="text-xs text-gray-400 mt-2">Guest checkout</div>}
          </div>
          <div className="card p-4 text-sm">
            <h3 className="font-semibold mb-2">Shipping address</h3>
            <div className="text-gray-700 leading-relaxed">{o.shippingAddress.line1}{o.shippingAddress.line2 && <>, {o.shippingAddress.line2}</>}<br />{o.shippingAddress.city}, {o.shippingAddress.state}<br />{o.shippingAddress.postalCode}, {o.shippingAddress.country}</div>
            <a className="text-xs underline mt-2 inline-block" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(`${o.shippingAddress.line1}, ${o.shippingAddress.city}, ${o.shippingAddress.postalCode}`)}`}>View on map</a>
          </div>
          <div className="card p-4 text-sm">
            <h3 className="font-semibold mb-2">Payment</h3>
            <div className="capitalize">{o.paymentProvider ?? "—"}</div>
            {o.paymentRef && <div className="text-xs text-gray-500 break-all">Ref: {o.paymentRef}</div>}
          </div>
          {o.customerNote && <div className="card p-4 text-sm bg-amber-50 border-amber-200"><h3 className="font-semibold mb-1">Customer note</h3><p>{o.customerNote}</p></div>}
        </div>
      </div>
    </div>
  );
}
