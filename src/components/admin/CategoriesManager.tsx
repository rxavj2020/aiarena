"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/db/schema";
import { saveCategory, deleteCategory } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { ImageUploader } from "./ImageUploader";
import { Pencil, Trash2, Plus } from "lucide-react";

type Form = { name: string; slug: string; description: string; image: string; parentId: string; sortOrder: number; featured: boolean };
const empty: Form = { name: "", slug: "", description: "", image: "", parentId: "", sortOrder: 0, featured: false };

export function CategoriesManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const [editing, setEditing] = useState<string | null | "new">(null);
  const [f, setF] = useState<Form>(empty);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { const r = await fn(); notify(toast, r); if (r.ok) { setEditing(null); router.refresh(); } });
  const open = (c?: Category) => { setF(c ? { name: c.name, slug: c.slug, description: c.description ?? "", image: c.image ?? "", parentId: c.parentId ?? "", sortOrder: c.sortOrder, featured: c.featured } : empty); setEditing(c?.id ?? "new"); };
  const roots = categories.filter((c) => !c.parentId);
  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      <div className="card">
        <div className="flex justify-between items-center p-4 border-b"><span className="text-sm text-gray-500">{categories.length} categories</span><button onClick={() => open()} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> New category</button></div>
        <ul className="divide-y">
          {roots.map((c) => (
            <li key={c.id}>
              <Row c={c} n={counts[c.id] ?? 0} onEdit={() => open(c)} onDelete={() => confirm(`Delete "${c.name}"? Products will be uncategorised.`) && run(() => deleteCategory(c.id))} />
              {categories.filter((x) => x.parentId === c.id).map((x) => <Row key={x.id} c={x} n={counts[x.id] ?? 0} child onEdit={() => open(x)} onDelete={() => confirm(`Delete "${x.name}"?`) && run(() => deleteCategory(x.id))} />)}
            </li>
          ))}
        </ul>
      </div>
      {editing && (
        <div className="card p-5 h-fit space-y-3">
          <h3 className="font-semibold">{editing === "new" ? "New category" : "Edit category"}</h3>
          <div><label className="label">Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" /></div>
          <div><label className="label">Slug</label><input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="input font-mono text-xs" placeholder="auto from name" /></div>
          <div><label className="label">Description</label><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className="input" /></div>
          <div><label className="label">Parent</label><select value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })} className="input"><option value="">— Top level —</option>{roots.filter((r) => r.id !== editing).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
          <div><label className="label">Image</label><ImageUploader value={f.image ? [f.image] : []} onChange={(v) => setF({ ...f, image: v[0] ?? "" })} multiple={false} folder="categories" /></div>
          <div className="flex gap-3 items-end"><div className="flex-1"><label className="label">Sort order</label><input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} className="input" /></div><label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Featured</label></div>
          <div className="flex gap-2 pt-2"><button disabled={pending || !f.name} onClick={() => run(() => saveCategory(editing === "new" ? null : editing, f))} className="btn-primary flex-1">Save</button><button onClick={() => setEditing(null)} className="btn-outline">Cancel</button></div>
        </div>
      )}
    </div>
  );
}
function Row({ c, n, child, onEdit, onDelete }: { c: Category; n: number; child?: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${child ? "pl-12 border-t border-gray-100" : ""}`}>
      <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden shrink-0">{c.image && <img src={c.image} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex-1 min-w-0"><div className="font-medium text-sm">{c.name} {c.featured && <span className="badge bg-amber-100 text-amber-800 ml-1">featured</span>}</div><div className="text-xs text-gray-400">/{c.slug} · {n} products</div></div>
      <button onClick={onEdit} className="btn-ghost p-1.5"><Pencil className="h-3.5 w-3.5" /></button>
      <button onClick={onDelete} className="btn-ghost p-1.5 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}
