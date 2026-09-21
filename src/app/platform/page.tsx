import Link from "next/link";
import { ArrowRight, Check, Cloud, ExternalLink, Globe2, LayoutDashboard, Plug, Rocket, Settings2, ShieldCheck, Sparkles, Store } from "lucide-react";
import { getCurrentWorkspace, workspaceSetup, workspaceStats } from "@/lib/platform";
import { DEFAULT_TENANT_ID } from "@/lib/platform";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}

export default async function PlatformOverview() {
  const current = await getCurrentWorkspace();
  const store = current.tenant;
  const setup = store ? workspaceSetup(store.id) : null;
  const stats = store && store.id === DEFAULT_TENANT_ID ? workspaceStats(store.id) : null;

  if (!store) {
    return (
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[28px] bg-[#11110f] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#e9c78d]/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9c78d]"><Sparkles className="h-3.5 w-3.5" /> Your Aurelia store</div>
            <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">A clear path from idea to storefront.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">Set up your one private store, connect its real data, then manage products, orders and integrations from one control panel.</p>
          </div>
        </section>
        <section className="rounded-[24px] border border-black/10 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3eadb] text-[#9b682d]"><Rocket className="h-6 w-6" /></div>
            <div className="flex-1"><h2 className="font-display text-xl font-bold">Set up your store</h2><p className="mt-1 max-w-xl text-sm leading-6 text-black/55">Choose your brand name and public URL. We’ll guide you through the secure database connection next. You can only have one store on this account.</p></div>
            <Link href="/platform/new" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#11110f] px-4 py-3 text-sm font-bold text-white transition hover:bg-black">Start setup <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          {[["1", "Brand", "Name your store and shape its identity."], ["2", "Real data", "Connect Firestore with encrypted credentials."], ["3", "Launch", "Publish your public site on Aurelia or your domain."]].map(([number, title, body]) => <div key={number} className="rounded-2xl border border-black/10 bg-white p-5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#11110f] text-xs font-bold text-[#e9c78d]">{number}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-black/50">{body}</p></div>)}
        </section>
      </div>
    );
  }

  const checks = [
    { label: "Store identity", done: !!setup?.brandReady, href: `/platform/stores/${store.slug}` },
    { label: "Private database", done: !!setup?.firestoreConnected, href: `/platform/stores/${store.slug}?step=database` },
    { label: "Public domain", done: setup?.domain?.status === "verified", href: `/platform/stores/${store.slug}?step=domain` },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#11110f] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#e9c78d]/15 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[42%] h-52 w-52 rounded-full bg-[#6b8cff]/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9c78d]"><Store className="h-3.5 w-3.5" /> Your store control plane</div>
            <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{store.name} is yours to run.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">Products, orders, customers and your public site stay behind one secure admin account.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e9c78d] px-5 py-3 text-sm font-bold text-[#11110f] transition hover:bg-[#f2d8a7]"><LayoutDashboard className="h-4 w-4" /> Open admin</Link>
            <Link href={`/store/${store.slug}`} target="_blank" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"><ExternalLink className="h-4 w-4" /> View site</Link>
          </div>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
          <div><div className="text-2xl font-bold">{stats?.products ?? "—"}</div><div className="mt-1 text-xs text-white/45">Products</div></div>
          <div><div className="text-2xl font-bold">{stats?.orders ?? "—"}</div><div className="mt-1 text-xs text-white/45">Orders</div></div>
          <div><div className="text-2xl font-bold">{stats ? money(stats.revenue) : setup?.firestoreConnected ? "Ready" : "Setup"}</div><div className="mt-1 text-xs text-white/45">{stats ? "Revenue" : "Store data"}</div></div>
          <div><div className="text-2xl font-bold">{store.status === "active" ? "Live" : "Setup"}</div><div className="mt-1 text-xs text-white/45">Store status</div></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[24px] border border-black/10 bg-white p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Store readiness</div><h2 className="mt-1 font-display text-2xl font-bold">Keep moving at your pace.</h2></div><Link href="/dashboard?tab=settings" className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs font-bold transition hover:border-black/30"><Settings2 className="h-4 w-4" /> Settings</Link></div>
          <div className="mt-6 space-y-3">
            {checks.map((check) => <Link key={check.label} href={check.href} className="flex items-center gap-3 rounded-2xl bg-[#f7f7f5] px-4 py-3 transition hover:bg-[#f0f0ec]"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${check.done ? "bg-emerald-100 text-emerald-700" : "bg-white text-black/30"}`}>{check.done ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}</span><span className="flex-1 text-sm font-semibold">{check.label}</span><ArrowRight className="h-4 w-4 text-black/30" /></Link>)}
          </div>
        </div>
        <div className="rounded-[24px] bg-[#e9c78d] p-6 text-[#11110f]"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#11110f]/55"><ShieldCheck className="h-4 w-4" /> Built for one store</div><h3 className="mt-4 font-display text-2xl font-bold">Simple by default.</h3><p className="mt-2 text-sm leading-6 text-[#11110f]/65">No workspace lists or store switching. Your account opens the same private admin and public site every time.</p><div className="mt-5 space-y-3 text-sm font-semibold"><Link href="/dashboard?tab=plugins" className="flex items-center gap-3"><Plug className="h-4 w-4" /> Configure integrations <ArrowRight className="ml-auto h-4 w-4" /></Link><Link href="/dashboard?tab=settings" className="flex items-center gap-3"><Settings2 className="h-4 w-4" /> Manage store settings <ArrowRight className="ml-auto h-4 w-4" /></Link><Link href={`/store/${store.slug}`} target="_blank" className="flex items-center gap-3"><Globe2 className="h-4 w-4" /> Open public website <ArrowRight className="ml-auto h-4 w-4" /></Link></div></div>
      </section>

      <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs text-black/50"><Cloud className="h-4 w-4 text-[#536dce]" /> Your database connection and provider credentials are isolated to {store.name} and encrypted before storage.</div>
    </div>
  );
}
