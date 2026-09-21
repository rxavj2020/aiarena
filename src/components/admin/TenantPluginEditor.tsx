"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, HelpCircle, KeyRound, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { updateStorePlugin, testStorePlugin } from "@/actions/tenant-plugins";
import type { PluginDef } from "@/lib/plugins/registry";
import type { TenantPluginState } from "@/lib/tenant-plugins";

export function TenantPluginEditor({ tenantId, def, initialState, initialConfig, hasSecret }: { tenantId: string; def: PluginDef; initialState: TenantPluginState; initialConfig: Record<string, string>; hasSecret: Record<string, boolean> }) {
  const router = useRouter();
  const [config, setConfig] = useState({ ...initialConfig });
  const [enabled, setEnabled] = useState(initialState.enabled);
  const [state, setState] = useState(initialState);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);

  function notify(result: { ok: boolean; message?: string; error?: string }) {
    setNotice({ ok: result.ok, text: result.ok ? result.message ?? "Saved" : result.error ?? "Something went wrong" });
    if (result.ok) router.refresh();
  }

  function save(nextEnabled = enabled) {
    setNotice(null);
    start(async () => {
      const result = await updateStorePlugin(tenantId, def.id, { enabled: nextEnabled, config });
      notify(result);
      if (result.ok) setEnabled(nextEnabled);
    });
  }

  function test() {
    setNotice(null);
    setTesting(true);
    testStorePlugin(tenantId, def.id, config).then((result) => {
      notify(result);
      if (result.ok) setState({ ...state, lastTestAt: new Date().toISOString(), lastTestOk: true, lastTestMessage: result.message ?? null });
      else setState({ ...state, lastTestAt: new Date().toISOString(), lastTestOk: false, lastTestMessage: result.error });
    }).finally(() => setTesting(false));
  }

  function toggle() {
    const next = !enabled;
    if (!next) { setEnabled(false); save(false); return; }
    setEnabled(true);
    save(true);
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <Link href="/admin/plugins" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-black/45 hover:text-black"><ArrowLeft className="h-4 w-4" /> All integrations</Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-[22px] border border-black/10 bg-white p-5 sm:p-6"><div className="flex items-start gap-4"><span className="text-4xl">{def.icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl font-bold">{def.name}</h1><span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 text-[10px] font-bold text-[#536dce]"><ShieldCheck className="h-3 w-3" /> Private to this store</span></div><p className="mt-2 text-sm leading-6 text-black/55">{def.description}</p><a href={def.docsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-black/50 underline">Provider documentation <ExternalLink className="h-3 w-3" /></a></div><div className="flex items-center gap-2"><span className={`text-xs font-bold ${enabled ? "text-emerald-700" : "text-black/35"}`}>{enabled ? "Enabled" : "Disabled"}</span><button type="button" role="switch" aria-checked={enabled} disabled={pending} onClick={toggle} className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-black/15"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "left-0 translate-x-5" : "left-0.5"}`} /></button></div></div></section>

          {notice ? <div className={`rounded-xl border px-4 py-3 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{notice.text}</div> : null}
          <section className="rounded-[22px] border border-black/10 bg-white p-5 sm:p-6"><div><h2 className="font-display text-xl font-bold">Connection details</h2><p className="mt-1 text-xs leading-5 text-black/45">Credentials are encrypted before they are stored for {def.name}. Secret fields stay blank after saving; leaving one blank keeps the existing value.</p></div><div className="mt-6 space-y-4">{def.fields.map((field) => <label key={field.key} className="block"><span className="mb-1.5 block text-xs font-bold text-black/65">{field.label}{field.required ? <span className="text-red-500"> *</span> : null}<HelpTip text={field.help ?? "Use the provider setup guide on this page to find this value."} /></span>{field.type === "select" ? <select value={config[field.key] ?? field.options?.[0] ?? ""} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} className="field">{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === "toggle" ? <span className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config[field.key] === "true"} onChange={(e) => setConfig({ ...config, [field.key]: String(e.target.checked) })} /> Yes</span> : field.type === "textarea" ? <textarea value={config[field.key] ?? ""} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} rows={field.key === "privateKey" ? 6 : 3} className="field resize-y font-mono text-xs" placeholder={isSecretField(def, field.key) && hasSecret[field.key] ? "Saved secret — leave blank to keep" : field.placeholder} autoComplete="off" /> : <input type={field.type === "password" ? "password" : "text"} value={config[field.key] ?? ""} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} className="field" placeholder={isSecretField(def, field.key) && hasSecret[field.key] ? "Saved secret — leave blank to keep" : field.placeholder} autoComplete="off" />}</label>)}</div><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => save(enabled)} disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-4 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save configuration</button>{def.canTest ? <button type="button" onClick={test} disabled={testing || pending} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold transition hover:border-black/30 disabled:opacity-50">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {testing ? "Testing…" : "Test connection"}</button> : null}</div>{state.lastTestAt ? <div className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs ${state.lastTestOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{state.lastTestOk ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}<div><div>{state.lastTestMessage}</div><div className="mt-1 opacity-60">{new Date(state.lastTestAt).toLocaleString()}</div></div></div> : null}</section>
        </div>
        <aside className="h-fit rounded-[22px] border border-black/10 bg-white p-5 sm:p-6"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35"><KeyRound className="h-4 w-4" /> Guided setup</div><h2 className="mt-3 font-display text-xl font-bold">Connect {def.name}</h2><ol className="mt-5 space-y-4">{def.setupSteps.map((step, index) => <li key={index} className="flex gap-3 text-sm leading-5 text-black/60"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#11110f] text-xs font-bold text-white">{index + 1}</span><span>{step}</span></li>)}</ol><div className="mt-6 border-t border-black/10 pt-4 text-xs leading-5 text-black/45">Run a successful test with the current values before enabling this connection. Changing a secret or provider value requires a fresh test.</div></aside>
      </div>
    </div>
  );
}

function isSecretField(def: PluginDef, key: string) {
  const secretKeys = new Set(["oauthAccessToken", "oauthRefreshToken", "clientSecret", "accessToken", "refreshToken", "privateKey", "secretKey", "secretAccessKey", "keySecret", "webhookSecret", "webhookToken", "password", "pass", "apiToken"]);
  return secretKeys.has(key) || def.fields.some((field) => field.key === key && field.type === "password");
}

function HelpTip({ text }: { text: string }) {
  return <span className="group relative inline-flex align-middle"><button type="button" aria-label="Show help" title={text} className="ml-1 inline-flex text-black/35 hover:text-black/70"><HelpCircle className="h-3.5 w-3.5" /></button><span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-lg bg-[#11110f] px-3 py-2 text-left text-[11px] font-normal leading-4 text-white shadow-lg group-hover:block group-focus-within:block">{text}</span></span>;
}
