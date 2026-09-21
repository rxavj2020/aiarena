"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { updateQty, clearCart } from "@/actions/cart";
import { formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/cart";
import { siteHref } from "@/lib/site-links";

export type CartLineView = {
  key: string;
  productId: string;
  name: string;
  slug: string;
  variantTitle?: string;
  image?: string;
  price: number;
  qty: number;
};

/** Shopping bag of one website — updates hit only this site's cart cookie. */
export function TenantCartView({
  lines,
  totals,
  base,
  tenantId,
  currency,
}: {
  lines: CartLineView[];
  totals: Totals;
  base: string;
  tenantId: string;
  currency: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const scope = { tenantId, base };

  const change = (key: string, qty: number) =>
    start(async () => {
      await updateQty(key, qty, scope);
      router.refresh();
    });

  const clear = () =>
    start(async () => {
      await clearCart(scope);
      router.refresh();
    });

  return (
    <div className="s-cart-layout">
      <div className="s-cart-lines">
        <div className="s-cart-lines-head">
          <h1 className="s-h1">Your cart</h1>
          {lines.length ? (
            <button type="button" onClick={clear} disabled={pending} className="s-link-danger">Clear cart</button>
          ) : null}
        </div>
        {lines.map((l) => (
          <div key={l.key} className="s-cart-line">
            <Link href={siteHref(base, `/products/${l.slug}`)} className="s-cart-thumb">
              {l.image ? <img src={l.image} alt={l.name} /> : <span>No image</span>}
            </Link>
            <div className="s-cart-line-info">
              <Link href={siteHref(base, `/products/${l.slug}`)} className="s-cart-line-name">{l.name}</Link>
              {l.variantTitle ? <div className="s-cart-line-variant">{l.variantTitle}</div> : null}
              <div className="s-cart-line-price">{formatMoney(l.price, currency)}</div>
            </div>
            <div className="s-cart-line-actions">
              <div className="s-qty s-qty-sm">
                <button type="button" disabled={pending} onClick={() => change(l.key, l.qty - 1)} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                <span>{l.qty}</span>
                <button type="button" disabled={pending} onClick={() => change(l.key, l.qty + 1)} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <button type="button" disabled={pending} onClick={() => change(l.key, 0)} className="s-icon-btn" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {!lines.length ? (
          <div className="s-empty">
            <p>Your cart is empty.</p>
            <Link href={siteHref(base, "/shop")} className="s-btn s-btn-primary">Browse the collection</Link>
          </div>
        ) : null}
      </div>

      {lines.length ? (
        <aside className="s-summary">
          <h2 className="s-h3">Order summary</h2>
          <dl className="s-summary-list">
            <div><dt>Subtotal</dt><dd>{formatMoney(totals.subtotal, currency)}</dd></div>
            {totals.discount ? <div><dt>Discount</dt><dd>−{formatMoney(totals.discount, currency)}</dd></div> : null}
            <div><dt>Shipping</dt><dd>{totals.shipping ? formatMoney(totals.shipping, currency) : "Free"}</dd></div>
            {totals.tax ? <div><dt>Tax</dt><dd>{formatMoney(totals.tax, currency)}</dd></div> : null}
            <div className="s-summary-total"><dt>Total</dt><dd>{formatMoney(totals.total, currency)}</dd></div>
          </dl>
          <Link href={siteHref(base, "/checkout")} className="s-btn s-btn-primary s-btn-lg s-btn-block">
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      ) : null}
    </div>
  );
}
