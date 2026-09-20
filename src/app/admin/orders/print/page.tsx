import { getOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatDate } from "@/lib/format";
import { PrintButton } from "@/components/admin/PrintButton";

export default async function PrintSlips({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const ids = ((await searchParams).ids ?? "").split(",").filter(Boolean);
  const s = await getSettings();
  const orders = ids.map(getOrder).filter(Boolean) as NonNullable<ReturnType<typeof getOrder>>[];
  return (
    <div className="bg-white -m-6 lg:-m-8 p-8 print:p-0">
      <div className="print:hidden mb-6 flex gap-2"><PrintButton /></div>
      {orders.map(({ order: o, items }) => (
        <div key={o.id} className="max-w-2xl mx-auto border rounded-xl p-8 mb-8 break-after-page print:border-0">
          <div className="flex justify-between items-start"><div><div className="text-2xl font-semibold">{s.storeName}</div><div className="text-xs text-gray-500 whitespace-pre-line">{s.address}</div></div><div className="text-right"><div className="text-xl font-semibold">Packing slip</div><div className="text-sm">Order #{o.orderNumber}</div><div className="text-xs text-gray-500">{formatDate(o.createdAt)}</div></div></div>
          <div className="grid grid-cols-2 gap-6 mt-8 text-sm">
            <div><div className="text-xs font-semibold uppercase text-gray-500 mb-1">Ship to</div><div className="font-medium">{o.shippingAddress.name}</div><div>{o.shippingAddress.line1}{o.shippingAddress.line2 && <>, {o.shippingAddress.line2}</>}</div><div>{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}</div><div>{o.shippingAddress.phone}</div></div>
            <div><div className="text-xs font-semibold uppercase text-gray-500 mb-1">Payment</div><div className="capitalize">{o.paymentStatus === "cod" ? `Cash on Delivery — COLLECT ${formatMoney(o.total, s.currency)}` : `${o.paymentStatus} (${o.paymentProvider})`}</div>{o.customerNote && <div className="mt-3"><div className="text-xs font-semibold uppercase text-gray-500">Note</div><div>{o.customerNote}</div></div>}</div>
          </div>
          <table className="w-full text-sm mt-8"><thead><tr className="border-b"><th className="text-left py-2">Item</th><th className="text-left">SKU</th><th className="text-right">Qty</th><th className="text-right">Price</th></tr></thead><tbody>{items.map((i) => <tr key={i.id} className="border-b"><td className="py-2">{i.name}{i.variantTitle && ` — ${i.variantTitle}`}</td><td className="text-gray-500">{i.sku}</td><td className="text-right">{i.quantity}</td><td className="text-right">{formatMoney(i.price * i.quantity, s.currency)}</td></tr>)}</tbody></table>
          <div className="text-right mt-4 text-sm"><div>Subtotal {formatMoney(o.subtotal, s.currency)}</div>{o.discount > 0 && <div>Discount -{formatMoney(o.discount, s.currency)}</div>}<div>Shipping {formatMoney(o.shipping, s.currency)}</div><div className="font-semibold text-base">Total {formatMoney(o.total, s.currency)}</div></div>
          <div className="text-center text-xs text-gray-500 mt-10">Thank you for shopping with {s.storeName}! Questions? {s.supportEmail}</div>
        </div>
      ))}
    </div>
  );
}
