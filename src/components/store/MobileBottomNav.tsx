"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Search, Heart, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { useEffect, useState } from "react";

export function MobileBottomNav({ cartCount = 0 }: { cartCount: number }) {
  const pathname = usePathname();
  const { wishlist, openCart, openSearch } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wishlistCount = mounted ? wishlist.length : 0;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around text-[10px] font-medium text-gray-500">
        <Link
          href="/"
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition ${
            pathname === "/" ? "text-primary font-semibold" : "hover:text-gray-900"
          }`}
        >
          <Home className="h-5 w-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link
          href="/categories"
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition ${
            pathname.startsWith("/categories") || pathname.startsWith("/shop")
              ? "text-primary font-semibold"
              : "hover:text-gray-900"
          }`}
        >
          <Grid className="h-5 w-5 mb-0.5" />
          <span>Explore</span>
        </Link>

        <button
          type="button"
          onClick={openSearch}
          className="flex flex-col items-center py-1 px-3 rounded-lg hover:text-gray-900 transition"
        >
          <Search className="h-5 w-5 mb-0.5" />
          <span>Search</span>
        </button>

        <Link
          href="/wishlist"
          className={`relative flex flex-col items-center py-1 px-3 rounded-lg transition ${
            pathname === "/wishlist" ? "text-primary font-semibold" : "hover:text-gray-900"
          }`}
        >
          <div className="relative">
            <Heart className="h-5 w-5 mb-0.5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span>Wishlist</span>
        </Link>

        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-col items-center py-1 px-3 rounded-lg hover:text-gray-900 transition"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-accent text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>
      </div>
    </div>
  );
}
