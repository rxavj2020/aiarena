"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { addToCart } from "@/actions/cart";

/**
 * Add-to-bag for one website. Everything (cart cookie + redirects) is scoped
 * to the tenant so the platform and other websites are untouched.
 */
export function AddToSiteCart({
  productId,
  tenantId,
  base,
  variants,
  stock,
  buyable,
  maxQty = 10,
}: {
  productId: string;
  tenantId: string;
  base: string;
  variants: { id: string; title: string; stock: number }[];
  stock: number;
  buyable: boolean;
  maxQty?: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const selected = variants.find((v) => v.id === variantId);
  const effectiveStock = selected ? selected.stock : stock;
  const needsOption = variants.length > 0 && !variantId;

  const submit = (buyNow: boolean) => {
    setError(null);
    const fd = new FormData();
    fd.set("productId", productId);
    if (variantId) fd.set("variantId", variantId);
    fd.set("qty", String(qty));
    fd.set("tenantId", tenantId);
    fd.set("base", base);
    if (buyNow) fd.set("buyNow", "1");
    start(async () => {
      const res = await addToCart(fd);
      if (res && res.ok === false) setError(res.error ?? "Could not add to cart");
      else if (!buyNow) router.refresh();
    });
  };

  if (!buyable) {
    return (
      <div className="s-note">
        This product is mirrored from the store&apos;s external catalogue. Online checkout for it opens soon — the store owner can be reached from the footer.
      </div>
    );
  }

  return (
    <div className="s-buy-box">
      {variants.length > 0 ? (
        <div>
          <label className="s-label" htmlFor="variant">Option</label>
          <select id="variant" className="s-input" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            <option value="">Select…</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                {v.title}{v.stock <= 0 ? " — sold out" : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label className="s-label">Quantity</label>
        <div className="s-qty">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
        </div>
      </div>

      {error ? <p className="s-error">{error}</p> : null}

      <div className="s-buy-actions">
        <button type="button" disabled={pending || needsOption || effectiveStock <= 0} onClick={() => submit(false)} className="s-btn s-btn-primary s-btn-lg">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />} Add to cart
        </button>
        <button type="button" disabled={pending || needsOption || effectiveStock <= 0} onClick={() => submit(true)} className="s-btn s-btn-accent s-btn-lg">
          Buy now
        </button>
      </div>
      {effectiveStock <= 0 ? <p className="s-note">This item is currently sold out.</p> : null}
    </div>
  );
}
