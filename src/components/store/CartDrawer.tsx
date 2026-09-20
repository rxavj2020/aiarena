"use client";

import { useEffect, useState, useTransition } from "react";
import { useStore } from "@/lib/store/useStore";
import { formatMoney } from "@/lib/format";
import { updateQty } from "@/actions/cart";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Truck,
  Sparkles,
  Lock,
} from "lucide-react";
import type { ResolvedLine, Totals } from "@/lib/cart";

export function CartDrawer() {
  const { isCartOpen, closeCart } = useStore();
  const [lines, setLines] = useState<ResolvedLine[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [freeAbove, setFreeAbove] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setLines(data.lines || []);
        setTotals(data.totals || null);
        setCurrency(data.currency || "INR");
        setFreeAbove(data.freeAbove || 0);
      }
    } catch (e) {
      console.error("Cart fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCartOpen) {
      fetchCart();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  const handleQtyChange = (key: string, newQty: number) => {
    setPendingKey(key);
    startTransition(async () => {
      await updateQty(key, newQty);
      await fetchCart();
      router.refresh();
      setPendingKey(null);
    });
  };

  if (!isCartOpen) return null;

  const subtotal = totals?.subtotal || 0;
  const freeShippingProgress =
    freeAbove > 0 ? Math.min(100, Math.round((subtotal / freeAbove) * 100)) : 100;
  const amountToFreeShipping = Math.max(0, freeAbove - subtotal);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-800" />
            <span className="font-semibold text-base text-gray-900">Your Cart</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {lines.reduce((a, b) => a + b.qty, 0)} items
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Shipping Progress Meter (Flipkart/Amazon style incentive) */}
        {freeAbove > 0 && (
          <div className="p-3.5 bg-gray-50 border-b border-gray-100 text-xs">
            {amountToFreeShipping > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-medium text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-accent" />
                    Add{" "}
                    <b className="text-gray-900">{formatMoney(amountToFreeShipping, currency)}</b>{" "}
                    for Free Shipping
                  </span>
                  <span className="font-semibold text-gray-500">{freeShippingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>🎉 You unlocked FREE Delivery on this order!</span>
              </div>
            )}
          </div>
        )}

        {/* Line items */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
          {lines.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto" />
              <div className="font-medium text-gray-900">Your cart is empty</div>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Explore our collection to find something you like.
              </p>
              <button
                onClick={closeCart}
                className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1 mt-2"
              >
                Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.key} className="py-3.5 flex gap-3">
                <div className="relative h-18 w-18 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                  {l.image ? (
                    <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                      No pic
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${l.slug}`}
                        onClick={closeCart}
                        className="font-medium text-xs text-gray-900 hover:text-primary line-clamp-1"
                      >
                        {l.name}
                      </Link>
                      <button
                        onClick={() => handleQtyChange(l.key, 0)}
                        disabled={pendingKey === l.key}
                        className="text-gray-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {l.variantTitle && (
                      <div className="text-[11px] text-gray-500">{l.variantTitle}</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button
                        onClick={() => handleQtyChange(l.key, l.qty - 1)}
                        disabled={pendingKey === l.key}
                        className="p-1 hover:bg-gray-50 text-gray-600 disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold">{l.qty}</span>
                      <button
                        onClick={() => handleQtyChange(l.key, l.qty + 1)}
                        disabled={pendingKey === l.key}
                        className="p-1 hover:bg-gray-50 text-gray-600 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="font-semibold text-xs text-gray-900">
                      {formatMoney(l.price * l.qty, currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white space-y-3">
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Shipping & taxes</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Lock className="h-4 w-4" /> Proceed to Checkout
            </Link>

            <Link
              href="/cart"
              onClick={closeCart}
              className="btn-outline w-full py-2 text-xs text-center block"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
