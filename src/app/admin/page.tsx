import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, sql, eq } from "drizzle-orm";
import { formatMoney, formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { getAllPluginStates } from "@/lib/plugins/store";
import { TrendingUp, ShoppingCart, Users, AlertTriangle, ArrowRight, Plug } from "lucide-react";
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
  const lowStock = db.select().from(schema.products).where(sql`track_stock = 1 and stock <= 5 and status = 'active'`).limit(6).all();
  const recent = db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(8).all();
  const daily = db.select({ d: sql<string>`substr(created_at,1,10)`, v: sql<number>`sum(total)`, n: sql<number>`count(*)` }).from(schema.orders).where(sql`${paid} and created_at >= ${d30}`).groupBy(sql`substr(created_at,1,10)`).all();
  const top = db.select({ name: schema.orderItems.name, qty: sql<number>`sum(quantity)`, rev: sql<number>`sum(price*quantity)` }).from(schema.orderItems).innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id)).where(paid).groupBy(schema.orderItems.name).orderBy(desc(sql`sum(price*quantity)`)).limit(5).all();
  const plugins = getAllPluginStates();
  const enabledPlugins = plugins.filter((p) => p.state.enabled);
  const missing = [!plugins.some((p) => p.def.category === "payments" && p.state.enabled) && "payment gateway", !plugins.some((p) => p.def.id === "smtp" && p.state.enabled) && "email (SMTP)"].filter(Boolean) as string[];

  const series = Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10); const r = daily.find((x) => x.d === d); return { d, v: (r?.v ?? 0) / 100, n: r?.n ?? 0 }; });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}>
        <Link href="/admin/products/new" className="btn-primary btn-sm">Add product</Link>
      </PageHeader>
      {missing.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3 text-sm">
          <Plug className="h-5 w-5 text-amber-600" />
          <div className="flex-1">Your store isn&apos;t fully set up yet: no <b>{missing.join("</b> and no <b>")}</b> configured. Customers can only use Cash on Delivery and won&apos;t receive emails.</div>
          <Link href="/admin/plugins" className="btn-sm btn bg-amber-600 text-white">Set up plugins</Link>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={TrendingUp} label="Revenue (30 days)" value={formatMoney(revenue30.v, s.currency)} sub={`${revenue30.n} orders`} />
        <Stat icon={ShoppingCart} label="Today" value={formatMoney(revenueToday.v, s.currency)} sub={`${revenueToday.n} orders`} />
        <Stat icon={AlertTriangle} label="Orders to fulfil" value={String(pending)} sub="pending / confirmed / processing" href="/admin/orders?status=open" />
        <Stat icon={Users} label="Customers" value={String(customers)} sub={`${enabledPlugins.length} plugins active`} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Sales — last 30 days</h2><span className="text-xs text-gray-500">{s.currency}</span></div>
          <SalesChart data={series} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Top products</h2>
          <ul className="space-y-3 text-sm">
            {top.map((t, i) => <li key={t.name} className="flex items-center gap-3"><span className="text-xs text-gray-400 w-4">{i + 1}</span><span className="flex-1 truncate">{t.name}</span><span className="text-gray-500 text-xs">{t.qty} sold</span><span className="font-medium">{formatMoney(t.rev, s.currency)}</span></li>)}
            {top.length === 0 && <li className="text-gray-500">No sales yet</li>}
          </ul>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3"><h2 className="font-semibold">Recent orders</h2><Link href="/admin/orders" className="text-sm text-gray-600 hover:text-black flex items-center gap-1">All orders <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <table className="data">
            <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">#{o.orderNumber}</Link><div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div></td>
                  <td>{o.shippingAddress.name}<div className="text-xs text-gray-400">{o.email}</div></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><StatusBadge status={o.paymentStatus} /></td>
                  <td className="text-right font-medium">{formatMoney(o.total, s.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock</h2>
          <ul className="space-y-2.5 text-sm">
            {lowStock.map((p) => <li key={p.id} className="flex items-center gap-3"><div className="h-9 w-9 rounded bg-gray-100 overflow-hidden shrink-0">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div><Link href={`/admin/products/${p.id}`} className="flex-1 truncate hover:underline">{p.name}</Link><span className={`badge ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{p.stock} left</span></li>)}
            {lowStock.length === 0 && <li className="text-gray-500">All products well stocked</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: I, label, value, sub, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; href?: string }) {
  const inner = (
    <div className="card p-5 h-full hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between text-gray-500"><span className="text-xs font-medium">{label}</span><I className="h-4 w-4" /></div>
      <div className="text-2xl font-semibold mt-2 tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
