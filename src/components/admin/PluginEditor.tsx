"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PluginDef } from "@/lib/plugins/registry";
import { updatePlugin, testPlugin, purgeCloudflare } from "@/actions/admin";
import { connectPluginOAuth, disconnectOAuth } from "@/actions/oauth";
import { useToast, notify } from "@/components/ui/Toast";
import { CheckCircle2, XCircle, ExternalLink, Copy, HelpCircle, Loader2, Unplug } from "lucide-react";

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label="Show help" title={text} className="ml-1 inline-flex text-gray-400 hover:text-gray-700">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-lg bg-gray-900 px-3 py-2 text-left text-[11px] font-normal leading-4 text-white shadow-lg group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

export function PluginEditor({
  def,
  enabled,
  config,
  hasSecret,
  lastTest,
  siteUrl,
  oauthConnected = false,
  oauthEmail,
  oauthConfigured = false,
}: {
  def: PluginDef;
  enabled: boolean;
  config: Record<string, string>;
  hasSecret: Record<string, boolean>;
  lastTest: { at: string | null; ok: boolean | null; message: string | null };
  siteUrl: string;
  oauthConnected?: boolean;
  oauthEmail?: string;
  oauthConfigured?: boolean;
}) {
  const [c, setC] = useState<Record<string, string>>(config);
  const [on, setOn] = useState(enabled);
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const save = (nextEnabled?: boolean) => start(async () => {
    const r = await updatePlugin(def.id, { enabled: nextEnabled ?? on, config: c });
    notify(toast, r);
    if (r.ok) {
      if (nextEnabled != null) setOn(nextEnabled);
      router.refresh();
    } else if (nextEnabled != null) setOn(!nextEnabled);
  });

  const test = async () => {
    setTesting(true);
    const r = await testPlugin(def.id, c);
    setTesting(false);
    notify(toast, r);
    router.refresh();
  };

  const disconnect = () => start(async () => {
    const r = await disconnectOAuth(def.id);
    notify(toast, r);
    if (r.ok) router.refresh();
  });

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast("Copied");
  };
  const webhook = def.id === "razorpay" ? `${siteUrl}/api/webhooks/razorpay` : def.id === "cashfree" ? `${siteUrl}/api/webhooks/cashfree` : def.id === "shiprocket" ? `${siteUrl}/api/webhooks/shiprocket` : null;
  const oauthReturnTo = `/admin/plugins/${def.id}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{def.icon}</span>
            <div className="flex-1"><h1 className="text-xl font-semibold">{def.name}</h1><p className="mt-1 text-sm text-gray-600">{def.description}</p><a href={def.docsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 underline">Provider documentation <ExternalLink className="h-3 w-3" /></a></div>
            <label className="flex cursor-pointer select-none items-center gap-2">
              <span className={`text-sm font-medium ${on ? "text-green-700" : "text-gray-400"}`}>{on ? "Enabled" : "Disabled"}</span>
              <button type="button" role="switch" aria-checked={on} disabled={pending} onClick={() => { const n = !on; setOn(n); save(n); }} className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-green-600" : "bg-gray-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "left-0 translate-x-5" : "left-0.5"}`} /></button>
            </label>
          </div>
        </div>

        {def.oauth ? (
          <div className="card border-blue-100 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">G</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{def.oauth.label}</h2>{oauthConnected ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">Connected</span> : null}</div>
                <p className="mt-1 text-xs leading-5 text-gray-600">{def.oauth.description}</p>
                {oauthConnected ? <p className="mt-2 text-xs text-green-800">Authorized account: <b>{oauthEmail || "Google account"}</b></p> : null}
                {!oauthConfigured ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">OAuth is not enabled on this deployment yet. An administrator must configure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code>, then add this callback URL to the Google OAuth client: <code>{siteUrl}/api/oauth/google/callback</code>.</p> : null}
                {def.id === "firestore" && !c.projectId ? <p className="mt-3 text-xs font-semibold text-amber-800">Save the Firebase project ID below before connecting Google Cloud.</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {!oauthConnected ? <form action={connectPluginOAuth.bind(null, def.id, oauthReturnTo)}>{def.id === "firestore" ? <input type="hidden" name="projectId" value={c.projectId ?? ""} /> : null}<button type="submit" disabled={!oauthConfigured || pending || (def.id === "firestore" && !c.projectId)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">Connect with Google <ExternalLink className="h-3.5 w-3.5" /></button></form> : <button type="button" onClick={disconnect} disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-800 transition hover:border-blue-400 disabled:opacity-50">{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />} Disconnect OAuth</button>}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:border-blue-400">OAuth setup help <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="card space-y-4 p-5">
          <div><h2 className="font-semibold">Configuration</h2><p className="mt-1 text-xs text-gray-500">Values marked with a help icon explain where to find them. Secrets remain masked after saving.</p></div>
          {def.fields.map((f) => {
            const oauthOptional = !!(oauthConnected && def.oauth?.bypassRequired?.includes(f.key));
            return <div key={f.key}>
              <label className="label">{f.label}{f.required && !oauthOptional && <span className="text-red-500"> *</span>}<HelpTip text={f.help ?? "See the setup guide on this page for the provider process and required permissions."} /></label>
              {f.type === "select" ? <select value={c[f.key] ?? f.options?.[0]} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} className="input">{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : f.type === "toggle" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c[f.key] === "true"} onChange={(e) => setC({ ...c, [f.key]: String(e.target.checked) })} /> Yes</label>
                : f.type === "textarea" ? <textarea value={c[f.key] ?? ""} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} rows={f.key === "privateKey" ? 6 : 3} className="input font-mono text-xs" placeholder={f.key === "privateKey" && hasSecret[f.key] ? "•••••••• (saved — leave blank to keep)" : f.placeholder} />
                : <input type={f.type === "password" ? "password" : "text"} value={c[f.key] ?? ""} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} placeholder={f.type === "password" && hasSecret[f.key] ? "•••••••• (saved — leave blank to keep)" : f.placeholder} className="input font-mono text-sm" autoComplete="off" />}
            </div>;
          })}
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={() => save()} disabled={pending} className="btn-primary">Save configuration</button>
            {def.canTest && <button type="button" onClick={test} disabled={testing || pending} className="btn-outline">{testing ? <><Loader2 className="h-4 w-4 animate-spin" /> Testing…</> : def.id === "smtp" ? "Send test email" : "Test connection"}</button>}
            {def.id === "cloudflare" && <button type="button" onClick={() => start(async () => notify(toast, await purgeCloudflare()))} disabled={pending} className="btn-outline">Purge cache</button>}
          </div>
          {lastTest.at && <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${lastTest.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{lastTest.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <XCircle className="mt-0.5 h-4 w-4" />}<div><div>{lastTest.message}</div><div className="text-xs opacity-70">{new Date(lastTest.at).toLocaleString()}</div></div></div>}
        </div>

        {webhook && (
          <div className="card p-5">
            <h2 className="mb-2 font-semibold">Webhook URL</h2>
            <p className="mb-2 text-xs text-gray-500">{def.id === "shiprocket" ? "Add this in Shiprocket → Settings → API → Webhooks (header x-api-key = your Webhook token) so tracking updates flow back automatically." : `Add this in your ${def.name} dashboard so payments are confirmed even if the customer closes the browser.`}</p>
            <div className="flex gap-2"><code className="input flex-1 overflow-x-auto bg-gray-50 font-mono text-xs">{webhook}</code><button type="button" onClick={() => copy(webhook)} className="btn-outline"><Copy className="h-4 w-4" /></button></div>
          </div>
        )}
      </div>
      <div className="card h-fit p-5">
        <h2 className="mb-3 font-semibold">Setup guide</h2>
        <ol className="space-y-3 text-sm">{def.setupSteps.map((st, i) => <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs text-white">{i + 1}</span><span className="text-gray-700">{st.replace("{SITE_URL}", siteUrl)}</span></li>)}</ol>
        {def.oauth ? <div className="mt-4 border-t pt-4"><h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">OAuth permissions</h3><p className="mt-2 text-xs leading-5 text-gray-600">Google will show consent for:</p><ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-gray-600">{def.oauth.scopes.map((scope) => <li key={scope} className="break-all">{scope}</li>)}</ul></div> : null}
        {def.id === "cloudflare" && <p className="mt-4 border-t pt-3 text-xs text-gray-500">Full deployment instructions are in <code>DEPLOY.md</code> in the project root.</p>}
      </div>
    </div>
  );
}
