import { notFound } from "next/navigation";
import Link from "next/link";
import { pluginById } from "@/lib/plugins/registry";
import { getPluginState } from "@/lib/plugins/store";
import { PluginEditor } from "@/components/admin/PluginEditor";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import { FirestorePanel } from "@/components/admin/FirestorePanel";
import { firestoreStatus, localCounts } from "@/lib/plugins/firestore";
import { isGoogleOAuthConfigured, isOAuthConnected } from "@/lib/plugins/oauth";
import { isPluginSecretKey } from "@/lib/plugins/store";

export default async function PluginPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ oauth?: string; oauth_error?: string }> }) {
  const def = pluginById((await params).id);
  const query = await searchParams;
  if (!def) notFound();
  const state = getPluginState(def.id);
  const h = await headers();
  const siteUrl = process.env.SITE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const masked = Object.fromEntries(Object.entries(state.config).map(([k, v]) => [k, isPluginSecretKey(def, k) ? "" : v]));
  const hasSecret = Object.fromEntries(def.fields.filter((f) => isPluginSecretKey(def, f.key)).map((f) => [f.key, !!state.config[f.key]]));
  return (
    <div>
      <Link href="/admin/plugins" className="text-sm text-gray-500 hover:text-black inline-flex items-center gap-1 mb-3"><ArrowLeft className="h-3.5 w-3.5" /> Plugins</Link>
      {query.oauth_error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">Google connection could not be completed: {query.oauth_error}</div> : null}
      {query.oauth === "connected" ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">Google OAuth connected. Test the current configuration before enabling the plugin.</div> : null}
      <PluginEditor def={def} enabled={state.enabled} config={masked} hasSecret={hasSecret} lastTest={{ at: state.lastTestAt, ok: state.lastTestOk, message: state.lastTestMessage }} siteUrl={siteUrl} oauthConnected={isOAuthConnected(def.id, state.config)} oauthEmail={state.config.oauthEmail} oauthConfigured={isGoogleOAuthConfigured()} />
      {def.id === "firestore" && <div className="mt-6 lg:max-w-[calc(100%-404px)]"><FirestorePanel enabled={state.enabled} counts={localCounts()} lastFullSync={(await firestoreStatus())?.lastFullSync ?? null} /></div>}
    </div>
  );
}
