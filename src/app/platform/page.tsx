import Link from "next/link";
import { ArrowRight, Check, ChevronRight, CircleDot, Cloud, Globe2, LayoutDashboard, Plus, Rocket, ShieldCheck, Sparkles, Store, Users, Boxes } from "lucide-react";
import { getCurrentUserWorkspaces, getCurrentWorkspace, workspaceSetup, workspaceStats } from "@/lib/platform";
import { planMeta } from "@/lib/platform-meta";
import { selectWorkspace } from "@/actions/platform";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}

export default async function PlatformOverview() {
  const [{ workspaces }, current] = await Promise.all([getCurrentUserWorkspaces(), getCurrentWorkspace()]);
  const selected = current.tenant;
  const stats = selected ? workspaceStats(selected.id) : null;
  const setup = selected ? workspaceSetup(selected.id) : null;
  const activeCount = workspaces.filter(({ tenant }) => tenant.status === "active").length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#11110f] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#e9c78d]/15 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[42%] h-52 w-52 rounded-full bg-[#6b8cff]/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9c78d]"><Sparkles className="h-3.5 w-3.5" /> Commerce control plane</div>
            <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Turn your idea into a store people remember.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">Create a workspace, connect your real Firestore data, shape your brand, and launch a fast public website on your domain.</p>
          </div>
          <Link href="/platform/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e9c78d] px-5 py-3 text-sm font-bold text-[#11110f] transition hover:bg-[#f2d8a7]"><Plus className="h-4 w-4" /> Create workspace</Link>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
          <div><div className="text-2xl font-bold">{workspaces.length}</div><div className="mt-1 text-xs text-white/45">Workspaces</div></div>
          <div><div className="text-2xl font-bold">{activeCount}</div><div className="mt-1 text-xs text-white/45">Live stores</div></div>
          <div><div className="text-2xl font-bold">{setup?.firestoreConnected ? "Ready" : "1st"}</div><div className="mt-1 text-xs text-white/45">Database status</div></div>
          <div><div className="text-2xl font-bold">99.9%</div><div className="mt-1 text-xs text-white/45">Platform uptime goal</div></div>
        </div>
      </section>

      {!workspaces.length ? (
        <section className="rounded-[24px] border border-black/10 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3eadb] text-[#9b682d]"><Rocket className="h-6 w-6" /></div>
            <div className="flex-1"><h2 className="font-display text-xl font-bold">Your first store starts here</h2><p className="mt-1 max-w-xl text-sm leading-6 text-black/55">We won’t create fake products or customers. You’ll connect Firestore first, then bring in your brand’s real catalogue and launch when you’re ready.</p></div>
            <Link href="/platform/new" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#11110f] px-4 py-3 text-sm font-bold text-white transition hover:bg-black">Start setup <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      ) : null}

      {selected && stats ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Selected workspace</div><h2 className="mt-1 font-display text-2xl font-bold">{selected.name}</h2></div><Link href={`/platform/stores/${selected.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-black/60 hover:text-black">Manage workspace <ChevronRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-black/40">Products</span><Boxes className="h-4 w-4 text-black/30" /></div><div className="mt-5 text-3xl font-bold">{stats.products}</div><div className="mt-1 text-xs text-black/45">Real catalogue items</div></div>
            <div className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-black/40">Orders</span><Store className="h-4 w-4 text-black/30" /></div><div className="mt-5 text-3xl font-bold">{stats.orders}</div><div className="mt-1 text-xs text-black/45">Across the storefront</div></div>
            <div className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-black/40">Customers</span><Users className="h-4 w-4 text-black/30" /></div><div className="mt-5 text-3xl font-bold">{stats.customers}</div><div className="mt-1 text-xs text-black/45">Registered accounts</div></div>
            <div className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-black/40">Revenue</span><Globe2 className="h-4 w-4 text-black/30" /></div><div className="mt-5 text-3xl font-bold">{money(stats.revenue)}</div><div className="mt-1 text-xs text-black/45">Paid and COD orders</div></div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between"><div><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Your stores</div><h2 className="mt-1 font-display text-2xl font-bold">Workspaces</h2></div><Link href="/platform/new" className="hidden items-center gap-1 text-sm font-bold text-black/60 hover:text-black sm:inline-flex">New workspace <Plus className="h-4 w-4" /></Link></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {workspaces.map(({ tenant, member }) => {
            const state = workspaceSetup(tenant.id);
            return <div key={tenant.id} className="rounded-[22px] border border-black/10 bg-white p-5 transition hover:border-black/25 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] sm:p-6">
              <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold" style={{ backgroundColor: `${tenant.accentColor}20`, color: tenant.accentColor }}>{tenant.name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-display text-lg font-bold">{tenant.name}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tenant.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{tenant.status === "active" ? "Live" : "Setup"}</span></div><p className="mt-1 truncate text-xs text-black/45">{tenant.slug}.aurelia.app · {planMeta[tenant.plan].name} · {member.role}</p></div></div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-xs"><div className={`rounded-xl px-3 py-3 ${state.brandReady ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/45"}`}><Check className="mb-2 h-3.5 w-3.5" />Brand</div><div className={`rounded-xl px-3 py-3 ${state.firestoreConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Cloud className="mb-2 h-3.5 w-3.5" />Firestore</div><div className={`rounded-xl px-3 py-3 ${state.domain?.status === "verified" ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/45"}`}><Globe2 className="mb-2 h-3.5 w-3.5" />Domain</div></div>
              <div className="mt-5 flex flex-wrap items-center gap-2"><Link href={`/platform/stores/${tenant.slug}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#11110f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black">Open workspace <ArrowRight className="h-4 w-4" /></Link><form action={selectWorkspace.bind(null, tenant.id, "/admin")}><button className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold transition hover:border-black/30"><LayoutDashboard className="h-4 w-4" />Admin</button></form></div>
            </div>;
          })}
          {!workspaces.length ? <div className="rounded-[22px] border border-dashed border-black/15 bg-white/50 p-8 text-center text-sm text-black/45 lg:col-span-2">No workspaces yet. Create one to begin.</div> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[22px] border border-black/10 bg-white p-5 lg:col-span-2"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#536dce]"><Cloud className="h-5 w-5" /></div><div><h3 className="font-bold">Data-first by design</h3><p className="mt-0.5 text-xs text-black/50">Every workspace owns its Firestore connection and sync boundary.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f7f7f5] p-4"><ShieldCheck className="h-4 w-4 text-emerald-600" /><div className="mt-3 text-sm font-bold">Private</div><div className="mt-1 text-xs leading-5 text-black/45">Credentials encrypted at rest.</div></div><div className="rounded-xl bg-[#f7f7f5] p-4"><CircleDot className="h-4 w-4 text-[#536dce]" /><div className="mt-3 text-sm font-bold">Isolated</div><div className="mt-1 text-xs leading-5 text-black/45">One tenant boundary per workspace.</div></div><div className="rounded-xl bg-[#f7f7f5] p-4"><Rocket className="h-4 w-4 text-[#c98b5b]" /><div className="mt-3 text-sm font-bold">Launchable</div><div className="mt-1 text-xs leading-5 text-black/45">Connect a domain when ready.</div></div></div></div>
        <div className="rounded-[22px] bg-[#e9c78d] p-5 text-[#11110f]"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#11110f]/55">Three layers</div><div className="mt-4 space-y-3 text-sm font-semibold"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#11110f] text-[#e9c78d]">1</span> Aurelia platform</div><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#11110f] text-[#e9c78d]">2</span> Your admin workspace</div><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#11110f] text-[#e9c78d]">3</span> Your public storefront</div></div><p className="mt-5 text-xs leading-5 text-[#11110f]/60">One control plane. Three experiences. Your brand stays in control.</p></div>
      </section>
    </div>
  );
}
