"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Ticket,
  Users,
  Star,
  FileText,
  Palette,
  Settings,
  Plug,
  Mail,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { adminLogout } from "@/actions/admin";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; mobile?: boolean };
type NavSection = { section: string };
type NavEntry = NavItem | NavSection;

const nav: NavEntry[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, mobile: true },
  { href: "/admin/products", label: "Products", icon: Package, mobile: true },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/customers", label: "Customers", icon: Users, mobile: true },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { section: "Website" },
  { href: "/admin/content", label: "Content", icon: Palette },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { section: "Integrations" },
  { href: "/admin/plugins", label: "Plugins", icon: Plug },
  { href: "/admin/mail-log", label: "Mail log", icon: Mail },
];

export function Sidebar({ storeName, publicHref, pendingOrders, pendingReviews, tenantWorkspace = false }: { storeName: string; publicHref: string; pendingOrders: number; pendingReviews: number; tenantWorkspace?: boolean }) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNav = tenantWorkspace ? nav.filter((item) => "href" in item && ["/admin", "/admin/products"].includes(item.href)) : nav;

  const NavContent = () => (
    <>
      <div className="px-5 py-5 border-b border-white/10 hidden lg:block">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white text-gray-900 flex items-center justify-center font-bold">{storeName[0]?.toUpperCase()}</div>
          <div>
            <div className="text-white font-bold text-sm leading-tight truncate max-w-[140px]">{storeName}</div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wider">Admin console</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/admin/products/new" className="flex-1 bg-white text-gray-900 text-xs font-bold px-3 py-2 rounded-full flex items-center justify-center gap-1 hover:bg-gray-100">
            <Plus className="h-3.5 w-3.5" /> New product
          </Link>
          <a href={publicHref} target="_blank" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <ExternalLink className="h-4 w-4 text-white" />
          </a>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 text-sm">
        {visibleNav.map((n, i) =>
          "section" in n ? (
            <div key={i} className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hidden lg:block">
              {n.section}
            </div>
          ) : (
            <Link
              key={n.href}
              href={n.href!}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/5 hover:text-white transition ${n.href === "/admin" ? (path === "/admin" ? "bg-white text-gray-900 font-semibold shadow-sm" : "text-gray-400") : path.startsWith(n.href!) ? "bg-white/10 text-white font-medium" : "text-gray-400"}`}
            >
              <n.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{n.label}</span>
              {n.href === "/admin/orders" && pendingOrders > 0 && <span className="ml-auto bg-[#ff6b00] text-white text-[11px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">{pendingOrders}</span>}
              {n.href === "/admin/reviews" && pendingReviews > 0 && <span className="ml-auto bg-white/20 text-white text-[11px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">{pendingReviews}</span>}
            </Link>
          )
        )}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-0.5 text-sm hidden lg:block">
        <Link href="/platform" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/5 hover:text-white text-gray-400">
          <LayoutDashboard className="h-4 w-4" />
          Workspace setup
        </Link>
        <a href={publicHref} target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/5 hover:text-white text-gray-400">
          <ExternalLink className="h-4 w-4" />
          View public site
        </a>
        <form action={adminLogout}>
          <button className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/5 hover:text-white text-gray-400">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
        <div className="pt-3 text-[11px] text-gray-500 px-3">v2.0 · Mobile app ready</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar hidden lg:flex w-[280px] shrink-0 bg-gray-950 text-gray-300 flex-col h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950 text-white border-b border-white/10">
        <div className="flex items-center gap-3 px-4 h-[56px]">
          <button onClick={() => setMobileOpen(true)} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white text-gray-900 flex items-center justify-center font-bold text-sm">{storeName[0]}</div>
            <div>
              <div className="font-bold text-sm leading-tight">{storeName}</div>
              <div className="text-[11px] text-white/60">Admin</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/products/new" className="h-9 w-9 rounded-full bg-white text-gray-900 flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </Link>
            <a href={publicHref} target="_blank" className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-[320px] bg-gray-950 flex flex-col shadow-2xl animate-slide-left">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white text-gray-900 flex items-center justify-center font-bold">{storeName[0]}</div>
                <span className="font-bold text-white">{storeName}</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col">
              <NavContent />
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav - like mobile app */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-1.5">
          {visibleNav
            .filter((n): n is NavItem => !("section" in n) && !!(n as NavItem).mobile)
            .slice(0, 5)
            .map((n) => {
              const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${active ? "text-gray-900" : "text-gray-400"}`}>
                  <div className={`relative h-6 w-6 flex items-center justify-center rounded-full ${active ? "bg-gray-900 text-white" : ""}`}>
                    <n.icon className="h-5 w-5" />
                    {n.href === "/admin/orders" && pendingOrders > 0 && <span className="absolute -top-1 -right-1 bg-[#ff6b00] text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{pendingOrders}</span>}
                  </div>
                  <span className="text-[10px] font-medium">{n.label}</span>
                </Link>
              );
            })}
        </div>
      </div>
    </>
  );
}
