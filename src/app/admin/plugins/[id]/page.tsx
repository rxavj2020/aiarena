import { notFound } from "next/navigation";
import Link from "next/link";
import { pluginById } from "@/lib/plugins/registry";
import { getPluginState } from "@/lib/plugins/store";
import { PluginEditor } from "@/components/admin/PluginEditor";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import { FirestorePanel } from "@/components/admin/FirestorePanel";
import { firestoreStatus, localCounts } from "@/lib/plugins/firestore";

export default async function PluginPage({ params }: { params: Promise<{ id: string }> }) {
  const def = pluginById((await params).id);
  if (!def) notFound();
  const state = getPluginState(def.id);
  const h = await headers();
  const siteUrl = process.env.SITE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const masked = Object.fromEntries(Object.entries(state.config).map(([k, v]) => [k, (def.fields.find((f) => f.key === k)?.type === "password" || k === "privateKey") ? "" : v]));
  const hasSecret = Object.fromEntries(def.fields.filter((f) => f.type === "password" || f.key === "privateKey").map((f) => [f.key, !!state.config[f.key]]));
  return (
    <div>
      <Link href="/admin/plugins" className="text-sm text-gray-500 hover:text-black inline-flex items-center gap-1 mb-3"><ArrowLeft className="h-3.5 w-3.5" /> Plugins</Link>
      <PluginEditor def={def} enabled={state.enabled} config={masked} hasSecret={hasSecret} lastTest={{ at: state.lastTestAt, ok: state.lastTestOk, message: state.lastTestMessage }} siteUrl={siteUrl} />
      {def.id === "firestore" && <div className="mt-6 lg:max-w-[calc(100%-404px)]"><FirestorePanel enabled={state.enabled} counts={localCounts()} lastFullSync={(await firestoreStatus())?.lastFullSync ?? null} /></div>}
    </div>
  );
}
