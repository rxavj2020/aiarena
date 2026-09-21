import Link from "next/link";
import { ArrowRight, CheckCircle2, Cloud, KeyRound, Plug, ShieldCheck, XCircle } from "lucide-react";
import type { Tenant } from "@/lib/db/schema";
import { getTenantPluginState, maskedTenantPluginConfig, tenantPluginDefinition, tenantPluginDefs } from "@/lib/tenant-plugins";
import { TenantPluginEditor } from "@/components/admin/TenantPluginEditor";

const categories: Record<string, string> = { payments: "Payments", email: "Email and notifications", storage: "Media and data", hosting: "Hosting and CDN", shipping: "Shipping and delivery", marketing: "Marketing", analytics: "Analytics" };

export function TenantAdminPlugins({ tenant, provider }: { tenant: Tenant; provider?: string }) {
  if (provider) {
    const def = tenantPluginDefinition(provider);
    if (!def) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">That store integration is not available.</div>;
    const state = getTenantPluginState(tenant.id, provider);
    const masked = maskedTenantPluginConfig(tenant.id, provider);
    return <TenantPluginEditor tenantId={tenant.id} def={def} initialState={state} initialConfig={masked.config} hasSecret={masked.hasSecret} />;
  }

  const defs = tenantPluginDefs();
  const groups = Object.keys(categories).map((category) => ({ category, defs: defs.filter((def) => def.category === category) })).filter((group) => group.defs.length);
  return (
    <div className="mx-auto max-w-[1200px] space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#536dce]"><Plug className="h-3.5 w-3.5" /> Store integrations</div><h1 className="font-display text-3xl font-bold tracking-tight">Plugins</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-black/50">Connect payments, email, shipping and other providers to {tenant.name}. Every credential and enablement state on this page belongs to this store only.</p></div><Link href="/admin" className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-bold transition hover:border-black/30 sm:self-auto"><ArrowRight className="h-4 w-4 rotate-180" /> Dashboard</Link></div>

      <section className="rounded-[22px] border border-black/10 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3eadb] text-[#9b682d]"><Cloud className="h-5 w-5" /></div><div><h2 className="font-display text-xl font-bold">Google Firestore</h2><p className="mt-1 text-sm leading-5 text-black/50">Your store database connection, namespace and Google OAuth setup.</p></div></div><Link href="/admin/settings?step=database" className="inline-flex items-center gap-2 self-start rounded-xl bg-[#11110f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black sm:self-auto">Open database settings <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-4 flex items-center gap-2 text-xs font-semibold text-black/50"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Firestore is configured from Store settings so its tenant OAuth flow stays separate from provider plugins.</div></section>

      {groups.map((group) => <section key={group.category}><h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-black/40">{categories[group.category]}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{group.defs.map((def) => { const state = getTenantPluginState(tenant.id, def.id); return <Link key={def.id} href={`/admin/plugins/${def.id}`} className="group rounded-[22px] border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/25 hover:shadow-lg"><div className="flex items-start gap-3"><span className="text-3xl">{def.icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><div className="font-bold">{def.name}</div><span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-black/45"><KeyRound className="h-3 w-3" /> Guided setup</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-black/50">{def.description}</p></div></div><div className="mt-5 flex items-center justify-between text-xs">{state.enabled ? <span className="flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Enabled for this store</span> : <span className="flex items-center gap-1 text-black/35"><XCircle className="h-3.5 w-3.5" /> Not connected</span>}<span className="flex items-center gap-1 font-bold text-black/45 group-hover:text-black">Configure <ArrowRight className="h-3.5 w-3.5" /></span></div></Link>; })}</div></section>)}
    </div>
  );
}
