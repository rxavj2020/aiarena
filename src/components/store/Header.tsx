"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  User,
  Heart,
  Menu,
  MapPin,
  ChevronDown,
  Package,
  LayoutGrid,
  X,
  Truck,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import type { StoreSettings } from "@/lib/settings";
import type { SessionUser } from "@/lib/auth";
import type { Category } from "@/lib/db/schema";
import { LiveSearch } from "./LiveSearch";
import { PincodeModal } from "./PincodeModal";
import { useStore } from "@/lib/store/useStore";
import { usePathname } from "next/navigation";

export function Header({
  settings: s,
  cartCount,
  user,
  categories,
  homeHref = "/",
}: {
  settings: StoreSettings;
  cartCount: number;
  user: SessionUser | null;
  categories: Category[];
  /** This website's home — never the platform root. */
  homeHref?: string;
}) {
  const { wishlist, openCart, savedPincode } = useStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pincodeOpen, setPincodeOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  const wishlistCount = mounted ? wishlist.length : 0;

  const topCats = categories.filter((c) => !c.parentId).slice(0, 10);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#e0e0e0]">
        {s.announcementEnabled && s.announcement ? (
          <div className="bg-[#2874f0] text-white text-center text-[11px] sm:text-xs py-1.5 px-4 tracking-wide font-medium flex items-center justify-center gap-2">
            <span className="hidden sm:inline">✨</span>
            <span className="truncate">{s.announcement}</span>
            <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-white/80">
              <Truck className="h-3 w-3" /> Free shipping over ₹999
            </span>
          </div>
        ) : null}

        <div className="container-x">
          <div className="flex h-[60px] sm:h-[68px] items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-full hover:bg-[#f1f2f4]"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5 text-[#212121]" />
              </button>

              <Link href={homeHref} className="flex items-center gap-2.5">
                {s.logoUrl ? (
                  <img src={s.logoUrl} alt={s.storeName} className="h-8 sm:h-9 w-auto object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-[#2874f0] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {s.storeName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-display text-[22px] font-bold tracking-tight hidden sm:block text-[#212121]">
                      {s.storeName}
                    </span>
                    <span className="font-display text-[18px] font-bold tracking-tight sm:hidden text-[#212121]">
                      {s.storeName.slice(0, 12)}
                    </span>
                  </div>
                )}
              </Link>

              {/* Deliver to - now functional with modal */}
              <button
                onClick={() => setPincodeOpen(true)}
                className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-[#e0e0e0] text-left hover:opacity-80 transition"
              >
                <div className="h-8 w-8 rounded-full bg-[#f1f2f4] flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-[#212121]" />
                </div>
                <div className="text-xs leading-tight">
                  <div className="text-[#878787] text-[11px]">Deliver to</div>
                  <div className="font-semibold text-[#212121] flex items-center gap-1 text-[13px]">
                    {mounted && savedPincode ? savedPincode : "Select location"} <ChevronDown className="h-3 w-3 text-[#878787]" />
                  </div>
                </div>
              </button>
            </div>

            <div className="hidden md:flex flex-1 max-w-[720px] mx-4 lg:mx-8">
              <LiveSearch currency={s.currency} />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <Link
                href="/categories"
                className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-full hover:bg-[#f1f2f4] text-sm font-medium text-[#212121]"
              >
                <LayoutGrid className="h-4 w-4" />
                Categories
              </Link>

              <Link
                href="/wishlist"
                className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-full hover:bg-[#f1f2f4] transition"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart className="h-5 w-5 text-[#212121]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#fb641b] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block text-sm font-medium text-[#212121]">Wishlist</span>
              </Link>

              <div className="relative">
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  onBlur={() => setTimeout(() => setAccountOpen(false), 200)}
                  className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-full hover:bg-[#f1f2f4] transition"
                >
                  <User className="h-5 w-5 text-[#212121]" />
                  <div className="hidden lg:block text-left leading-tight">
                    <div className="text-[11px] text-[#878787]">
                      {user ? `Hi, ${user.name.split(" ")[0]}` : "Hello, sign in"}
                    </div>
                    <div className="text-sm font-semibold flex items-center gap-1 text-[#212121]">
                      Account <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#e0e0e0] overflow-hidden z-50 animate-scale-in">
                    {user ? (
                      <>
                        <div className="p-4 bg-[#f8f9fb] border-b border-[#f0f0f0]">
                          <div className="font-semibold text-sm text-[#212121]">{user.name}</div>
                          <div className="text-xs text-[#878787] truncate">{user.email}</div>
                        </div>
                        <div className="p-2">
                          {user.role === "admin" && (
                            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-[#2874f0] hover:bg-blue-100 text-sm font-semibold mb-1">
                              <LayoutDashboard className="h-4 w-4" /> Store Dashboard
                            </Link>
                          )}
                          <Link href="/account" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f1f2f4] text-sm text-[#212121]">
                            <User className="h-4 w-4" /> My Account
                          </Link>
                          <Link href="/account/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f1f2f4] text-sm text-[#212121]">
                            <Package className="h-4 w-4" /> My Orders
                          </Link>
                          <Link href="/account/addresses" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f1f2f4] text-sm text-[#212121]">
                            <MapPin className="h-4 w-4" /> Saved Addresses
                          </Link>
                          <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f1f2f4] text-sm text-[#212121]">
                            <Heart className="h-4 w-4" /> Wishlist ({wishlistCount})
                          </Link>
                          <button onClick={() => setPincodeOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f1f2f4] text-sm text-[#212121] text-left">
                            <MapPin className="h-4 w-4" /> Delivery: {savedPincode || "Not set"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4">
                        <Link href="/login" className="bg-[#2874f0] text-white w-full justify-center flex py-2.5 rounded-full font-bold text-sm hover:bg-[#1f5fd1]">
                          Sign in
                        </Link>
                        <div className="text-center text-xs text-[#878787] mt-3">
                          New customer?{" "}
                          <Link href="/register" className="text-[#2874f0] font-semibold hover:underline">
                            Start here
                          </Link>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#f0f0f0] grid grid-cols-2 gap-2 text-xs">
                          <Link href="/account/orders" className="px-3 py-2 rounded-lg bg-[#f1f2f4] hover:bg-[#e8f0fe] text-[#212121] text-center">
                            Track order
                          </Link>
                          <Link href="/contact" className="px-3 py-2 rounded-lg bg-[#f1f2f4] hover:bg-[#e8f0fe] text-[#212121] text-center">
                            Help center
                          </Link>
                        </div>
                        <button onClick={() => setPincodeOpen(true)} className="mt-3 w-full px-3 py-2 rounded-lg bg-[#f8f9fb] border text-xs text-[#212121] text-center hover:bg-[#f1f2f4]">
                          <MapPin className="h-3 w-3 inline mr-1" /> Set delivery pincode: {savedPincode || "Not set"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={openCart}
                className="relative flex items-center gap-2 bg-[#2874f0] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-[#1f5fd1] transition font-medium shadow-sm"
              >
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#fb641b] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center lg:hidden">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:flex items-center gap-2 text-sm">
                  Cart
                  {cartCount > 0 && (
                    <span className="bg-white text-[#2874f0] text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
                <span className="lg:hidden text-sm font-bold">{cartCount > 0 ? cartCount : ""}</span>
              </button>
            </div>
          </div>

          <div className="md:hidden pb-3 space-y-2">
            <LiveSearch currency={s.currency} isMobileModal={false} />
            <button onClick={() => setPincodeOpen(true)} className="flex items-center gap-1.5 text-xs text-[#212121] bg-[#f1f2f4] px-3 py-1.5 rounded-full w-fit">
              <MapPin className="h-3.5 w-3.5" /> Deliver to {mounted && savedPincode ? <b>{savedPincode}</b> : "Select location"} <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="hidden lg:block border-t border-[#e0e0e0] bg-white">
          <div className="container-x">
            <div className="flex items-center gap-1 h-10 overflow-x-auto no-scrollbar text-[13px]">
              <Link
                href="/shop"
                className={`shrink-0 px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                  pathname === "/shop" ? "bg-[#2874f0] text-white" : "hover:bg-[#f1f2f4] text-[#212121]"
                }`}
              >
                All Products
              </Link>
              {topCats.map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.slug}`}
                  className={`shrink-0 px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                    pathname.includes(c.slug) ? "bg-[#e8f0fe] border border-[#c2d6ff] text-[#2874f0]" : "hover:bg-[#f1f2f4] text-[#212121]"
                  }`}
                >
                  {c.image && <img src={c.image} alt="" className="h-4 w-4 rounded-full object-cover" />}
                  {c.name}
                </Link>
              ))}
              <div className="ml-auto hidden xl:flex items-center gap-4 pl-4 border-l border-[#e0e0e0] shrink-0 text-xs text-[#878787]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#388e3c]" /> 100% Genuine
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-[#2874f0]" /> Free Delivery ₹999+
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <PincodeModal open={pincodeOpen} onClose={() => setPincodeOpen(false)} />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[360px] bg-white shadow-2xl flex flex-col animate-slide-left">
            <div className="bg-[#2874f0] text-white p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{user ? `Hello, ${user.name.split(" ")[0]}` : "Hello, sign in"}</div>
                <div className="text-xs text-white/70">{user?.email ?? "Welcome to Aurelia"}</div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#f0f0f0] bg-[#f8f9fb]">
              <button onClick={() => { setMobileMenuOpen(false); setPincodeOpen(true); }} className="flex items-center gap-2 text-sm text-[#212121] w-full text-left">
                <MapPin className="h-4 w-4" />
                <span>Deliver to <b>{mounted && savedPincode ? savedPincode : "Select location"}</b></span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#878787] mb-3 px-2">Shop by Category</div>
                  <div className="space-y-1">
                    <Link
                      href="/shop"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[#f1f2f4] font-medium text-[#212121]"
                    >
                      All Products
                      <span className="text-xs bg-[#e8f0fe] text-[#2874f0] px-2 py-1 rounded-full font-bold">New</span>
                    </Link>
                    {categories
                      .filter((c) => !c.parentId)
                      .map((c) => (
                        <Link
                          key={c.id}
                          href={`/shop?category=${c.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#f1f2f4] text-[#212121]"
                        >
                          {c.image ? (
                            <img src={c.image} alt="" className="h-8 w-8 rounded-full object-cover border border-[#e0e0e0]" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-[#f1f2f4] flex items-center justify-center text-xs font-bold">
                              {c.name[0]}
                            </div>
                          )}
                          <span className="font-medium text-sm">{c.name}</span>
                        </Link>
                      ))}
                  </div>
                </div>

                <div className="border-t border-[#f0f0f0] pt-6">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#878787] mb-3 px-2">Help & Settings</div>
                  <div className="space-y-1">
                    {user?.role === "admin" && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-[#2874f0] font-semibold text-sm mb-1"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Store Dashboard
                      </Link>
                    )}
                    {s.nav.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2.5 rounded-xl hover:bg-[#f1f2f4] text-sm text-[#212121]"
                      >
                        {n.label}
                      </Link>
                    ))}
                    <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-[#f1f2f4] text-sm text-[#212121]">
                      My Account
                    </Link>
                    <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-[#f1f2f4] text-sm text-[#212121]">
                      Track Orders
                    </Link>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-[#f1f2f4] text-sm text-[#212121]">
                      Customer Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#f0f0f0] bg-[#f8f9fb]">
              <div className="flex items-center gap-2 text-xs text-[#878787]">
                <ShieldCheck className="h-4 w-4 text-[#388e3c]" /> 100% Genuine · Secure Shopping
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
