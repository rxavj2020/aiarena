"use client";

import { useStore } from "@/lib/store/useStore";
import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function WishlistView({ currency = "INR" }: { currency: string }) {
  const { wishlist, removeFromWishlist, openCart } = useStore();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleMoveToCart = (item: { id: string; name: string }) => {
    setPendingId(item.id);
    const fd = new FormData();
    fd.set("productId", item.id);
    fd.set("qty", "1");

    startTransition(async () => {
      const res = await addToCart(fd);
      setPendingId(null);
      if (res && res.ok) {
        removeFromWishlist(item.id);
        router.refresh();
        openCart();
      }
    });
  };

  if (wishlist.length === 0) {
    return (
      <div className="container-x py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-gray-900">
          Your wishlist is empty
        </h1>
        <p className="text-gray-500 text-sm mt-2 mb-6">
          Save your favourite items here so you don’t lose track of the things you love.
        </p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">My Wishlist</h1>
          <p className="text-gray-500 text-sm mt-1">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        <Link href="/shop" className="btn-outline text-xs">
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {wishlist.map((item) => {
          const discount =
            item.compareAtPrice && item.compareAtPrice > item.price
              ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
              : 0;

          return (
            <div
              key={item.id}
              className="card overflow-hidden group flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <Link href={`/products/${item.slug}`}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    aria-label="Remove from wishlist"
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow text-gray-500 hover:text-rose-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 badge bg-accent text-white">
                      -{discount}%
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <Link href={`/products/${item.slug}`}>
                    <h3 className="font-medium text-sm text-gray-900 group-hover:text-primary line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="font-semibold text-sm">
                      {formatMoney(item.price, currency)}
                    </span>
                    {discount > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatMoney(item.compareAtPrice!, currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => handleMoveToCart(item)}
                  className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {pendingId === item.id ? "Moving..." : "Move to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
