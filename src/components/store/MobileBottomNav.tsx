"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { useEffect, useState } from "react";

export function MobileBottomNav({ cartCount = 0 }: { cartCount: number }) {
  const pathname = usePathname();
  const { wishlist, openCart, openSearch } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const wishlistCount = mounted ? wishlist.length : 0;

  const items = [
    { href: "/", icon: Home, label: "Home", active: pathname === "/" },
    { href: "/shop", icon: LayoutGrid, label: "Shop", active: pathname.startsWith("/shop") || pathname.startsWith("/categories") },
    { href: "/search", icon: Search, label: "Search", action: openSearch, active: false },
    { href: "/wishlist", icon: Heart, label: "Wishlist", active: pathname === "/wishlist", count: wishlistCount },
    { href: "/cart", icon: ShoppingBag, label: "Cart", action: openCart, active: pathname === "/cart", count: cartCount },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around px-1 py-1">
        {items.map((it) => {
          const Icon = it.icon;
          const content = (
            <div className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[56px] ${it.active ? "text-gray-900" : "text-gray-400"}`}>
              <div className={`relative h-6 w-6 flex items-center justify-center rounded-full transition ${it.active ? "bg-gray-900 text-white" : ""}`}>
                <Icon className="h-5 w-5" />
                {it.count !== undefined && it.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ff6b00] text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-sm">
                    {it.count > 9 ? "9+" : it.count}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${it.active ? "font-bold" : ""}`}>{it.label}</span>
            </div>
          );

          if (it.action) {
            return (
              <button key={it.label} type="button" onClick={it.action} className="flex flex-col items-center">
                {content}
              </button>
            );
          }

          return (
            <Link key={it.label} href={it.href} className="flex flex-col items-center">
              {content}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  );
}
