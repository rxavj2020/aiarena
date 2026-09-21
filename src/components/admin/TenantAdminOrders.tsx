import Link from "next/link";
import { ArrowRight, Cloud, Package, RefreshCw, ShoppingCart, UserRound } from "lucide-react";
import type { Tenant } from "@/lib/db/schema";
import { listTenantOrders, type TenantOrder } from "@/lib/tenant-firestore";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}

function date(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function statusClass(status: string) {
  if (["delivered", "paid", "confirmed"].includes(status.toLowerCase())) return "bg-emerald-50 text-emerald-700";
  if (["cancelled", "refunded", "failed"].includes(status.toLowerCase())) return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

function OrderRow({ order }: { order: TenantOrder }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-black/10 p-4 transition hover:border-black/25 md:grid-cols-[1.1fr_1.5fr_1fr_0.8fr_auto] md:items-center">
      <div><div className="text-sm font-bold">#{order.orderNumber}</div><div className="mt-1 text-[11px] text-black/40">{date(order.createdAt)}</div></div>
      <div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-3.5 w-3.5 shrink-0 text-black/35" /> <span className="truncate">{order.email || "Guest checkout"}</span></div><div className="mt-1 text-[11px] text-black/40">{order.itemCount} {order.itemCount === 1 ? "item" : "items"}{order.shippingAddress?.city ? ` · ${order.shippingAddress.city}` : ""}</div></div>
      <div className="text-sm font-bold">{money(order.total)}</div>
      <div className="flex flex-wrap gap-1.5"><span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${statusClass(order.status)}`}>{order.status}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${statusClass(order.paymentStatus)}`}>{order.paymentStatus}</span></div>
      <span className="hidden text-black/25 md:block"><ArrowRight className="h-4 w-4" /></span>
    </div>
  );
}

export async function TenantAdminOrders({ tenant, firestoreConnected }: { tenant: Tenant; firestoreConnected: boolean }) {
  let orders: TenantOrder[] = [];
  let readFailed = false;
  if (firestoreConnected) {
    try { orders = await listTenantOrders(tenant.id); } catch { readFailed = true; }
  }
  const pending = orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status.toLowerCase())).length;
  const paid = orders.filter((order) => ["paid", "cod"].includes(order.paymentStatus.toLowerCase())).reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f3eadb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b682d]"><ShoppingCart className="h-3.5 w-3.5" /> Store orders</div><h1 className="font-display text-3xl font-bold tracking-tight">Orders</h1><p className="mt-1 text-sm text-black/50">Review and act on orders belonging only to {tenant.name}.</p></div><Link href="/admin" className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-bold transition hover:border-black/30 sm:self-auto"><ArrowRight className="h-4 w-4 rotate-180" /> Dashboard</Link></div>

      {!firestoreConnected ? <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><Cloud className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-bold text-amber-900">Connect Firestore to see your orders.</h2><p className="mt-1 text-sm leading-6 text-amber-800/70">Aurelia does not show orders from another store. Connect and test this store&apos;s database from settings first.</p><Link href="/admin/settings" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-amber-900 underline">Open store settings <ArrowRight className="h-4 w-4" /></Link></div></div></div> : null}
      {readFailed ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Orders could not be read from this store&apos;s Firestore connection. Re-test the connection in settings.</div> : null}

      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-black/10 bg-white p-5"><div className="text-xs font-bold uppercase tracking-wider text-black/40">All orders</div><div className="mt-4 text-3xl font-bold">{orders.length}</div><div className="mt-1 text-xs text-black/45">Tenant orders</div></div><div className="rounded-2xl border border-black/10 bg-white p-5"><div className="text-xs font-bold uppercase tracking-wider text-black/40">Needs attention</div><div className="mt-4 text-3xl font-bold">{pending}</div><div className="mt-1 text-xs text-black/45">Pending or processing</div></div><div className="rounded-2xl border border-black/10 bg-white p-5"><div className="text-xs font-bold uppercase tracking-wider text-black/40">Paid value</div><div className="mt-4 text-3xl font-bold">{money(paid)}</div><div className="mt-1 text-xs text-black/45">Paid or cash on delivery</div></div></div>

      <section className="rounded-[22px] border border-black/10 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Private order feed</div><h2 className="mt-1 font-display text-xl font-bold">Recent orders</h2></div><div className="flex items-center gap-2 text-xs text-black/40"><RefreshCw className="h-3.5 w-3.5" /> Refresh the page for new orders</div></div><div className="mt-5 space-y-2">{orders.map((order) => <OrderRow key={order.id || order.orderNumber} order={order} />)}{!orders.length && <div className="rounded-2xl border border-dashed border-black/15 p-12 text-center"><Package className="mx-auto h-7 w-7 text-black/25" /><div className="mt-3 text-sm font-semibold text-black/55">No orders yet</div><p className="mt-1 text-xs leading-5 text-black/40">Orders created by this store will appear here. This view never falls back to the Aurelia demo order table.</p></div>}</div></section>
    </div>
  );
}
