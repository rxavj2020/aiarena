"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { Star, ShoppingBag, Truck, Gem } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import { WishlistButton } from "./WishlistButton";
import { useState, useTransition } from "react";
import { addToCart } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/useStore";

export function ProductCard({
  p,
  currency,
  variant = "default",
}: {
  p: Product & { rating?: number; reviewCount?: number };
  currency: string;
  variant?: "default" | "compact" | "list";
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { openCart, addToast } = useStore();
  const [hovered, setHovered] = useState(false);

  const off =
    p.compareAtPrice && p.compareAtPrice > p.price
      ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
      : 0;
  const out = p.trackStock && p.stock <= 0;
  const lowStock = p.trackStock && p.stock > 0 && p.stock <= 5;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fd = new FormData();
    fd.set("productId", p.id);
    fd.set("qty", "1");
    start(async () => {
      const r = await addToCart(fd);
      if (r && !r.ok) addToast(r.error ?? "Failed", "error");
      else {
        router.refresh();
        openCart();
        addToast("Added to cart", "success");
      }
    });
  };

  if (variant === "list") {
    return (
      <div className="group bg-white rounded-lg border border-[#e0e0e0] p-3 flex gap-4 hover:border-[#2874f0] hover:shadow-sm transition-all">
        <Link href={`/products/${p.slug}`} className="relative h-28 w-28 shrink-0 rounded-lg bg-[#f8f9fb] overflow-hidden border border-[#f0f0f0]">
          {p.images[0] && <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />}
          {off > 0 && <span className="absolute left-1.5 top-1.5 bg-[#388e3c] text-white text-[10px] font-bold px-2 py-0.5 rounded">{off}% off</span>}
        </Link>
        <div className="flex-1 min-w-0 flex flex-col">
          <Link href={`/products/${p.slug}`} className="font-medium text-sm line-clamp-2 group-hover:text-[#2874f0] leading-snug text-[#212121]">
            {p.name}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            {p.reviewCount ? (
              <span className="flex items-center gap-1 text-xs bg-[#388e3c] text-white px-1.5 py-0.5 rounded font-bold">
                {p.rating?.toFixed(1)} <Star className="h-3 w-3 fill-white" />
              </span>
            ) : null}
            <span className="text-[11px] text-[#878787]">{p.reviewCount ? `${p.reviewCount} ratings` : "No ratings"}</span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-base text-[#212121]">{formatMoney(p.price, currency)}</span>
                {off > 0 && <span className="text-xs text-[#878787] line-through">{formatMoney(p.compareAtPrice!, currency)}</span>}
                {off > 0 && <span className="text-xs font-bold text-[#388e3c]">{off}% off</span>}
              </div>
              <div className="text-[11px] text-[#878787] flex items-center gap-1 mt-1">
                <Truck className="h-3 w-3" /> Free delivery
              </div>
            </div>
            <button onClick={handleQuickAdd} disabled={pending || out} className="bg-[#fb641b] hover:bg-[#e55a17] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm">
              {out ? "Sold out" : pending ? "…" : "Add"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col bg-white rounded-lg border border-[#f0f0f0] hover:border-[#e0e0e0] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300"
    >
      <div className="relative aspect-[4/5] sm:aspect-square bg-[#f8f9fb] overflow-hidden">
        <Link href={`/products/${p.slug}`} className="block h-full w-full">
          {p.images[0] ? (
            <>
              <img
                src={p.images[0]}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {p.images[1] && (
                <img
                  src={p.images[1]}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                />
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#878787] bg-[#f1f2f4]">No image</div>
          )}
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
          {off > 0 && (
            <span className="bg-[#388e3c] text-white shadow-sm px-2 py-0.5 text-[11px] font-bold rounded-sm">
              {off}% off
            </span>
          )}
          {p.featured && (
            <span className="bg-[#212121] text-white shadow-sm px-1.5 py-0.5 text-[10px] flex items-center gap-1 rounded-sm font-bold">
              <Gem className="h-3 w-3" /> TRENDING
            </span>
          )}
        </div>

        <div className="absolute right-2 top-2 z-10">
          <WishlistButton
            item={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              image: p.images[0],
            }}
            size="sm"
          />
        </div>

        <div
          className={`absolute bottom-2 left-2 right-2 z-10 transition-all duration-300 hidden sm:block ${
            hovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={handleQuickAdd}
            disabled={pending || out}
            className="w-full bg-white/95 backdrop-blur text-[#212121] font-bold text-xs py-2.5 rounded-full shadow-md border border-[#e0e0e0] hover:bg-[#212121] hover:text-white hover:border-[#212121] transition flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {out ? "Out of stock" : pending ? "Adding..." : "Add to cart"}
          </button>
        </div>

        {out && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-[#212121] text-white text-xs font-bold px-3 py-1.5 rounded-full">SOLD OUT</span>
          </div>
        )}
        {lowStock && !out && (
          <div className="absolute bottom-2 left-2 bg-[#fb641b] text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Only {p.stock} left
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <Link href={`/products/${p.slug}`} className="group/link">
          <h3 className="text-[13px] font-medium leading-snug line-clamp-2 min-h-[36px] group-hover/link:text-[#2874f0] text-[#212121]">
            {p.name}
          </h3>
        </Link>

        {p.shortDescription && (
          <p className="mt-1 text-[11px] text-[#878787] line-clamp-1">{p.shortDescription}</p>
        )}

        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {p.reviewCount ? (
            <>
              <span className="inline-flex items-center gap-1 bg-[#388e3c] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
                {p.rating?.toFixed(1)} <Star className="h-3 w-3 fill-white text-white" />
              </span>
              <span className="text-[11px] text-[#878787] font-medium">({p.reviewCount})</span>
            </>
          ) : (
            <span className="text-[11px] text-[#878787]">No ratings yet</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#388e3c]">
            <span className="h-3 w-3 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] flex items-center justify-center text-[8px]">✓</span>
            Genuine
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-[16px] tracking-tight text-[#212121]">{formatMoney(p.price, currency)}</span>
          {off > 0 && (
            <>
              <span className="text-xs text-[#878787] line-through">{formatMoney(p.compareAtPrice!, currency)}</span>
              <span className="text-xs font-bold text-[#388e3c]">{off}% off</span>
            </>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#878787]">
          <Truck className="h-3 w-3" /> Free delivery
          <span className="ml-auto sm:hidden">
            <button
              onClick={handleQuickAdd}
              disabled={pending || out}
              className="h-7 w-7 rounded-full bg-[#fb641b] text-white flex items-center justify-center shadow-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
