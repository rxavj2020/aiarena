import Link from "next/link";
import { resolveCart, computeTotals } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { CartLines } from "@/components/store/CartLines";
import { ShoppingBag, Truck, ShieldCheck, ArrowRight, Sparkles, Package } from "lucide-react";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const [lines, s] = await Promise.all([resolveCart(), getSettings()]);
  const t = await computeTotals(lines);

  if (!lines.length)
    return (
      <div className="bg-[#f8f9fb] min-h-[70vh]">
        <div className="container-x py-12 sm:py-20">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mb-5">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
            <p className="text-sm text-gray-500 mt-2">Looks like you haven&apos;t added anything yet. Start exploring our collection.</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/shop" className="btn-primary rounded-full py-3">
                Start shopping
              </Link>
              <Link href="/" className="btn-ghost text-sm">
                Back to home
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 text-[11px] text-gray-500">
              <div className="bg-gray-50 rounded-xl p-3">
                <Truck className="h-4 w-4 mx-auto mb-1" /> Free shipping
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <ShieldCheck className="h-4 w-4 mx-auto mb-1" /> Secure
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <Package className="h-4 w-4 mx-auto mb-1" /> Easy returns
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  const freeProgress = s.shipping.freeAbove > 0 ? Math.min(100, Math.round((t.subtotal / s.shipping.freeAbove) * 100)) : 100;
  const toFree = Math.max(0, s.shipping.freeAbove - t.subtotal);

  return (
    <div className="bg-[#f8f9fb] min-h-screen">
      <div className="container-x py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold">Shopping Cart</h1>
            <p className="text-xs text-gray-500">{lines.reduce((a, b) => a + b.qty, 0)} items · {formatMoney(t.subtotal, s.currency)} subtotal</p>
          </div>
        </div>

        {/* Free shipping banner */}
        {s.shipping.freeAbove > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4">
            {toFree > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Truck className="h-4 w-4 text-[#ff6b00]" />
                    Add <b>{formatMoney(toFree, s.currency)}</b> more for FREE Delivery
                  </span>
                  <span className="text-xs font-bold text-gray-500">{freeProgress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff6b00] rounded-full transition-all duration-500" style={{ width: `${freeProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                <Sparkles className="h-4 w-4 text-emerald-600" /> 🎉 You unlocked FREE Delivery!
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between text-xs font-semibold">
                <span>{lines.length} ITEMS IN CART</span>
                <span className="text-gray-500 font-normal hidden sm:inline">Price includes taxes · Free returns</span>
              </div>
              <CartLines lines={lines} currency={s.currency} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between text-sm">
              <Link href="/shop" className="flex items-center gap-2 font-medium hover:text-gray-900">
                <ArrowRight className="h-4 w-4 rotate-180" /> Continue shopping
              </Link>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout
              </span>
            </div>
          </div>

          {/* Price details - Flipkart style sticky */}
          <div className="lg:sticky lg:top-[88px] h-fit space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-bold text-sm tracking-wide uppercase text-gray-500 mb-4">Price Details</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Price ({lines.reduce((a, b) => a + b.qty, 0)} items)</dt>
                  <dd className="font-medium">{formatMoney(t.subtotal, s.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Delivery Charges</dt>
                  <dd className="font-medium">
                    {t.shipping ? formatMoney(t.shipping, s.currency) : <span className="text-emerald-600 font-bold">FREE</span>}
                  </dd>
                </div>
                {s.tax.enabled && (
                  <div className="flex justify-between text-gray-500 text-xs">
                    <dt>
                      {s.tax.label} {s.tax.inclusive ? "(included)" : ""}
                    </dt>
                    <dd>{formatMoney(t.tax, s.currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed pt-3 text-base font-bold">
                  <dt>Total Amount</dt>
                  <dd>{formatMoney(t.total, s.currency)}</dd>
                </div>
              </dl>

              {toFree > 0 && s.shipping.freeAbove > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  Add {formatMoney(toFree, s.currency)} more to get <b>FREE Delivery</b>
                </div>
              )}

              <Link href="/checkout" className="btn-accent w-full mt-5 py-3.5 rounded-full text-sm font-bold shadow-sm flex items-center justify-center gap-2">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Safe & secure payments · 100% purchase protection
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-[10px] text-center text-gray-500">
                <div>
                  <Truck className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  Fast delivery
                </div>
                <div>
                  <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  Buyer protection
                </div>
                <div>
                  <Package className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  Easy returns
                </div>
              </div>
            </div>

            <div className="bg-[#f1f8e9] border border-[#d8edc0] rounded-2xl p-4 text-xs">
              <div className="font-bold text-[#2e7d32] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Offers & Benefits
              </div>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• 10% off on HDFC cards</li>
                <li>• Free delivery on this order</li>
                <li>• 7 days easy returns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
