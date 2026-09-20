"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { firestoreFullSync, firestoreRestore } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { CloudUpload, CloudDownload, Loader2 } from "lucide-react";

export function FirestorePanel({ enabled, counts, lastFullSync }: { enabled: boolean; counts: Record<string, number>; lastFullSync: string | null }) {
  const [busy, setBusy] = useState<"sync" | "restore" | null>(null);
  const toast = useToast(); const router = useRouter();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="card p-5 space-y-4">
      <div><h2 className="font-semibold">Data sync</h2><p className="text-xs text-gray-500 mt-1">Writes are mirrored to Firestore in real time while enabled. Use a full sync after enabling for the first time, and restore on a fresh server.</p></div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">{Object.entries(counts).filter(([, n]) => n > 0).map(([t, n]) => <div key={t} className="rounded-lg bg-gray-50 p-2"><div className="text-lg font-semibold">{n}</div><div className="text-[10px] text-gray-500">{t}</div></div>)}</div>
      <div className="text-xs text-gray-500">{total} local rows · last full sync: {lastFullSync ? new Date(lastFullSync).toLocaleString() : "never"}</div>
      <div className="flex flex-wrap gap-2">
        <button disabled={!enabled || !!busy} onClick={async () => { setBusy("sync"); notify(toast, await firestoreFullSync()); setBusy(null); router.refresh(); }} className="btn-primary">{busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />} Sync everything to Firestore</button>
        <button disabled={!enabled || !!busy} onClick={async () => { if (!confirm("This will overwrite local rows with the same IDs using Firestore data. Continue?")) return; setBusy("restore"); notify(toast, await firestoreRestore()); setBusy(null); router.refresh(); }} className="btn-outline">{busy === "restore" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />} Restore from Firestore</button>
      </div>
      {!enabled && <p className="text-xs text-amber-700">Enable the plugin (after a successful test) to unlock sync actions.</p>}
    </div>
  );
}
