import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, sql, eq } from "drizzle-orm";
import { formatMoney, formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAllPluginStates } from "@/lib/plugins/store";
import { TrendingUp, ShoppingCart, Users, AlertTriangle, ArrowRight, Plug, Package, Plus, Zap, Eye, DollarSign } from "lucide-react";
import { SalesChart } from "@/components/admin/SalesChart";

export default async function Dashboard() {
  const s = await getSettings();
  const paid = sql`payment_status in ('paid','cod') and status != 'cancelled'`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const revenue30 = db.select({ v: sql<number>`coalesce(sum(total),0)`, n: sql<number>`count(*)` }).from(schema.orders).where(sql`${paid} and created_at >= ${d30}`).get()!;
  const revenueToday = db.select({ v: sql<number>`coalesce(sum(total),0)`, n: sql<number>`count(*)` }).from(schema.orders).where(sql`${paid} and created_at >= ${today.toISOString()}`).get()!;
  const customers = db.select({ n: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.role, "customer")).get()!.n;
  const pending = db.select({ n: sql<number>`count(*)` }).from(schema.orders).where(sql`status in ('pending','confirmed','processing')`).get()!.n;
  const totalProducts = db.select({ n: sql<number>`count(*)` }).from(schema.products).get()!.n;
  const activeProducts = db.select({ n: sql<number>`count(*)` }).from(schema.products).where(eq(schema.products.status, "active")).get()!.n;
  const lowStock = db.select().from(schema.products).where(sql`track_stock = 1 and stock <= 5 and status = 'active'`).limit(6).all();
  const recent = db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(8).all();
  const daily = db.select({ d: sql<string>`substr(created_at,1,10)`, v: sql<number>`sum(total)`, n: sql<number>`count(*)` }).from(schema.orders).where(sql`${paid} and created_at >= ${d30}`).groupBy(sql`substr(created_at,1,10)`).all();
  const top = db.select({ name: schema.orderItems.name, qty: sql<number>`sum(quantity)`, rev: sql<number>`sum(price*quantity)` }).from(schema.orderItems).innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id)).where(paid).groupBy(schema.orderItems.name).orderBy(desc(sql`sum(price*quantity)`)).limit(5).all();
  const plugins = getAllPluginStates();
  const enabledPlugins = plugins.filter((p) => p.state.enabled);
  const missing = [!plugins.some((p) => p.def.category === "payments" && p.state.enabled) && "payment gateway", !plugins.some((p) => p.def.id === "smtp" && p.state.enabled) && "email (SMTP)"].filter(Boolean) as string[];

  const series = Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10); const r = daily.find((x) => x.d === d); return { d, v: (r?.v ?? 0) / 100, n: r?.n ?? 0 }; });

  return (
    <div className="space-y-6">
      {/* Header - mobile app style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · Product & order focused</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/orders" className="btn-outline btn-sm rounded-full bg-white">
            <Eye className="h-4 w-4" /> View orders
          </Link>
          <Link href="/admin/products/new" className="btn-primary btn-sm rounded-full">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-sm">
          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Plug className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-amber-900">Setup incomplete</div>
            <div className="text-amber-800 mt-1">
              No{" "}
              {missing.map((m, idx) => (
                <span key={m}>
                  <b>{m}</b>
                  {idx < missing.length - 1 ? " and no " : ""}
                </span>
              ))}{" "}
              configured. Customers can only use COD.
            </div>
          </div>
          <Link href="/admin/plugins" className="btn-sm bg-amber-600 text-white rounded-full px-4">Fix now</Link>
        </div>
      )}

      {/* Product & Order focused stats - like Shopify mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-violet-600" />
            </div>
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">30 days</span>
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Revenue</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight mt-1">{formatMoney(revenue30.v, s.currency)}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {revenue30.n} orders
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full">{pending} pending</span>
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Today</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight mt-1">{formatMoney(revenueToday.v, s.currency)}</div>
          <div className="text-xs text-gray-500 mt-1">{revenueToday.n} orders today</div>
        </div>

        <Link href="/admin/products" className="bg-gray-900 text-white rounded-2xl p-4 sm:p-5 hover:bg-black transition group">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-white/60 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-widest text-white/60">Products</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight mt-1">{activeProducts} / {totalProducts}</div>
          <div className="text-xs text-white/60 mt-1">{totalProducts - activeProducts} drafts · {lowStock.length} low stock</div>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{enabledPlugins.length} plugins</span>
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Customers</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight mt-1">{customers}</div>
          <div className="text-xs text-gray-500 mt-1">Total registered</div>
        </div>
      </div>

      {/* Quick actions - mobile app style */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Quick actions</h2>
          <span className="text-[11px] text-gray-400">Fast product add</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link href="/admin/products/new" className="flex items-center gap-3 p-3 rounded-xl bg-gray-900 text-white hover:bg-black transition">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center"><Plus className="h-5 w-5" /></div>
            <div className="text-left"><div className="font-bold text-sm">New product</div><div className="text-xs text-white/60">Fast add</div></div>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-900 transition">
            <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
            <div className="text-left"><div className="font-bold text-sm">Orders</div><div className="text-xs text-gray-500">{pending} to fulfil</div></div>
          </Link>
          <Link href="/admin/products?stock=low" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-900 transition">
            <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <div className="text-left"><div className="font-bold text-sm">Low stock</div><div className="text-xs text-gray-500">{lowStock.length} items</div></div>
          </Link>
          <Link href="/admin/categories" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-900 transition">
            <div className="h-9 w-9 rounded-full bg-violet-50 flex items-center justify-center"><Zap className="h-5 w-5 text-violet-600" /></div>
            <div className="text-left"><div className="font-bold text-sm">Categories</div><div className="text-xs text-gray-500">Organize</div></div>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Sales — last 30 days</h2>
            <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full font-medium">{s.currency}</span>
          </div>
          <SalesChart data={series} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold mb-4">Top products</h2>
          <ul className="space-y-3 text-sm">
            {top.map((t, i) => (
              <li key={t.name} className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-gray-50 border flex items-center justify-center text-xs font-bold text-gray-500">{i + 1}</span>
                <span className="flex-1 truncate font-medium">{t.name}</span>
                <span className="text-gray-500 text-xs">{t.qty} sold</span>
                <span className="font-bold text-xs">{formatMoney(t.rev, s.currency)}</span>
              </li>
            ))}
            {top.length === 0 && <li className="text-gray-500 text-sm py-8 text-center">No sales yet. Add products and start selling!</li>}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold bg-gray-900 text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-black">
              All orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data">
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`} className="font-bold hover:underline">#{o.orderNumber}</Link><div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div></td>
                    <td><div className="font-medium text-sm">{o.shippingAddress.name}</div><div className="text-xs text-gray-400">{o.email}</div></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><StatusBadge status={o.paymentStatus} /></td>
                    <td className="text-right font-bold">{formatMoney(o.total, s.currency)}</td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-500 text-sm">No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock alert</h2>
          <ul className="space-y-3 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition">
                <div className="h-10 w-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
                <Link href={`/admin/products/${p.id}`} className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.sku || "No SKU"}</div>
                </Link>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{p.stock} left</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="text-gray-500 text-sm py-8 text-center">All products well stocked ✓</li>}
          </ul>
          {lowStock.length > 0 && <Link href="/admin/products?stock=low" className="btn-outline btn-sm w-full mt-4 rounded-full">View all low stock</Link>}
        </div>
      </div>
    </div>
  );
}
