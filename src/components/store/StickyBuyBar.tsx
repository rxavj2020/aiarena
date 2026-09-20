"use client";

import { useEffect, useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";
import { ShoppingBag, Zap } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { useStore } from "@/lib/store/useStore";
import { useRouter } from "next/navigation";

export function StickyBuyBar({
  product,
  currency,
}: {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    stock: number;
    trackStock: boolean;
    hasOptions: boolean;
  };
  currency: string;
}) {
  const [visible, setVisible] = useState(false);
  const [pending, startTransition] = useTransition();
  const { openCart, addToast } = useStore();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  const isSoldOut = product.trackStock && product.stock <= 0;

  const handleAction = (buyNow: boolean) => {
    if (product.hasOptions) {
      window.scrollTo({ top: 200, behavior: "smooth" });
      addToast("Please choose your options", "info");
      return;
    }
    const fd = new FormData();
    fd.set("productId", product.id);
    fd.set("qty", "1");
    if (buyNow) fd.set("buyNow", "1");
    startTransition(async () => {
      const res = await addToCart(fd);
      if (res && res.ok) {
        router.refresh();
        if (!buyNow) {
          openCart();
          addToast("Added to cart", "success");
        }
      }
    });
  };

  return (
    <div className="xl:hidden fixed bottom-[68px] md:bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
      <div className="container-x px-3 sm:px-4 py-2.5 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-[#f8f9fb] overflow-hidden border shrink-0 hidden sm:block">
          {product.images[0] && <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0 hidden sm:block">
          <div className="text-xs font-bold truncate">{product.name}</div>
          <div className="font-bold text-sm">{formatMoney(product.price, currency)}</div>
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <button disabled={pending || isSoldOut} onClick={() => handleAction(false)} className="flex-1 sm:flex-none bg-white border border-gray-900 text-gray-900 font-bold text-sm px-4 py-3 rounded-full flex items-center justify-center gap-1.5 hover:bg-gray-50 transition">
            <ShoppingBag className="h-4 w-4" /> Add to cart
          </button>
          <button disabled={pending || isSoldOut} onClick={() => handleAction(true)} className="flex-1 sm:flex-none bg-[#ff6b00] text-white font-bold text-sm px-5 py-3 rounded-full flex items-center justify-center gap-1.5 hover:bg-[#e65f00] transition shadow-sm">
            <Zap className="h-4 w-4 fill-white" /> Buy now
          </button>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white md:hidden" />
    </div>
  );
}
