"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Cloud, LockKeyhole, Sparkles, Store } from "lucide-react";
import { createWorkspace } from "@/actions/platform";
import { planMeta } from "@/lib/platform-meta";

type Plan = keyof typeof planMeta;

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export default function NewStorePage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagline, setTagline] = useState("Thoughtful products, made yours.");
  const [plan, setPlan] = useState<Plan>("starter");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    start(async () => {
      const result = await createWorkspace({ name, slug: slug || makeSlug(name), tagline, plan });
      if (!result.ok) { setError(result.error); return; }
      router.push(`/platform/stores/${result.slug}?step=database`);
    });
  }

  return (
    <div className="mx-auto max-w-[1040px]">
      <Link href="/platform" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-black/50 transition hover:text-black"><ArrowLeft className="h-4 w-4" /> Back to Studio</Link>
      <div className="mb-9 max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f3eadb] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b682d]"><Sparkles className="h-3.5 w-3.5" /> Your store</div><h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl">Start with your brand.<br /><span className="text-black/35">Connect data next.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-black/55 sm:text-base">Your store is the private home for your admin tools, data connection and public storefront. No demo products will be created here.</p></div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3"><div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#11110f] text-xs font-bold text-[#e9c78d]">1</span><div><div className="text-xs font-bold">Brand</div><div className="text-[11px] text-black/45">Name & identity</div></div></div><div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef3ff] text-xs font-bold text-[#536dce]">2</span><div><div className="text-xs font-bold">Real data</div><div className="text-[11px] text-black/45">Connect Firestore</div></div></div><div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0f6ef] text-xs font-bold text-emerald-700">3</span><div><div className="text-xs font-bold">Launch</div><div className="text-[11px] text-black/45">Domain & publish</div></div></div></div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-[24px] border border-black/10 bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3eadb] text-[#9b682d]"><Store className="h-5 w-5" /></div><div><h2 className="font-display text-lg font-bold">Store identity</h2><p className="text-xs text-black/45">You can fine-tune the visuals after creating it.</p></div></div>
          <div className="space-y-5">
            <div><label className="mb-1.5 block text-xs font-bold text-black/70">Brand or store name</label><input autoFocus value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(makeSlug(e.target.value)); }} placeholder="e.g. Nila Home" className="w-full rounded-xl border border-black/10 bg-[#fafaf8] px-4 py-3 text-sm outline-none transition placeholder:text-black/25 focus:border-black/40" /></div>
            <div><label className="mb-1.5 block text-xs font-bold text-black/70">Public store URL</label><div className="flex items-center rounded-xl border border-black/10 bg-[#fafaf8] focus-within:border-black/40"><input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(makeSlug(e.target.value)); }} placeholder="nila-home" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-black/25" /><span className="pr-4 text-xs font-semibold text-black/35">.aurelia.app</span></div><p className="mt-1.5 text-[11px] text-black/40">Lowercase letters, numbers and hyphens only.</p></div>
            <div><label className="mb-1.5 block text-xs font-bold text-black/70">One-line brand promise <span className="font-normal text-black/35">(optional)</span></label><input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Thoughtful products, made yours." className="w-full rounded-xl border border-black/10 bg-[#fafaf8] px-4 py-3 text-sm outline-none transition placeholder:text-black/25 focus:border-black/40" /></div>
          </div>
          <div className="my-7 border-t border-black/10" />
          <div className="mb-4"><h2 className="font-display text-lg font-bold">Choose your starting plan</h2><p className="mt-1 text-xs text-black/45">You can change this later as your business grows.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(planMeta) as Plan[]).map((key) => { const p = planMeta[key]; const selected = plan === key; return <button type="button" key={key} onClick={() => setPlan(key)} className={`relative rounded-2xl border p-4 text-left transition ${selected ? "border-[#11110f] bg-[#11110f] text-white shadow-lg" : "border-black/10 bg-[#fafaf8] hover:border-black/25"}`}>{selected ? <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#e9c78d] text-[#11110f]"><Check className="h-3 w-3" /></span> : null}<div className="text-sm font-bold">{p.name}</div><div className={`mt-2 text-lg font-bold ${selected ? "text-[#e9c78d]" : ""}`}>{p.price}<span className={`text-[11px] font-normal ${selected ? "text-white/45" : "text-black/40"}`}> / month</span></div><div className={`mt-2 text-[11px] leading-4 ${selected ? "text-white/55" : "text-black/45"}`}>{p.description}</div></button>; })}
          </div>
          {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-[11px] text-black/40"><LockKeyhole className="h-3.5 w-3.5" /> Your store is private by default</div><button type="button" onClick={submit} disabled={pending || !name.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40">{pending ? "Creating…" : "Create & connect data"}<ArrowRight className="h-4 w-4" /></button></div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[24px] bg-[#e9c78d] p-6 text-[#11110f]"><Cloud className="h-5 w-5" /><h3 className="mt-5 font-display text-xl font-bold">Firestore first</h3><p className="mt-2 text-sm leading-6 text-[#11110f]/65">After this step, we’ll ask for your Firebase service-account connection. We test read and write access before your store can launch.</p><div className="mt-5 space-y-3 text-xs font-semibold"><div className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> No placeholder catalogue</div><div className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Encrypted credentials</div><div className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Tenant-specific collections</div></div></div>
          <div className="rounded-[24px] border border-black/10 bg-white p-6"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">What you get</div><ul className="mt-4 space-y-3 text-sm text-black/65"><li className="flex gap-3"><span className="mt-0.5 text-emerald-600">✓</span> A private store admin</li><li className="flex gap-3"><span className="mt-0.5 text-emerald-600">✓</span> A public store URL</li><li className="flex gap-3"><span className="mt-0.5 text-emerald-600">✓</span> Brand and domain controls</li><li className="flex gap-3"><span className="mt-0.5 text-emerald-600">✓</span> Plugin-ready infrastructure</li></ul></div>
        </aside>
      </div>
    </div>
  );
}
