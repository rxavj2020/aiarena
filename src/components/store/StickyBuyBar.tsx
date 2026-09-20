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
      // Show when user has scrolled down > 400px
      if (window.scrollY > 420) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  const isSoldOut = product.trackStock && product.stock <= 0;

  const handleAction = (buyNow: boolean) => {
    if (product.hasOptions) {
      // If product has options, scroll up to options selector smoothly
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
    <div className="md:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-2.5 shadow-xl fade-up">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">{product.name}</div>
          <div className="font-semibold text-xs text-gray-900 mt-0.5">
            {formatMoney(product.price, currency)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending || isSoldOut}
            onClick={() => handleAction(false)}
            className="btn-outline text-xs px-3 py-2 shrink-0 flex items-center gap-1 border-gray-900 text-gray-900"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Add</span>
          </button>
          <button
            type="button"
            disabled={pending || isSoldOut}
            onClick={() => handleAction(true)}
            className="btn-accent text-xs px-3.5 py-2 shrink-0 flex items-center gap-1 font-semibold"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
