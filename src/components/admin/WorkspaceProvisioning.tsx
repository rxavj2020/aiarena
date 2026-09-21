import Link from "next/link";
import { ArrowRight, Cloud, Database, ExternalLink, ShieldCheck, Store } from "lucide-react";
import type { Tenant } from "@/lib/db/schema";

export function WorkspaceProvisioning({ tenant, firestoreConnected }: { tenant: Tenant; firestoreConnected: boolean }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center justify-center py-12">
      <div className="w-full rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#11110f] text-[#e9c78d]"><Store className="h-6 w-6" /></div>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f3eadb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b682d]"><ShieldCheck className="h-3.5 w-3.5" /> Tenant-safe workspace</div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">{tenant.name} is ready for its own admin data.</h1>
        <p className="mt-4 text-sm leading-6 text-black/55">The legacy demo console is intentionally not shown here. Your workspace will never see another brand’s products, customers or orders while its tenant-scoped data repository is being provisioned.</p>
        <div className="mt-7 space-y-3"><div className="flex items-center gap-3 rounded-2xl bg-[#f7f7f5] p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${firestoreConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}><Cloud className="h-4 w-4" /></span><div className="flex-1"><div className="text-sm font-bold">Firestore connection</div><div className="mt-0.5 text-xs text-black/45">{firestoreConnected ? "Connected and tested" : "Connect this workspace before launch"}</div></div><span className="text-xs font-bold">{firestoreConnected ? "Done" : "Required"}</span></div><div className="flex items-center gap-3 rounded-2xl bg-[#f7f7f5] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef3ff] text-[#536dce]"><Database className="h-4 w-4" /></span><div className="flex-1"><div className="text-sm font-bold">Tenant data layer</div><div className="mt-0.5 text-xs text-black/45">Products, orders and customers will stay in this workspace.</div></div><span className="text-xs font-bold text-[#536dce]">Provisioning</span></div></div>
        <div className="mt-8 flex flex-wrap gap-3"><Link href={`/platform/stores/${tenant.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-3 text-sm font-bold text-white transition hover:bg-black">Continue workspace setup <ArrowRight className="h-4 w-4" /></Link><Link href={`/site/${tenant.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold transition hover:border-black/30">Preview public site <ExternalLink className="h-4 w-4" /></Link></div>
      </div>
    </div>
  );
}
