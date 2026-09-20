"use client";

import { useEffect, useState, useTransition } from "react";
import { useStore } from "@/lib/store/useStore";
import { formatMoney } from "@/lib/format";
import { updateQty } from "@/actions/cart";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Truck, Sparkles, Lock, ShieldCheck } from "lucide-react";
import type { ResolvedLine, Totals } from "@/lib/cart";

export function CartDrawer() {
  const { isCartOpen, closeCart } = useStore();
  const [lines, setLines] = useState<ResolvedLine[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [freeAbove, setFreeAbove] = useState(0);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const fetchCart = async () => {
    try {
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
    }
  };

  useEffect(() => {
    if (isCartOpen) {
      fetchCart();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape" && isCartOpen) closeCart(); };
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
  const freeProgress = freeAbove > 0 ? Math.min(100, Math.round((subtotal / freeAbove) * 100)) : 100;
  const toFree = Math.max(0, freeAbove - subtotal);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div onClick={closeCart} className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-[420px] bg-[#f8f9fb] h-full shadow-2xl flex flex-col z-10 animate-slide-left">
        <div className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm">Shopping Cart</div>
              <div className="text-xs text-gray-500">{lines.reduce((a, b) => a + b.qty, 0)} items</div>
            </div>
          </div>
          <button onClick={closeCart} className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {freeAbove > 0 && (
          <div className="bg-white border-b p-4">
            {toFree > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-[#ff6b00]" /> Add <b>{formatMoney(toFree, currency)}</b> for FREE Delivery</span>
                  <span className="text-gray-500">{freeProgress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff6b00] rounded-full transition-all duration-500" style={{ width: `${freeProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <Sparkles className="h-4 w-4 text-emerald-600" /> 🎉 FREE Delivery unlocked!
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {lines.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-white border flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-gray-300" />
              </div>
              <div className="font-bold text-gray-900">Your cart is empty</div>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">Add some products to get started with seamless shopping</p>
              <button onClick={closeCart} className="btn-primary btn-sm rounded-full mt-4">Continue shopping <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.key} className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-3">
                <div className="h-20 w-20 rounded-xl bg-[#f8f9fb] overflow-hidden border shrink-0">
                  {l.image ? <img src={l.image} alt={l.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">No pic</div>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/products/${l.slug}`} onClick={closeCart} className="font-medium text-xs line-clamp-2 leading-snug hover:text-gray-900">{l.name}</Link>
                    <button onClick={() => handleQtyChange(l.key, 0)} disabled={pendingKey === l.key} className="h-6 w-6 rounded-full bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {l.variantTitle && <div className="mt-1 text-[11px] bg-gray-100 px-2 py-0.5 rounded-full w-fit">{l.variantTitle}</div>}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center rounded-full border border-gray-200 bg-white shadow-sm">
                      <button onClick={() => handleQtyChange(l.key, l.qty - 1)} disabled={pendingKey === l.key} className="h-7 w-7 flex items-center justify-center hover:bg-gray-50 rounded-l-full disabled:opacity-40"><Minus className="h-3 w-3" /></button>
                      <span className="w-7 text-center text-xs font-bold">{l.qty}</span>
                      <button onClick={() => handleQtyChange(l.key, l.qty + 1)} disabled={pendingKey === l.key} className="h-7 w-7 flex items-center justify-center hover:bg-gray-50 rounded-r-full disabled:opacity-40"><Plus className="h-3 w-3" /></button>
                    </div>
                    <div className="font-bold text-xs">{formatMoney(l.price * l.qty, currency)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="bg-white border-t p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Subtotal ({lines.reduce((a, b) => a + b.qty, 0)} items)</span>
              <span className="font-bold text-sm">{formatMoney(subtotal, currency)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart} className="btn-primary w-full py-3.5 rounded-full text-sm font-bold shadow-sm flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" /> Secure Checkout
            </Link>
            <Link href="/cart" onClick={closeCart} className="btn-outline w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1 bg-white">
              View cart & checkout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <ShieldCheck className="h-3 w-3" /> 100% secure · Free returns · Buyer protection
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
