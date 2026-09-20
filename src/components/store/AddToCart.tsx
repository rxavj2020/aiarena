"use client";
import { useState, useTransition } from "react";
import { addToCart } from "@/actions/cart";
import type { Variant } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/useStore";

export function AddToCart({ product, variants, currency }: { product: { id: string; stock: number; trackStock: boolean; options: { name: string; values: string[] }[]; price: number }; variants: Variant[]; currency: string }) {
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const { openCart, addToast } = useStore();

  const variant = product.options.length ? variants.find((v) => product.options.every((o) => v.optionValues[o.name] === sel[o.name])) : undefined;
  const allSelected = product.options.every((o) => sel[o.name]);
  const stock = variant ? variant.stock : product.stock;
  const out = product.trackStock && (product.options.length ? allSelected && stock <= 0 : stock <= 0);
  const price = variant?.price ?? product.price;

  const submit = (buyNow: boolean) => {
    setErr(null);
    if (product.options.length && !variant) return setErr("Please select " + product.options.map((o) => o.name.toLowerCase()).join(" and "));
    const fd = new FormData();
    fd.set("productId", product.id);
    if (variant) fd.set("variantId", variant.id);
    fd.set("qty", String(qty));
    if (buyNow) fd.set("buyNow", "1");
    start(async () => {
      const r = await addToCart(fd);
      if (r && !r.ok) setErr(r.error ?? "Failed");
      else {
        setDone(true);
        router.refresh();
        if (!buyNow) {
          openCart();
          addToast("Added to cart", "success");
        }
        setTimeout(() => setDone(false), 2000);
      }
    });
  };

  return (
    <div className="space-y-5">
      {product.options.map((o) => (
        <div key={o.name}>
          <div className="text-sm font-medium mb-2">{o.name}{sel[o.name] && <span className="text-gray-500 font-normal">: {sel[o.name]}</span>}</div>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => {
              const vv = variants.find((x) => x.optionValues[o.name] === v);
              const disabled = product.trackStock && vv && vv.stock <= 0 && product.options.length === 1;
              return (
                <button key={v} disabled={disabled} onClick={() => setSel({ ...sel, [o.name]: v })} className={`rounded-lg border px-3.5 py-2 text-sm ${sel[o.name] === v ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:border-gray-900"} disabled:opacity-40 disabled:line-through`}>{v}</button>
              );
            })}
          </div>
        </div>
      ))}
      {variant && variant.price != null && variant.price !== product.price && <div className="text-sm">Price: <b>{formatMoney(price, currency)}</b></div>}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-gray-300">
          <button className="p-2.5 hover:bg-gray-50" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button className="p-2.5 hover:bg-gray-50" onClick={() => setQty(Math.min(product.trackStock ? Math.max(1, stock) : 99, qty + 1))}><Plus className="h-4 w-4" /></button>
        </div>
        {product.trackStock && allSelected && stock > 0 && stock <= 5 && <span className="text-xs text-orange-600 font-medium">Only {stock} left</span>}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-3">
        <button disabled={pending || out} onClick={() => submit(false)} className="btn-primary flex-1 py-3">
          {done ? <><Check className="h-4 w-4" /> Added</> : out ? "Sold out" : <><ShoppingBag className="h-4 w-4" /> Add to cart</>}
        </button>
        <button disabled={pending || out} onClick={() => submit(true)} className="btn-accent flex-1 py-3">Buy now</button>
      </div>
    </div>
  );
}
