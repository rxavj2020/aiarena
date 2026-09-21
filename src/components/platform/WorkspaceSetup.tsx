"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronRight, Cloud, Code2, ExternalLink, Globe2, HelpCircle, KeyRound, Loader2, Palette, Rocket, Save, ShieldCheck, Store } from "lucide-react";
import { connectWorkspaceDomain, connectWorkspaceFirestore, launchWorkspace, saveWorkspaceBranding, verifyWorkspaceDomain, type FirestoreInput } from "@/actions/platform";
import { connectWorkspaceFirestoreOAuth } from "@/actions/platform-oauth";
import type { Tenant } from "@/lib/db/schema";
import { planMeta } from "@/lib/platform-meta";

type Setup = {
  firestoreConnected: boolean;
  firestoreTested: boolean;
  firestoreMessage: string | null;
  firestoreAuthMode: "oauth" | "service_account";
  firestoreProjectId: string;
  domain: { hostname: string; status: "pending" | "verified" | "disabled"; verificationToken: string } | null;
  brandReady: boolean;
};

type Notice = { kind: "ok" | "error"; text: string } | null;

export function WorkspaceSetup({ tenant: initialTenant, setup: initialSetup, oauthConfigured, oauthReturnTo }: { tenant: Tenant; setup: Setup; oauthConfigured: boolean; oauthReturnTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("step") === "database" ? "data" : searchParams.get("step");
  const initialTab = requestedTab === "data" || requestedTab === "brand" || requestedTab === "domain" ? requestedTab : "overview";
  const [tenant, setTenant] = useState(initialTenant);
  const [setup, setSetup] = useState(initialSetup);
  const [tab, setTab] = useState<"overview" | "data" | "brand" | "domain">(initialTab);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, start] = useTransition();
  const [brand, setBrand] = useState({ name: initialTenant.name, tagline: initialTenant.tagline, logoUrl: initialTenant.logoUrl ?? "", primaryColor: initialTenant.primaryColor, accentColor: initialTenant.accentColor });
  const [firestore, setFirestore] = useState<FirestoreInput>({ projectId: initialSetup.firestoreProjectId, databaseId: "(default)", clientEmail: "", privateKey: "", collectionPrefix: "store_" });
  const [domain, setDomain] = useState("");

  function show(result: { ok: boolean; message?: string; error?: string }) {
    setNotice(result.ok ? { kind: "ok", text: result.message ?? "Saved" } : { kind: "error", text: result.error ?? "Something went wrong" });
    if (result.ok) router.refresh();
  }

  function saveBrand() {
    setNotice(null);
    start(async () => {
      const result = await saveWorkspaceBranding(tenant.id, brand);
      show(result);
      if (result.ok) setTenant({ ...tenant, ...brand, logoUrl: brand.logoUrl || null });
    });
  }

  function connectFirestore() {
    setNotice(null);
    start(async () => {
      const result = await connectWorkspaceFirestore(tenant.id, firestore);
      show(result);
      if (result.ok) setSetup({ ...setup, firestoreConnected: true, firestoreTested: true, firestoreMessage: result.message ?? null });
    });
  }

  function saveDomain() {
    setNotice(null);
    start(async () => {
      const result = await connectWorkspaceDomain(tenant.id, domain);
      show(result);
      if (result.ok) setSetup({ ...setup, domain: { hostname: domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, ""), status: "pending", verificationToken: "" } });
    });
  }

  function launch() {
    setNotice(null);
    start(async () => {
      const result = await launchWorkspace(tenant.id);
      show(result);
      if (result.ok) setTenant({ ...tenant, status: "active" });
    });
  }

  function verifyDomain() {
    setNotice(null);
    start(async () => {
      const result = await verifyWorkspaceDomain(tenant.id);
      show(result);
      if (result.ok && setup.domain) setSetup({ ...setup, domain: { ...setup.domain, status: "verified" } });
    });
  }

  const steps = [
    { id: "brand" as const, label: "Brand", done: setup.brandReady, icon: Palette },
    { id: "data" as const, label: "Firestore", done: setup.firestoreConnected, icon: Cloud },
    { id: "domain" as const, label: "Domain", done: setup.domain?.status === "verified", icon: Globe2 },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div><Link href="/platform" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-black/45 hover:text-black"><ChevronRight className="h-4 w-4 rotate-180" /> Back to store overview</Link><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold" style={{ backgroundColor: `${tenant.accentColor}20`, color: tenant.accentColor }}>{tenant.name.charAt(0).toUpperCase()}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-3xl font-bold tracking-tight">{tenant.name}</h1><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tenant.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{tenant.status === "active" ? "Live" : "Setup"}</span></div><p className="mt-1 text-sm text-black/45">{tenant.slug}.aurelia.app · {planMeta[tenant.plan].name} plan</p></div></div></div>
        <div className="flex flex-wrap gap-2"><Link href={`/store/${tenant.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-black/30"><ExternalLink className="h-4 w-4" /> Preview site</Link><Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black"><Store className="h-4 w-4" /> Open admin</Link></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-[24px] border border-black/10 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Launch checklist</div><h2 className="mt-1 font-display text-2xl font-bold">Make it yours</h2></div><div className="text-xs font-semibold text-black/45">{steps.filter((s) => s.done).length} of {steps.length} complete</div></div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">{steps.map((step) => { const Icon = step.icon; return <button type="button" key={step.id} onClick={() => setTab(step.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${tab === step.id ? "border-[#11110f] bg-[#11110f] text-white" : "border-black/10 bg-[#fafaf8] hover:border-black/25"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${step.done ? "bg-emerald-100 text-emerald-700" : tab === step.id ? "bg-white/10 text-[#e9c78d]" : "bg-black/5 text-black/45"}`}>{step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><span><span className="block text-xs font-bold">{step.label}</span><span className={`mt-0.5 block text-[11px] ${tab === step.id ? "text-white/45" : "text-black/40"}`}>{step.done ? "Complete" : "Needs setup"}</span></span></button>; })}</div>

          {notice ? <div className={`mt-5 rounded-xl border px-3.5 py-3 text-sm ${notice.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{notice.text}</div> : null}

          {tab === "overview" ? <OverviewPanel tenant={tenant} setup={setup} onTab={setTab} onLaunch={launch} busy={busy} /> : null}
          {tab === "brand" ? <BrandPanel brand={brand} setBrand={setBrand} onSave={saveBrand} busy={busy} /> : null}
          {tab === "data" ? <FirestorePanel tenantId={tenant.id} tenantSlug={tenant.slug} values={firestore} setValues={setFirestore} onConnect={connectFirestore} busy={busy} connected={setup.firestoreConnected} oauthConnected={setup.firestoreAuthMode === "oauth"} oauthConfigured={oauthConfigured} oauthReturnTo={oauthReturnTo} /> : null}
          {tab === "domain" ? <DomainPanel domain={domain} setDomain={setDomain} current={setup.domain} onSave={saveDomain} onVerify={verifyDomain} busy={busy} /> : null}
        </div>

        <aside className="space-y-4"><div className="rounded-[24px] bg-[#11110f] p-6 text-white"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9c78d] text-[#11110f]"><ShieldCheck className="h-5 w-5" /></div><h3 className="mt-5 font-display text-xl font-bold">Safe by default</h3><p className="mt-2 text-sm leading-6 text-white/50">Your Firestore OAuth refresh token or service-account credential is encrypted before it is stored. It is only used by this store and never returned to the browser.</p><div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#e9c78d]"><KeyRound className="h-3.5 w-3.5" /> Tenant-scoped credentials</div></div><div className="rounded-[24px] border border-black/10 bg-white p-6"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Public URL</div><Link href={`/store/${tenant.slug}`} target="_blank" className="mt-3 block truncate text-sm font-bold hover:underline">aurelia.app/store/{tenant.slug} <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></Link><p className="mt-2 text-xs leading-5 text-black/45">Connect a custom domain when the site is ready for customers.</p></div></aside>
      </div>
    </div>
  );
}

function OverviewPanel({ tenant, setup, onTab, onLaunch, busy }: { tenant: Tenant; setup: Setup; onTab: (tab: "overview" | "data" | "brand" | "domain") => void; onLaunch: () => void; busy: boolean }) {
  const ready = setup.firestoreConnected;
  return <div className="mt-8"><div className="rounded-2xl bg-[#f7f7f5] p-5 sm:p-6"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9c78d] text-[#11110f]"><Rocket className="h-4 w-4" /></div><div><h3 className="font-bold">Your store is {tenant.status === "active" ? "live" : "almost ready"}</h3><p className="mt-1 text-sm leading-6 text-black/55">{ready ? "Firestore is connected. Add your brand details and link a domain whenever you’re ready." : "Connect Firestore before launch. This keeps catalogue, order and customer data real from day one."}</p></div></div></div><div className="mt-5 space-y-2"><button type="button" onClick={() => onTab("brand")} className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-black/30"><Palette className="h-4 w-4 text-[#9b682d]" /><span className="flex-1"><span className="block text-sm font-bold">Set your visual identity</span><span className="mt-0.5 block text-xs text-black/45">Logo, tagline and brand colours</span></span><ArrowRight className="h-4 w-4 text-black/30" /></button><button type="button" onClick={() => onTab("data")} className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-black/30"><Cloud className="h-4 w-4 text-[#536dce]" /><span className="flex-1"><span className="block text-sm font-bold">Connect your real database</span><span className="mt-0.5 block text-xs text-black/45">Test Firebase Firestore read and write access</span></span>{setup.firestoreConnected ? <Check className="h-4 w-4 text-emerald-600" /> : <ArrowRight className="h-4 w-4 text-black/30" />}</button><button type="button" onClick={() => onTab("domain")} className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-black/30"><Globe2 className="h-4 w-4 text-emerald-600" /><span className="flex-1"><span className="block text-sm font-bold">Link your domain</span><span className="mt-0.5 block text-xs text-black/45">Use yourbrand.com for the customer-facing site</span></span><ArrowRight className="h-4 w-4 text-black/30" /></button></div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5"><div className="flex items-center gap-2 text-xs text-black/45"><Code2 className="h-4 w-4" /> Plugins can be configured from Store admin</div><button type="button" onClick={onLaunch} disabled={busy || !ready || tenant.status === "active"} className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-35">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{tenant.status === "active" ? "Store is live" : "Launch store"}</button></div></div>;
}

function BrandPanel({ brand, setBrand, onSave, busy }: { brand: { name: string; tagline: string; logoUrl: string; primaryColor: string; accentColor: string }; setBrand: (v: typeof brand) => void; onSave: () => void; busy: boolean }) {
  return <div className="mt-8"><PanelHeading icon={<Palette className="h-5 w-5" />} title="Brand identity" description="These details shape your public storefront. You can refine the rest from the admin Content area." /><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Store name"><input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} className="field" /></Field><Field label="Logo URL"><input value={brand.logoUrl} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })} placeholder="https://cdn.example.com/logo.svg" className="field" /></Field><Field label="Tagline" wide><input value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} className="field" /></Field><Field label="Primary colour"><div className="flex items-center gap-2"><input type="color" value={brand.primaryColor} onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })} className="h-11 w-12 rounded-xl border border-black/10 bg-white p-1" /><input value={brand.primaryColor} onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })} className="field" /></div></Field><Field label="Accent colour"><div className="flex items-center gap-2"><input type="color" value={brand.accentColor} onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })} className="h-11 w-12 rounded-xl border border-black/10 bg-white p-1" /><input value={brand.accentColor} onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })} className="field" /></div></Field></div><ActionButton onClick={onSave} busy={busy} icon={<Save className="h-4 w-4" />}>Save brand</ActionButton></div>;
}

function FirestorePanel({ tenantId, tenantSlug, values, setValues, onConnect, busy, connected, oauthConnected, oauthConfigured, oauthReturnTo }: { tenantId: string; tenantSlug: string; values: FirestoreInput; setValues: (v: FirestoreInput) => void; onConnect: () => void; busy: boolean; connected: boolean; oauthConnected: boolean; oauthConfigured: boolean; oauthReturnTo?: string }) {
  return <div className="mt-8"><PanelHeading icon={<Cloud className="h-5 w-5" />} title="Connect Firestore" description="Use Google OAuth or a Firebase service account. We test read and write access before enabling launch and encrypt credentials at rest." />
    {oauthConnected ? <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs leading-5 text-emerald-800"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Google OAuth is connected for this store. Reconnect below to change the authorized Google account.</div> : null}
    <div className="mt-7 grid gap-5 sm:grid-cols-2">
      <Field label="Google Cloud project ID" help="Find this in Firebase Project settings. It must be the project where this store's Firestore database lives."><input value={values.projectId} onChange={(e) => setValues({ ...values, projectId: e.target.value })} placeholder="my-commerce-project" className="field" /></Field>
      <Field label="Firestore database ID" help="Usually (default). Use the exact database ID if the project has multiple Firestore databases."><input value={values.databaseId} onChange={(e) => setValues({ ...values, databaseId: e.target.value })} placeholder="(default)" className="field" /></Field>
      <Field label="Service account client email" wide help="Only needed for the manual service-account path. Leave it empty when using Google OAuth."><input value={values.clientEmail} onChange={(e) => setValues({ ...values, clientEmail: e.target.value })} placeholder="firebase-adminsdk@project.iam.gserviceaccount.com" className="field" autoComplete="off" /></Field>
      <Field label="Private key" wide help="Only needed for the manual service-account path. Keep the BEGIN/END lines, or use OAuth to avoid a private key."><textarea value={values.privateKey} onChange={(e) => setValues({ ...values, privateKey: e.target.value })} placeholder="-----BEGIN PRIVATE KEY-----\n..." rows={5} className="field resize-y font-mono text-xs" autoComplete="off" /></Field>
      <Field label="Collection prefix" help="Your store slug is added automatically so stores never share collections."><input value={values.collectionPrefix} onChange={(e) => setValues({ ...values, collectionPrefix: e.target.value })} className="field" /></Field>
    </div>
    <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#eef3ff] px-3.5 py-3 text-xs leading-5 text-[#536dce]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Google OAuth grants access to the account you choose. The manual path uses a least-privilege service account. In both cases the test writes only a temporary connection marker to this store&apos;s namespaced Firestore collection.</div>
    <div className="flex flex-wrap gap-3">
      <ActionButton onClick={onConnect} busy={busy} icon={connected ? <Check className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}>{connected ? "Re-test & save connection" : "Test & connect Firestore"}</ActionButton>
      {oauthConfigured ? <form action={connectWorkspaceFirestoreOAuth.bind(null, tenantId, oauthReturnTo ?? `/platform/stores/${tenantSlug}`)}><input type="hidden" name="projectId" value={values.projectId} /><button type="submit" disabled={busy || !values.projectId} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[#536dce]/25 bg-[#eef3ff] px-4 py-3 text-sm font-bold text-[#536dce] transition hover:border-[#536dce]/50 disabled:cursor-not-allowed disabled:opacity-45"><span className="font-black">G</span> {oauthConnected ? "Reconnect with Google" : "Connect with Google OAuth"}</button></form> : <p className="mt-7 text-xs text-black/40">Google OAuth is not configured on this deployment. Use the manual service-account path or ask the platform administrator to add Google OAuth credentials.</p>}
    </div>
  </div>;
}

function DomainPanel({ domain, setDomain, current, onSave, onVerify, busy }: { domain: string; setDomain: (v: string) => void; current: Setup["domain"]; onSave: () => void; onVerify: () => void; busy: boolean }) {
  return <div className="mt-8"><PanelHeading icon={<Globe2 className="h-5 w-5" />} title="Connect a custom domain" description="Customers can use your own domain instead of the Aurelia URL." />
    {current ? <div className="mt-6 rounded-2xl border border-black/10 bg-[#fafaf8] p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-bold">{current.hostname}</div><div className="mt-1 flex items-center gap-2 text-xs text-black/45"><span className={`h-1.5 w-1.5 rounded-full ${current.status === "verified" ? "bg-emerald-500" : "bg-amber-500"}`} />{current.status === "verified" ? "Verified and serving" : "Awaiting DNS verification"}</div></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">{current.status}</span></div>{current.status === "pending" ? <div className="mt-4 border-t border-black/10 pt-4 text-xs leading-5 text-black/55"><div className="font-bold text-black/70">Add this DNS record at your provider</div><div className="mt-2 grid gap-2 sm:grid-cols-3"><div><span className="text-black/35">Type</span><div className="font-mono font-bold">CNAME</div></div><div><span className="text-black/35">Name</span><div className="font-mono font-bold">@</div></div><div><span className="text-black/35">Target</span><div className="truncate font-mono font-bold">aurelia.app</div></div></div><p className="mt-3 text-black/40">Verification will be enabled when DNS points to Aurelia. SSL is provisioned automatically.</p></div> : null}</div> : null}
    <div className="mt-6"><Field label="Your domain" help="Use the hostname only. After saving, create the displayed CNAME at your DNS provider and then run verification."><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="shop.yourbrand.com" className="field" /><p className="mt-1.5 text-[11px] text-black/40">Enter the hostname only; we’ll provide the DNS steps after saving.</p></Field></div>
    <div className="flex flex-wrap items-center gap-3"><ActionButton onClick={onSave} busy={busy} icon={<Globe2 className="h-4 w-4" />}>Save domain</ActionButton>{current?.status === "pending" ? <button type="button" onClick={onVerify} disabled={busy} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold transition hover:border-black/30 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Check DNS</button> : null}</div>
  </div>;
}

function PanelHeading({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3eadb] text-[#9b682d]">{icon}</div><div><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-1 max-w-xl text-sm leading-6 text-black/50">{description}</p></div></div>; }
function Field({ label, help, wide, children }: { label: string; help?: string; wide?: boolean; children: React.ReactNode }) { return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block text-xs font-bold text-black/65">{label}{help ? <HelpTip text={help} /> : null}</span>{children}</label>; }
function HelpTip({ text }: { text: string }) { return <span className="group relative inline-flex align-middle"><button type="button" aria-label="Show help" title={text} className="ml-1 inline-flex text-black/35 hover:text-black/70"><HelpCircle className="h-3.5 w-3.5" /></button><span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-lg bg-[#11110f] px-3 py-2 text-left text-[11px] font-normal leading-4 text-white shadow-lg group-hover:block group-focus-within:block">{text}</span></span>; }
function ActionButton({ onClick, busy, icon, children }: { onClick: () => void; busy: boolean; icon: React.ReactNode; children: React.ReactNode }) { return <button type="button" onClick={onClick} disabled={busy} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}{busy ? "Saving…" : children}</button>; }
