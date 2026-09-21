import Link from "next/link";
import { ArrowRight, Cloud, ExternalLink, Globe2, Package, Plug, Settings2, ShieldCheck, ShoppingCart, Store } from "lucide-react";
import type { Tenant } from "@/lib/db/schema";
import { listTenantOrders, listTenantProducts, type TenantOrder } from "@/lib/tenant-firestore";
import { TenantProductBuilder } from "@/components/admin/TenantProductBuilder";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}

function date(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsed);
}

export async function TenantAdminWorkspace({ tenant, firestoreConnected }: { tenant: Tenant; firestoreConnected: boolean }) {
  const products = firestoreConnected ? await listTenantProducts(tenant.id, { includeDrafts: true }).catch(() => []) : [];
  const orders = firestoreConnected ? await listTenantOrders(tenant.id).catch(() => []) : [];
  const pendingOrders = orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status.toLowerCase())).length;

  return <div className="mx-auto max-w-[1200px] space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f3eadb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b682d]"><Store className="h-3.5 w-3.5" /> Store admin</div><h1 className="font-display text-3xl font-bold tracking-tight">{tenant.name}</h1><p className="mt-1 text-sm text-black/50">Manage your products and orders from one private control panel.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/settings" aria-label="Open store settings" className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-bold transition hover:border-black/30"><Settings2 className="h-4 w-4" /> Settings</Link><Link href="/admin/plugins" aria-label="Open store plugins" className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-bold transition hover:border-black/30"><Plug className="h-4 w-4" /> Plugins</Link><Link href={`/store/${tenant.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-black"><ExternalLink className="h-4 w-4" /> View store</Link></div></div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Link href="/admin/products" className="rounded-2xl border border-black/10 bg-white p-4 transition hover:border-black/25"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40"><Package className="h-4 w-4" /> Products</div><div className="mt-4 text-2xl font-bold">{products.length}</div><div className="mt-1 text-xs text-black/45">Catalogue records</div></Link><Link href="/admin/orders" className="rounded-2xl border border-black/10 bg-white p-4 transition hover:border-black/25"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40"><ShoppingCart className="h-4 w-4" /> Orders</div><div className="mt-4 text-2xl font-bold">{orders.length}</div><div className="mt-1 text-xs text-black/45">All store orders</div></Link><Link href="/admin/orders" className="rounded-2xl border border-black/10 bg-white p-4 transition hover:border-black/25"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40"><Cloud className="h-4 w-4" /> Needs attention</div><div className="mt-4 text-2xl font-bold">{pendingOrders}</div><div className="mt-1 text-xs text-black/45">Pending or processing</div></Link><div className="rounded-2xl border border-black/10 bg-white p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40"><Globe2 className="h-4 w-4" /> Public site</div><div className="mt-4 text-lg font-bold">{tenant.status === "active" ? "Live" : "Setup"}</div><div className="mt-1 text-xs text-black/45">{tenant.slug}.aurelia.app</div></div></div>

    {!firestoreConnected ? <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><Cloud className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-bold text-amber-900">Connect Firestore to unlock your store data.</h2><p className="mt-1 text-sm leading-6 text-amber-800/70">Aurelia never falls back to another subscriber&apos;s data. Connect and test your database from Store settings, then products and orders will use your namespaced collection.</p><Link href="/admin/settings" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-amber-900 underline">Open database settings <ArrowRight className="h-4 w-4" /></Link></div></div></div> : null}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div><TenantProductBuilder tenantId={tenant.id} products={products} connected={firestoreConnected} /></div><section className="h-fit rounded-[22px] border border-black/10 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Order activity</div><h2 className="mt-1 font-display text-xl font-bold">Recent orders</h2></div><Link href="/admin/orders" className="text-xs font-bold text-black/50 hover:text-black">View all</Link></div><div className="mt-5 space-y-2">{orders.slice(0, 5).map((order) => <OrderMini key={order.id || order.orderNumber} order={order} />)}{!orders.length ? <div className="rounded-2xl border border-dashed border-black/15 p-7 text-center text-xs leading-5 text-black/40">Orders from this store will appear here. No global Aurelia orders are shown.</div> : null}</div></section></div>
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs text-black/45"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Product and order reads are scoped to {tenant.name}&apos;s Firestore connection.</div>
  </div>;
}

function OrderMini({ order }: { order: TenantOrder }) {
  return <div className="flex items-center gap-3 rounded-xl bg-[#f7f7f5] px-3 py-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-black/45"><ShoppingCart className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2 text-sm font-bold"><span>#{order.orderNumber}</span><span>{money(order.total)}</span></div><div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/40"><span className="truncate">{order.email || "Guest checkout"}</span><span className="shrink-0 capitalize">{order.status} · {date(order.createdAt)}</span></div></div></div>;
}
