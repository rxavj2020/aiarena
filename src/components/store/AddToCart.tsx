"use client";
import { useState, useTransition, useEffect } from "react";
import { addToCart } from "@/actions/cart";
import type { Variant } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { Minus, Plus, ShoppingBag, Check, Zap, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/useStore";

export function AddToCart({
  product,
  variants,
  currency,
  compact = false,
  onVariantChange,
}: {
  product: { id: string; stock: number; trackStock: boolean; options: { name: string; values: string[] }[]; price: number };
  variants: Variant[];
  currency: string;
  compact?: boolean;
  onVariantChange?: (v: Variant | null) => void;
}) {
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

  useEffect(() => {
    if (onVariantChange) onVariantChange(variant ?? null);
  }, [onVariantChange, variant]);

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

  if (compact) {
    return (
      <div className="space-y-3">
        {product.options.map((o) => (
          <div key={o.name}>
            <div className="text-xs font-bold uppercase tracking-wide text-[#212121] mb-2">
              {o.name}: <span className="font-normal normal-case text-[#878787]">{sel[o.name] || "Select"}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {o.values.map((v) => {
                const vv = variants.find((x) => x.optionValues[o.name] === v);
                const disabled = product.trackStock && vv && vv.stock <= 0 && product.options.length === 1;
                const hasImage = vv?.image;
                return (
                  <button
                    key={v}
                    disabled={disabled}
                    onClick={() => setSel({ ...sel, [o.name]: v })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${sel[o.name] === v ? "border-[#212121] bg-[#212121] text-white" : "border-[#e0e0e0] bg-white hover:border-[#212121]"} disabled:opacity-40`}
                  >
                    {hasImage && <img src={vv!.image!} alt="" className="h-4 w-4 rounded-full object-cover" />}
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-[#e0e0e0] bg-white">
            <button className="h-8 w-8 flex items-center justify-center hover:bg-[#f1f2f4] rounded-l-full" onClick={() => setQty(Math.max(1, qty - 1))}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold">{qty}</span>
            <button className="h-8 w-8 flex items-center justify-center hover:bg-[#f1f2f4] rounded-r-full" onClick={() => setQty(Math.min(product.trackStock ? Math.max(1, stock) : 99, qty + 1))}>
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-[11px] text-[#878787]">{stock > 0 ? `${stock} available` : ""}</span>
        </div>
        {err && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{err}</p>}
        <div className="space-y-2">
          <button disabled={pending || out} onClick={() => submit(false)} className="btn-primary w-full rounded-full py-2.5 text-sm bg-[#2874f0]">
            {done ? <><Check className="h-4 w-4" /> Added</> : out ? "Out of stock" : <><ShoppingBag className="h-4 w-4" /> Add to cart</>}
          </button>
          <button disabled={pending || out} onClick={() => submit(true)} className="btn-accent w-full rounded-full py-2.5 text-sm bg-[#fb641b]">
            <Zap className="h-4 w-4" /> Buy now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {product.options.map((o) => (
        <div key={o.name}>
          <div className="text-sm font-bold mb-2.5 flex items-center gap-2 text-[#212121]">
            {o.name}
            {sel[o.name] && <span className="text-xs font-medium text-[#878787] bg-[#f1f2f4] px-2 py-0.5 rounded-full">{sel[o.name]}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => {
              const vv = variants.find((x) => x.optionValues[o.name] === v);
              const disabled = product.trackStock && vv && vv.stock <= 0 && product.options.length === 1;
              const selected = sel[o.name] === v;
              const hasImage = vv?.image;
              return (
                <button
                  key={v}
                  disabled={disabled}
                  onClick={() => setSel({ ...sel, [o.name]: v })}
                  className={`relative rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${selected ? "border-[#212121] bg-[#212121] text-white shadow-sm" : "border-[#e0e0e0] bg-white hover:border-[#212121] hover:shadow-sm"} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {hasImage && <img src={vv!.image!} alt="" className="h-6 w-6 rounded-full object-cover border border-white/20" />}
                  {v}
                  {selected && <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#fb641b] rounded-full flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {variant && variant.price != null && variant.price !== product.price && (
        <div className="flex items-center gap-2 text-sm bg-[#fff8e1] border border-[#ffe082] rounded-xl p-3">
          <span className="text-[#e6a700] font-medium">Variant price:</span>
          <b className="text-[#212121]">{formatMoney(price, currency)}</b>
          <span className="text-xs text-[#878787]">instead of {formatMoney(product.price, currency)}</span>
        </div>
      )}

      {variant?.image && (
        <div className="flex items-center gap-2 text-xs bg-[#e8f0fe] border border-[#c2d6ff] rounded-xl p-3">
          <img src={variant.image} alt={variant.title} className="h-10 w-10 rounded-lg object-cover border" />
          <div><div className="font-bold text-[#212121]">{variant.title}</div><div className="text-[#878787] text-[11px]">Selected variant image</div></div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-[#e0e0e0] bg-white shadow-sm">
          <button className="h-10 w-10 flex items-center justify-center hover:bg-[#f1f2f4] rounded-l-full transition" onClick={() => setQty(Math.max(1, qty - 1))}>
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm font-bold">{qty}</span>
          <button className="h-10 w-10 flex items-center justify-center hover:bg-[#f1f2f4] rounded-r-full transition" onClick={() => setQty(Math.min(product.trackStock ? Math.max(1, stock) : 99, qty + 1))}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs">
          {product.trackStock && allSelected && stock > 0 && stock <= 5 ? (
            <span className="text-[#fb641b] font-bold bg-[#fff3e0] border border-[#ffcc80] px-2.5 py-1 rounded-full">Only {stock} left - order soon!</span>
          ) : (
            <span className="text-[#878787] flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> In stock, ready to ship</span>
          )}
        </div>
      </div>

      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">!</span> {err}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button disabled={pending || out} onClick={() => submit(false)} className="btn-primary rounded-full py-3.5 text-sm font-bold shadow-sm hover:shadow bg-[#2874f0]">
          {done ? <><Check className="h-4 w-4" /> Added to cart</> : out ? "Out of stock" : <><ShoppingBag className="h-4 w-4" /> Add to cart</>}
        </button>
        <button disabled={pending || out} onClick={() => submit(true)} className="btn-accent rounded-full py-3.5 text-sm font-bold shadow-sm hover:shadow flex items-center justify-center gap-2 bg-[#fb641b]">
          <Zap className="h-4 w-4" /> Buy now
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-[#878787] pt-2 border-t border-[#f0f0f0]">
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure transaction</span>
        <span>•</span>
        <span>Ships from {currency === "INR" ? "India" : "store"}</span>
      </div>
    </div>
  );
}
