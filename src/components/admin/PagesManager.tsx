"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Page } from "@/lib/db/schema";
import { savePage, deletePage } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/format";
type F = { title: string; slug: string; content: string; published: boolean; showInFooter: boolean };
const empty: F = { title: "", slug: "", content: "<p></p>", published: true, showInFooter: true };
export function PagesManager({ pages }: { pages: Page[] }) {
  const [editing, setEditing] = useState<string | null | "new">(null);
  const [f, setF] = useState<F>(empty);
  const [pending, start] = useTransition(); const toast = useToast(); const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { const r = await fn(); notify(toast, r); if (r.ok) router.refresh(); });
  const open = (p?: Page) => { setF(p ? { title: p.title, slug: p.slug, content: p.content, published: p.published, showInFooter: p.showInFooter } : empty); setEditing(p?.id ?? "new"); };
  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      <div className="card h-fit">
        <div className="p-3 border-b flex justify-end"><button onClick={() => open()} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> New page</button></div>
        <ul className="divide-y">{pages.map((p) => <li key={p.id}><button onClick={() => open(p)} className={`w-full text-left p-3 hover:bg-gray-50 ${editing === p.id ? "bg-gray-50" : ""}`}><div className="font-medium text-sm">{p.title} {!p.published && <span className="badge bg-gray-200 text-gray-600 ml-1">draft</span>}</div><div className="text-xs text-gray-400">/pages/{p.slug} · {formatDate(p.updatedAt)}</div></button></li>)}</ul>
      </div>
      {editing ? (
        <div className="card p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3"><div><label className="label">Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="input" /></div><div><label className="label">Slug</label><input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="input font-mono text-xs" placeholder="auto from title" /></div></div>
          <div><label className="label">Content (HTML)</label><textarea value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} rows={16} className="input font-mono text-xs" /></div>
          <div className="flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Published</label><label className="flex items-center gap-2"><input type="checkbox" checked={f.showInFooter} onChange={(e) => setF({ ...f, showInFooter: e.target.checked })} /> Show in footer</label></div>
          <div className="flex gap-2 pt-2">
            <button disabled={pending || !f.title} onClick={() => run(() => savePage(editing === "new" ? null : editing, f))} className="btn-primary">Save page</button>
            {editing !== "new" && <><a href={`/pages/${f.slug}`} target="_blank" className="btn-outline"><ExternalLink className="h-3.5 w-3.5" /> Preview</a><button onClick={() => confirm("Delete this page?") && run(async () => { const r = await deletePage(editing); setEditing(null); return r; })} className="btn-ghost text-red-600 ml-auto"><Trash2 className="h-4 w-4" /> Delete</button></>}
          </div>
          <div className="border-t pt-4"><div className="label">Preview</div><div className="prose-store border rounded-lg p-4 bg-gray-50 max-h-64 overflow-auto" dangerouslySetInnerHTML={{ __html: f.content }} /></div>
        </div>
      ) : <div className="card p-16 text-center text-gray-500">Select a page to edit or create a new one</div>}
    </div>
  );
}
