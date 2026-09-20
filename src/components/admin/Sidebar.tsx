"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Tags, Ticket, Users, Star, FileText, Palette, Settings, Plug, Mail, ExternalLink, LogOut } from "lucide-react";
import { adminLogout } from "@/actions/admin";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { section: "Website" },
  { href: "/admin/content", label: "Content & Design", icon: Palette },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
  { section: "Integrations" },
  { href: "/admin/plugins", label: "Plugins", icon: Plug },
  { href: "/admin/mail-log", label: "Mail log", icon: Mail },
];

export function Sidebar({ storeName, pendingOrders, pendingReviews }: { storeName: string; pendingOrders: number; pendingReviews: number }) {
  const path = usePathname();
  return (
    <aside className="admin-sidebar w-60 shrink-0 bg-gray-950 text-gray-300 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/10"><div className="text-white font-semibold truncate">{storeName}</div><div className="text-[11px] text-gray-500 uppercase tracking-wider">Admin console</div></div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 text-sm">
        {nav.map((n, i) =>
          "section" in n ? (
            <div key={i} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{n.section}</div>
          ) : (
            <Link key={n.href} href={n.href!} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white ${(n.href === "/admin" ? path === "/admin" : path.startsWith(n.href!)) ? "active" : ""}`}>
              <n.icon className="h-4 w-4" />{n.label}
              {n.href === "/admin/orders" && pendingOrders > 0 && <span className="ml-auto badge bg-accent text-white">{pendingOrders}</span>}
              {n.href === "/admin/reviews" && pendingReviews > 0 && <span className="ml-auto badge bg-white/20 text-white">{pendingReviews}</span>}
            </Link>
          )
        )}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-0.5 text-sm">
        <a href="/" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" />View store</a>
        <form action={adminLogout}><button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />Log out</button></form>
      </div>
    </aside>
  );
}
