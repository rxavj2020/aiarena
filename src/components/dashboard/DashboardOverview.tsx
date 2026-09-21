import Link from "next/link";
import { ArrowRight, ExternalLink, Package, Plug, Plus, Rocket, Settings, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Tenant } from "@/lib/db/schema";

export type DashboardStats = {
  revenue: number;
  orderCount: number;
  productCount: number;
  lowStockCount: number;
  pendingOrders: number;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  shippingAddress?: { name?: string; city?: string; state?: string } | null;
};

/** Overview tab — the one-screen pulse of the store, like the big platforms. */
export function DashboardOverview({
  tenant,
  stats,
  orders,
  currency,
  isNewStore,
  onTab,
}: {
  tenant: Tenant;
  stats: DashboardStats;
  orders: OrderRow[];
  currency: string;
  isNewStore: boolean;
  onTab: (tab: string) => void;
}) {
  const kpis = [
    { label: "Revenue", value: formatMoney(stats.revenue, currency), icon: Wallet, hint: "All-time, paid orders" },
    { label: "Orders", value: String(stats.orderCount), icon: ShoppingCart, hint: stats.pendingOrders ? `${stats.pendingOrders} to fulfil` : "All caught up" },
    { label: "Products", value: String(stats.productCount), icon: Package, hint: "In your catalogue" },
    { label: "Low stock", value: String(stats.lowStockCount), icon: TrendingUp, hint: stats.lowStockCount ? "Worth restocking" : "Stock looks healthy" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-xs text-white/50 mt-0.5">The pulse of {tenant.name} — everything important on one screen.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onTab("products")} className="rounded-xl bg-[#e9c78d] px-4 py-2.5 text-xs font-bold text-[#11110f] hover:bg-[#f3d7a8] transition inline-flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add product
          </button>
          <Link href={`/store/${tenant.slug}`} target="_blank" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition inline-flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> View website
          </Link>
        </div>
      </div>

      {isNewStore ? (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a17] to-[#121210] p-6">
          <div className="flex items-start gap-3">
            <Rocket className="h-5 w-5 text-[#e9c78d] mt-0.5" />
            <div>
              <h2 className="text-base font-bold">Finish setting up your store</h2>
              <p className="text-xs text-white/50 mt-1 max-w-xl">Add your first products, connect payments and pick a theme — then open the doors.</p>
              <button onClick={() => onTab("setup")} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#e9c78d]">Open setup guide <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-[#161614] p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <k.icon className="h-3.5 w-3.5" /> {k.label}
            </div>
            <div className="mt-3 text-2xl font-bold">{k.value}</div>
            <div className="mt-1 text-[11px] text-white/35">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-white/10 bg-[#161614] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-base font-bold">Recent orders</h2>
            <button onClick={() => onTab("orders")} className="text-[11px] font-bold text-[#e9c78d] inline-flex items-center gap-1">All orders <ArrowRight className="h-3 w-3" /></button>
          </div>
          {orders.length ? (
            <div className="divide-y divide-white/5">
              {orders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">#{o.orderNumber} · {formatMoney(o.total, currency)}</div>
                    <div className="text-[11px] text-white/40 truncate">{o.shippingAddress?.name || o.email}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">{o.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 pb-6 pt-2 text-center">
              <p className="text-sm text-white/45 py-6">No orders yet — share your website link to get the first one.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#161614] p-5">
          <h2 className="text-base font-bold mb-3">Quick actions</h2>
          <div className="space-y-2">
            <button onClick={() => onTab("products")} className="w-full flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold hover:border-white/25 transition">
              <Package className="h-4 w-4 text-white/50" /> Manage products
            </button>
            <button onClick={() => onTab("settings")} className="w-full flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold hover:border-white/25 transition">
              <Settings className="h-4 w-4 text-white/50" /> Theme & settings
            </button>
            <button onClick={() => onTab("plugins")} className="w-full flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold hover:border-white/25 transition">
              <Plug className="h-4 w-4 text-white/50" /> Plugins & payments
            </button>
            <Link href={`/store/${tenant.slug}`} target="_blank" className="w-full flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold hover:border-white/25 transition">
              <ExternalLink className="h-4 w-4 text-white/50" /> Open public website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
