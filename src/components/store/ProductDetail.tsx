"use client";
import { useState, useMemo } from "react";
import { Gallery } from "./Gallery";
import { AddToCart } from "./AddToCart";
import type { Variant } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { CheckCircle2, Star } from "lucide-react";
import Link from "next/link";

type ProductLike = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  trackStock: boolean;
  options: { name: string; values: string[] }[];
  sku?: string | null;
  category?: { name: string; slug: string } | null;
  shortDescription?: string | null;
  rating: number;
  reviewCount: number;
};

export function ProductDetail({
  product,
  variants,
  currency,
  category,
}: {
  product: ProductLike;
  variants: Variant[];
  currency: string;
  category?: { name: string; slug: string } | null;
}) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const off = useMemo(() => {
    const price = selectedVariant?.price ?? product.price;
    const compare = product.compareAtPrice;
    if (compare && compare > price) return Math.round(((compare - price) / compare) * 100);
    return 0;
  }, [selectedVariant, product.price, product.compareAtPrice]);

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.1fr_0.9fr_360px] gap-6 lg:gap-8">
      {/* Gallery */}
      <div className="lg:sticky lg:top-[88px] h-fit">
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-3 sm:p-4">
          <Gallery images={product.images} name={product.name} variantImage={selectedVariant?.image ?? null} />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
          {category && (
            <Link href={`/shop?category=${category.slug}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#2874f0] bg-[#e8f0fe] px-2.5 py-1 rounded-full mb-3">
              {category.name}
            </Link>
          )}
          <h1 className="font-bold text-[22px] sm:text-[26px] leading-tight text-[#212121] tracking-tight">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-[#e8f5e9] border border-[#c8e6c9] text-[#2e7d32] px-2.5 py-1 rounded-full text-xs font-bold">
                <span className="flex items-center gap-1">
                  {product.rating.toFixed(1)} <Star className="h-3 w-3 fill-[#2e7d32] text-[#2e7d32]" />
                </span>
                <span className="font-medium">· {product.reviewCount} ratings</span>
              </span>
            ) : (
              <span className="text-xs text-[#878787] bg-[#f1f2f4] px-2.5 py-1 rounded-full">No ratings yet</span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${currentStock > 0 ? "bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]" : "bg-red-50 text-red-700 border border-red-100"}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {currentStock > 0 ? "In stock" : "Out of stock"}
            </span>
            {product.sku && <span className="text-xs text-[#878787]">SKU: {product.sku}</span>}
          </div>

          {product.shortDescription && <p className="mt-4 text-sm text-[#212121] leading-relaxed">{product.shortDescription}</p>}
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-[28px] font-bold tracking-tight text-[#212121]">{formatMoney(currentPrice, currency)}</span>
            {off > 0 && (
              <>
                <span className="text-[16px] text-[#878787] line-through">{formatMoney(product.compareAtPrice!, currency)}</span>
                <span className="bg-[#e8f5e9] text-[#2e7d32] font-bold px-2.5 py-1 rounded-full text-xs">{off}% off</span>
              </>
            )}
          </div>
          {selectedVariant && <div className="mt-2 text-xs text-[#2874f0] font-medium">Selected: {selectedVariant.title}</div>}
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
          <AddToCart
            product={{
              id: product.id,
              stock: product.stock,
              trackStock: product.trackStock,
              options: product.options,
              price: product.price,
            }}
            variants={variants}
            currency={currency}
            onVariantChange={setSelectedVariant}
          />
        </div>
      </div>

      {/* Buy box desktop */}
      <div className="hidden xl:block">
        <div className="sticky top-[88px] space-y-4">
          <div className="bg-white rounded-xl border border-[#e0e0e0] shadow-sm p-5">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-[#212121]">{formatMoney(currentPrice, currency)}</span>
              {off > 0 && <span className="text-sm text-[#878787] line-through">{formatMoney(product.compareAtPrice!, currency)}</span>}
            </div>
            <div className={`text-xs font-medium flex items-center gap-1 mb-4 ${currentStock > 0 ? "text-[#388e3c]" : "text-red-600"}`}>
              <CheckCircle2 className="h-4 w-4" /> {currentStock > 0 ? "In Stock · Ready to ship" : "Out of stock"}
            </div>
            <AddToCart
              product={{
                id: product.id,
                stock: product.stock,
                trackStock: product.trackStock,
                options: product.options,
                price: product.price,
              }}
              variants={variants}
              currency={currency}
              compact
              onVariantChange={setSelectedVariant}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
