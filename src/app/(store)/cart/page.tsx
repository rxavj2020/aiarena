import Link from "next/link";
import { resolveCart, computeTotals } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { CartLines } from "@/components/store/CartLines";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const [lines, s] = await Promise.all([resolveCart(), getSettings()]);
  const t = await computeTotals(lines);
  if (!lines.length)
    return (
      <div className="container-x py-24 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto text-gray-300" />
        <h1 className="font-display text-3xl font-semibold mt-4">Your cart is empty</h1>
        <p className="text-gray-500 mt-2">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">Your cart</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <CartLines lines={lines} currency={s.currency} />
        <div className="card p-6 h-fit sticky top-24">
          <h2 className="font-semibold mb-4">Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatMoney(t.subtotal, s.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Shipping</dt><dd>{t.shipping ? formatMoney(t.shipping, s.currency) : "Free"}</dd></div>
            {s.tax.enabled && <div className="flex justify-between text-gray-500"><dt>{s.tax.label} {s.tax.inclusive ? "(included)" : ""}</dt><dd>{formatMoney(t.tax, s.currency)}</dd></div>}
            <div className="flex justify-between border-t pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(t.total, s.currency)}</dd></div>
          </dl>
          {s.shipping.freeAbove > 0 && t.subtotal < s.shipping.freeAbove && <p className="mt-3 text-xs text-gray-600 bg-amber-50 rounded-lg p-2.5">Add {formatMoney(s.shipping.freeAbove - t.subtotal, s.currency)} more for free shipping.</p>}
          <Link href="/checkout" className="btn-primary w-full mt-5 py-3">Proceed to checkout</Link>
          <Link href="/shop" className="btn-ghost w-full mt-2">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
