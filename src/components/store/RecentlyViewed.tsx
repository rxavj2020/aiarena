"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { WishlistButton } from "./WishlistButton";
import { Clock } from "lucide-react";

type ViewedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
};

const STORAGE_KEY = "aurelia_recently_viewed";

export function RecentlyViewed({
  currentProduct,
  currency = "INR",
}: {
  currentProduct?: ViewedProduct;
  currency?: string;
}) {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: ViewedProduct[] = stored ? JSON.parse(stored) : [];

      // If viewing a product right now, record it
      if (currentProduct) {
        list = [
          currentProduct,
          ...list.filter((x) => x.id !== currentProduct.id),
        ].slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }

      // Filter out the currently viewed product from display
      const displayItems = currentProduct
        ? list.filter((x) => x.id !== currentProduct.id)
        : list;

      setItems(displayItems.slice(0, 6));
    } catch {
      // ignore
    }
  }, [currentProduct]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-gray-400" />
        <h2 className="font-display text-xl md:text-2xl font-semibold text-gray-900">
          Recently Viewed
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {items.map((p) => {
          const discount =
            p.compareAtPrice && p.compareAtPrice > p.price
              ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
              : 0;

          return (
            <div
              key={p.id}
              className="card overflow-hidden group hover:shadow-md transition-shadow relative"
            >
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <Link href={`/products/${p.slug}`}>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                      No pic
                    </div>
                  )}
                </Link>

                <div className="absolute top-1.5 right-1.5">
                  <WishlistButton item={p} size="sm" />
                </div>

                {discount > 0 && (
                  <span className="absolute top-1.5 left-1.5 badge bg-accent text-white text-[10px]">
                    -{discount}%
                  </span>
                )}
              </div>

              <div className="p-3">
                <Link href={`/products/${p.slug}`}>
                  <h4 className="text-xs font-medium text-gray-900 line-clamp-1 group-hover:text-primary">
                    {p.name}
                  </h4>
                </Link>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-semibold text-xs text-gray-900">
                    {formatMoney(p.price, currency)}
                  </span>
                  {discount > 0 && (
                    <span className="text-[10px] text-gray-400 line-through">
                      {formatMoney(p.compareAtPrice!, currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
