import Link from "next/link";
import { ShoppingBag, User, Search, Menu } from "lucide-react";
import type { StoreSettings } from "@/lib/settings";
import type { SessionUser } from "@/lib/auth";
import type { Category } from "@/lib/db/schema";
import { MobileNav } from "./MobileNav";

export function Header({ settings: s, cartCount, user, categories }: { settings: StoreSettings; cartCount: number; user: SessionUser | null; categories: Category[] }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      {s.announcementEnabled && s.announcement ? (
        <div className="bg-primary text-white text-center text-xs py-2 px-4 tracking-wide">{s.announcement}</div>
      ) : null}
      <div className="container-x flex h-16 items-center gap-4">
        <MobileNav nav={s.nav} categories={categories}>
          <Menu className="h-5 w-5" />
        </MobileNav>
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {s.logoUrl ? <img src={s.logoUrl} alt={s.storeName} className="h-8 w-auto" /> : <span className="font-display text-2xl font-semibold tracking-tight">{s.storeName}</span>}
        </Link>
        <nav className="hidden md:flex items-center gap-6 ml-8 text-sm font-medium text-gray-700">
          {s.nav.map((n) => (
            <Link key={n.href + n.label} href={n.href} className="hover:text-black transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>
        <form action="/shop" className="ml-auto hidden sm:flex items-center relative w-full max-w-xs">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <input name="q" placeholder="Search products…" className="input pl-9 py-2 rounded-full bg-gray-50" />
        </form>
        <div className="flex items-center gap-1 ml-auto sm:ml-0">
          <Link href="/shop" className="sm:hidden btn-ghost p-2" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
          <Link href={user ? "/account" : "/login"} className="btn-ghost p-2" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="btn-ghost p-2 relative" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
