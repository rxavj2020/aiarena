"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  User,
  Heart,
  Menu,
  MapPin,
  Search,
  ChevronDown,
  Package,
  LogOut,
  LayoutGrid,
  X,
  Truck,
  ShieldCheck,
} from "lucide-react";
import type { StoreSettings } from "@/lib/settings";
import type { SessionUser } from "@/lib/auth";
import type { Category } from "@/lib/db/schema";
import { LiveSearch } from "./LiveSearch";
import { useStore } from "@/lib/store/useStore";
import { usePathname } from "next/navigation";

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
  const { wishlist, openCart, savedPincode } = useStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  const wishlistCount = mounted ? wishlist.length : 0;

  const topCats = categories.filter((c) => !c.parentId).slice(0, 10);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80">
        {/* Announcement - Flipkart yellow or dark */}
        {s.announcementEnabled && s.announcement ? (
          <div className="bg-gray-900 text-white text-center text-[11px] sm:text-xs py-1.5 px-4 tracking-wide font-medium flex items-center justify-center gap-2">
            <span className="hidden sm:inline">🎉</span>
            <span className="truncate">{s.announcement}</span>
            <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-white/70">
              <Truck className="h-3 w-3" /> Free shipping over ₹500
            </span>
          </div>
        ) : null}

        {/* Main header row - Amazon/Flipkart style */}
        <div className="container-x">
          <div className="flex h-[60px] sm:h-[68px] items-center gap-3 sm:gap-6">
            {/* Logo + Hamburger */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/" className="flex items-center gap-2.5">
                {s.logoUrl ? (
                  <img src={s.logoUrl} alt={s.storeName} className="h-8 sm:h-9 w-auto object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-display font-bold text-lg">
                      {s.storeName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-display text-[22px] font-bold tracking-tight hidden sm:block">
                      {s.storeName}
                    </span>
                    <span className="font-display text-[18px] font-bold tracking-tight sm:hidden">
                      {s.storeName.slice(0, 10)}
                    </span>
                  </div>
                )}
              </Link>

              {/* Delivery pincode - Amazon style - desktop only */}
              <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-gray-200">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div className="text-xs leading-tight">
                  <div className="text-gray-500">Deliver to</div>
                  <div className="font-semibold text-gray-900 flex items-center gap-1">
                    {mounted && savedPincode ? savedPincode : "Select location"} <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search - center expanded like Flipkart */}
            <div className="hidden md:flex flex-1 max-w-[720px] mx-4 lg:mx-8">
              <LiveSearch currency={s.currency} />
            </div>

            {/* Right actions - Amazon style */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {/* Categories quick - desktop */}
              <Link
                href="/categories"
                className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 text-sm font-medium"
              >
                <LayoutGrid className="h-4 w-4" />
                Categories
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-gray-100 transition"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart className="h-5 w-5 text-gray-800" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block text-sm font-medium">Wishlist</span>
              </Link>

              {/* Account - with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  onBlur={() => setTimeout(() => setAccountOpen(false), 200)}
                  className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <User className="h-5 w-5 text-gray-800" />
                  <div className="hidden lg:block text-left leading-tight">
                    <div className="text-[11px] text-gray-500">
                      {user ? `Hi, ${user.name.split(" ")[0]}` : "Hello, sign in"}
                    </div>
                    <div className="text-sm font-semibold flex items-center gap-1">
                      Account <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
                    {user ? (
                      <>
                        <div className="p-4 bg-gray-50 border-b">
                          <div className="font-semibold text-sm">{user.name}</div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                        <div className="p-2">
                          <Link href="/account" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm">
                            <User className="h-4 w-4" /> My Account
                          </Link>
                          <Link href="/account/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm">
                            <Package className="h-4 w-4" /> My Orders
                          </Link>
                          <Link href="/account/addresses" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm">
                            <MapPin className="h-4 w-4" /> Saved Addresses
                          </Link>
                          <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm">
                            <Heart className="h-4 w-4" /> Wishlist ({wishlistCount})
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="p-4">
                        <Link href="/login" className="btn-primary w-full justify-center">
                          Sign in
                        </Link>
                        <div className="text-center text-xs text-gray-500 mt-3">
                          New customer?{" "}
                          <Link href="/register" className="text-gray-900 font-semibold hover:underline">
                            Start here
                          </Link>
                        </div>
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
                          <Link href="/account/orders" className="px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                            Track order
                          </Link>
                          <Link href="/contact" className="px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                            Help center
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart - Amazon style */}
              <button
                type="button"
                onClick={openCart}
                className="relative flex items-center gap-2 bg-gray-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full sm:rounded-xl hover:bg-black transition font-medium shadow-sm"
              >
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#ff6b00] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center lg:hidden">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:flex items-center gap-2 text-sm">
                  Cart
                  {cartCount > 0 && (
                    <span className="bg-white/20 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
                <span className="lg:hidden text-sm font-bold">{cartCount > 0 ? cartCount : ""}</span>
              </button>
            </div>
          </div>

          {/* Mobile search bar - Flipkart style full width below */}
          <div className="md:hidden pb-3">
            <LiveSearch currency={s.currency} isMobileModal={false} />
          </div>
        </div>

        {/* Category nav bar - Amazon/Flipkart second row */}
        <div className="hidden lg:block border-t border-gray-100 bg-[#f8f9fb]">
          <div className="container-x">
            <div className="flex items-center gap-1 h-10 overflow-x-auto no-scrollbar text-[13px]">
              <Link
                href="/shop"
                className={`shrink-0 px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                  pathname === "/shop" ? "bg-gray-900 text-white" : "hover:bg-white text-gray-700 hover:text-gray-900"
                }`}
              >
                All Products
              </Link>
              {topCats.map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.slug}`}
                  className={`shrink-0 px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                    pathname.includes(c.slug) ? "bg-white shadow-sm border border-gray-200 text-gray-900" : "hover:bg-white text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {c.image && <img src={c.image} alt="" className="h-4 w-4 rounded-full object-cover" />}
                  {c.name}
                </Link>
              ))}
              <div className="ml-auto hidden xl:flex items-center gap-4 pl-4 border-l border-gray-200 shrink-0 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100% Genuine
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Free Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer - Amazon app style */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[360px] bg-white shadow-2xl flex flex-col animate-slide-left">
            {/* Drawer header */}
            <div className="bg-gray-900 text-white p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{user ? `Hello, ${user.name.split(" ")[0]}` : "Hello, sign in"}</div>
                <div className="text-xs text-white/70">{user?.email ?? "Welcome to store"}</div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-2">Shop by Category</div>
                  <div className="space-y-1">
                    <Link
                      href="/shop"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 font-medium"
                    >
                      All Products
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">New</span>
                    </Link>
                    {categories
                      .filter((c) => !c.parentId)
                      .map((c) => (
                        <Link
                          key={c.id}
                          href={`/shop?category=${c.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100"
                        >
                          {c.image ? (
                            <img src={c.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold">
                              {c.name[0]}
                            </div>
                          )}
                          <span className="font-medium text-sm">{c.name}</span>
                        </Link>
                      ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-2">Help & Settings</div>
                  <div className="space-y-1">
                    {s.nav.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm"
                      >
                        {n.label}
                      </Link>
                    ))}
                    <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm">
                      My Account
                    </Link>
                    <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm">
                      Track Orders
                    </Link>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm">
                      Customer Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4" /> 100% Secure · Trusted by thousands
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
