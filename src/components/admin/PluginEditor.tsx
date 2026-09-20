"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PluginDef } from "@/lib/plugins/registry";
import { updatePlugin, testPlugin, purgeCloudflare } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { CheckCircle2, XCircle, ExternalLink, Copy, Loader2 } from "lucide-react";

export function PluginEditor({ def, enabled, config, hasSecret, lastTest, siteUrl }: { def: PluginDef; enabled: boolean; config: Record<string, string>; hasSecret: Record<string, boolean>; lastTest: { at: string | null; ok: boolean | null; message: string | null }; siteUrl: string }) {
  const [c, setC] = useState<Record<string, string>>(config);
  const [on, setOn] = useState(enabled);
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);
  const toast = useToast(); const router = useRouter();

  const save = (nextEnabled?: boolean) => start(async () => {
    const r = await updatePlugin(def.id, { enabled: nextEnabled ?? on, config: c });
    notify(toast, r);
    if (r.ok) { if (nextEnabled != null) setOn(nextEnabled); router.refresh(); } else if (nextEnabled != null) setOn(!nextEnabled);
  });
  const test = async () => { setTesting(true); const r = await testPlugin(def.id, c); setTesting(false); notify(toast, r); router.refresh(); };
  const copy = (t: string) => { navigator.clipboard.writeText(t); toast("Copied"); };
  const webhook = def.id === "razorpay" ? `${siteUrl}/api/webhooks/razorpay` : def.id === "cashfree" ? `${siteUrl}/api/webhooks/cashfree` : null;

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{def.icon}</span>
            <div className="flex-1"><h1 className="text-xl font-semibold">{def.name}</h1><p className="text-sm text-gray-600 mt-1">{def.description}</p><a href={def.docsUrl} target="_blank" rel="noreferrer" className="text-xs underline text-gray-500 mt-2 inline-flex items-center gap-1">Get credentials <ExternalLink className="h-3 w-3" /></a></div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className={`text-sm font-medium ${on ? "text-green-700" : "text-gray-400"}`}>{on ? "Enabled" : "Disabled"}</span>
              <button role="switch" aria-checked={on} disabled={pending} onClick={() => { const n = !on; setOn(n); save(n); }} className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-green-600" : "bg-gray-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5.5 left-0" : "left-0.5"}`} /></button>
            </label>
          </div>
        </div>
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Configuration</h2>
          {def.fields.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
              {f.type === "select" ? <select value={c[f.key] ?? f.options?.[0]} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} className="input">{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : f.type === "toggle" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c[f.key] === "true"} onChange={(e) => setC({ ...c, [f.key]: String(e.target.checked) })} /> Yes</label>
                : f.type === "textarea" ? <textarea value={c[f.key] ?? ""} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} rows={3} className="input" />
                : <input type={f.type === "password" ? "password" : "text"} value={c[f.key] ?? ""} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} placeholder={f.type === "password" && hasSecret[f.key] ? "•••••••• (saved — leave blank to keep)" : f.placeholder} className="input font-mono text-sm" autoComplete="off" />}
              {f.help && <p className="text-xs text-gray-500 mt-1">{f.help}</p>}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={() => save()} disabled={pending} className="btn-primary">Save configuration</button>
            {def.canTest && <button onClick={test} disabled={testing} className="btn-outline">{testing ? <><Loader2 className="h-4 w-4 animate-spin" /> Testing…</> : def.id === "smtp" ? "Send test email" : "Test connection"}</button>}
            {def.id === "cloudflare" && <button onClick={() => start(async () => notify(toast, await purgeCloudflare()))} disabled={pending} className="btn-outline">Purge cache</button>}
          </div>
          {lastTest.at && <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${lastTest.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{lastTest.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <XCircle className="h-4 w-4 mt-0.5" />}<div><div>{lastTest.message}</div><div className="text-xs opacity-70">{new Date(lastTest.at).toLocaleString()}</div></div></div>}
        </div>
        {webhook && (
          <div className="card p-5">
            <h2 className="font-semibold mb-2">Webhook URL</h2>
            <p className="text-xs text-gray-500 mb-2">Add this in your {def.name} dashboard so payments are confirmed even if the customer closes the browser.</p>
            <div className="flex gap-2"><code className="input font-mono text-xs bg-gray-50 flex-1 overflow-x-auto">{webhook}</code><button onClick={() => copy(webhook)} className="btn-outline"><Copy className="h-4 w-4" /></button></div>
          </div>
        )}
      </div>
      <div className="card p-5 h-fit">
        <h2 className="font-semibold mb-3">Setup guide</h2>
        <ol className="space-y-3 text-sm">{def.setupSteps.map((st, i) => <li key={i} className="flex gap-3"><span className="h-6 w-6 shrink-0 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">{i + 1}</span><span className="text-gray-700">{st.replace("{SITE_URL}", siteUrl)}</span></li>)}</ol>
        {def.id === "cloudflare" && <p className="text-xs text-gray-500 mt-4 border-t pt-3">Full deployment instructions are in <code>DEPLOY.md</code> in the project root.</p>}
      </div>
    </div>
  );
}
