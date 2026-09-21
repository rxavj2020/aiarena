import Link from "next/link";
import { LayoutDashboard, Plus, Store, ExternalLink, ShieldCheck, Settings2 } from "lucide-react";
import type { Tenant } from "@/lib/db/schema";
import type { WorkspaceWithMember } from "@/lib/platform";

export function PlatformShell({ children, workspaces, current }: { children: React.ReactNode; workspaces: WorkspaceWithMember[]; current: Tenant | null }) {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#181817] lg:flex">
      <aside className="hidden lg:flex lg:w-[264px] lg:flex-col lg:border-r lg:border-black/10 lg:bg-[#11110f] lg:text-white">
        <div className="px-6 py-7">
          <Link href="/platform" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e9c78d] text-[#11110f] shadow-[0_8px_24px_rgba(233,199,141,0.22)]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-[17px] font-bold tracking-tight">Aurelia Studio</div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">Commerce OS</div>
            </div>
          </Link>
        </div>

        <div className="px-4">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Build</div>
          <nav className="space-y-1 text-sm">
            <Link href="/platform" className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 transition hover:bg-white/10 hover:text-white">
              <LayoutDashboard className="h-[17px] w-[17px]" /> Overview
            </Link>
            <Link href="/platform/new" className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 transition hover:bg-white/10 hover:text-white">
              <Plus className="h-[17px] w-[17px]" /> New workspace
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex-1 px-4">
          <div className="mb-2 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            <span>Your workspaces</span><span>{workspaces.length}</span>
          </div>
          <nav className="space-y-1">
            {workspaces.map(({ tenant }) => (
              <Link key={tenant.id} href={`/platform/stores/${tenant.slug}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${current?.id === tenant.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ backgroundColor: `${tenant.accentColor}22`, color: tenant.accentColor }}>{tenant.name.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1 truncate">{tenant.name}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${tenant.status === "active" ? "bg-emerald-400" : tenant.status === "paused" ? "bg-red-400" : "bg-amber-300"}`} />
              </Link>
            ))}
            {!workspaces.length && <div className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-xs leading-relaxed text-white/40">Your first workspace will appear here.</div>}
          </nav>
        </div>

        <div className="space-y-1 border-t border-white/10 p-4 text-sm">
          {current ? (
            <>
              <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 transition hover:bg-white/10 hover:text-white"><Settings2 className="h-4 w-4" /> Store admin</Link>
              <Link href={`/store/${current.slug}`} target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 transition hover:bg-white/10 hover:text-white"><ExternalLink className="h-4 w-4" /> View public site</Link>
            </>
          ) : null}
          <div className="flex items-center gap-2 px-3 pt-3 text-[11px] text-white/35"><ShieldCheck className="h-3.5 w-3.5" /> Secure workspace controls</div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f7f7f5]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#11110f] text-[#e9c78d]"><Store className="h-4 w-4" /></div>
              <div><div className="font-display text-sm font-bold">Aurelia Studio</div><div className="text-[10px] uppercase tracking-widest text-black/40">Commerce OS</div></div>
            </div>
            <div className="hidden text-sm text-black/45 lg:block">Workspace control plane</div>
            <div className="ml-auto flex items-center gap-2">
              {current ? <span className="hidden rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold sm:inline-flex">{current.name}</span> : null}
              {current ? <Link href="/admin" className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-black/30">Open admin</Link> : null}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-7 pb-16 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
