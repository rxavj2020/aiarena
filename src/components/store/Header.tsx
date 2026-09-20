"use client";

import Link from "next/link";
import { ShoppingBag, User, Heart, Menu } from "lucide-react";
import type { StoreSettings } from "@/lib/settings";
import type { SessionUser } from "@/lib/auth";
import type { Category } from "@/lib/db/schema";
import { MobileNav } from "./MobileNav";
import { LiveSearch } from "./LiveSearch";
import { useStore } from "@/lib/store/useStore";
import { useEffect, useState } from "react";

export function Header({
  settings: s,
  cartCount,
  user,
  categories,
}: {
  settings: StoreSettings;
  cartCount: number;
  user: SessionUser | null;
  categories: Category[];
}) {
  const { wishlist, openCart } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wishlistCount = mounted ? wishlist.length : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-xs">
      {s.announcementEnabled && s.announcement ? (
        <div className="bg-primary text-white text-center text-xs py-2 px-4 tracking-wide font-medium">
          {s.announcement}
        </div>
      ) : null}
      <div className="container-x flex h-16 items-center gap-4">
        <MobileNav nav={s.nav} categories={categories}>
          <Menu className="h-5 w-5" />
        </MobileNav>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          {s.logoUrl ? (
            <img src={s.logoUrl} alt={s.storeName} className="h-8 w-auto" />
          ) : (
            <span className="font-display text-2xl font-semibold tracking-tight">
              {s.storeName}
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-6 text-sm font-medium text-gray-700">
          {s.nav.map((n) => (
            <Link key={n.href + n.label} href={n.href} className="hover:text-black transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Predictive Live Search Bar */}
        <div className="hidden sm:flex items-center ml-auto w-full max-w-sm">
          <LiveSearch currency={s.currency} />
        </div>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {/* Wishlist Link with Live Count */}
          <Link
            href="/wishlist"
            className="btn-ghost p-2 relative"
            aria-label="Wishlist"
            title="My Wishlist"
          >
            <Heart className="h-5 w-5 text-gray-700 hover:text-rose-600 transition" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link
            href={user ? "/account" : "/login"}
            className="btn-ghost p-2"
            aria-label="Account"
            title={user ? user.name : "Sign In"}
          >
            <User className="h-5 w-5" />
          </Link>

          {/* Cart Icon (opens CartDrawer with 1 click) */}
          <button
            type="button"
            onClick={openCart}
            className="btn-ghost p-2 relative"
            aria-label="Cart"
            title="Shopping Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
