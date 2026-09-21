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
      <div className="bg-[#f8f9fb] min-h-[70vh]">
        <div className="container-x py-12 sm:py-20">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-5">
              <Heart className="h-10 w-10 text-rose-400" />
            </div>
            <h1 className="font-display text-2xl font-bold">Your wishlist is empty</h1>
            <p className="text-sm text-gray-500 mt-2">Save your favourites here. We&apos;ll keep them safe until you&apos;re ready.</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/shop" className="btn-primary rounded-full py-3">
                Explore products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="btn-ghost text-sm">Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] min-h-screen">
      <div className="container-x py-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center">
              <Heart className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">My Wishlist</h1>
              <p className="text-xs text-gray-500">{wishlist.length} items saved · Private to you</p>
            </div>
          </div>
          <Link href="/shop" className="btn-outline btn-sm rounded-full bg-white hidden sm:flex">
            Continue shopping
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((item) => {
            const discount = item.compareAtPrice && item.compareAtPrice > item.price ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100) : 0;
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all flex flex-col">
                <div className="relative aspect-square bg-[#f8f9fb] overflow-hidden">
                  <Link href={`/products/${item.slug}`}>
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="h-full w-full flex items-center justify-center text-gray-400">No image</div>}
                  </Link>
                  <button onClick={() => removeFromWishlist(item.id)} className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow border flex items-center justify-center text-gray-500 hover:text-rose-600 hover:bg-white transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {discount > 0 && <span className="absolute left-2.5 top-2.5 bg-[#ff3b30] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">-{discount}%</span>}
                </div>
                <div className="p-3.5 flex-1 flex flex-col">
                  <Link href={`/products/${item.slug}`} className="font-medium text-[13px] line-clamp-2 leading-snug hover:text-gray-900">{item.name}</Link>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-bold text-sm">{formatMoney(item.price, currency)}</span>
                    {discount > 0 && <span className="text-xs text-gray-400 line-through">{formatMoney(item.compareAtPrice!, currency)}</span>}
                  </div>
                  <div className="mt-auto pt-3 flex gap-2">
                    <button disabled={pendingId === item.id} onClick={() => handleMoveToCart(item)} className="flex-1 bg-gray-900 text-white rounded-full py-2 text-xs font-bold flex items-center justify-center gap-1 hover:bg-black transition">
                      <ShoppingBag className="h-3.5 w-3.5" /> {pendingId === item.id ? "..." : "Move to cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
