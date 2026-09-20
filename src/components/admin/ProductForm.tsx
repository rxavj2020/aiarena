"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, Variant, Category } from "@/lib/db/schema";
import { saveProduct, type ProductInput } from "@/actions/admin";
import { ImageUploader } from "./ImageUploader";
import { useToast, notify } from "@/components/ui/Toast";
import { ArrowLeft, Plus, X, Wand2 } from "lucide-react";
import { slugify } from "@/lib/utils";

type V = ProductInput["variants"][number];

export function ProductForm({ product: p, variants: initialVariants = [], categories }: { product?: Product; variants?: Variant[]; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [f, setF] = useState<ProductInput>({
    name: p?.name ?? "", slug: p?.slug ?? "", description: p?.description ?? "", shortDescription: p?.shortDescription ?? "",
    price: p ? p.price / 100 : 0, compareAtPrice: p?.compareAtPrice ? p.compareAtPrice / 100 : null, costPrice: p?.costPrice ? p.costPrice / 100 : null,
    sku: p?.sku ?? "", stock: p?.stock ?? 0, trackStock: p?.trackStock ?? true, status: p?.status ?? "active", images: p?.images ?? [],
    categoryId: p?.categoryId ?? "", featured: p?.featured ?? false, tags: p?.tags ?? [], options: p?.options ?? [],
    variants: initialVariants.map((v) => ({ id: v.id, title: v.title, optionValues: v.optionValues, price: v.price != null ? v.price / 100 : null, sku: v.sku, stock: v.stock, image: v.image })),
    weightGrams: p?.weightGrams ?? null, seoTitle: p?.seoTitle ?? "", seoDescription: p?.seoDescription ?? "",
  });
  const [tagInput, setTagInput] = useState("");
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const generateVariants = () => {
    const opts = f.options.filter((o) => o.name && o.values.length);
    if (!opts.length) return set("variants", []);
    const combos: Record<string, string>[] = opts.reduce<Record<string, string>[]>((acc, o) => acc.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v }))), [{}]);
    set("variants", combos.map((c) => { const title = Object.values(c).join(" / "); const ex = f.variants.find((v) => v.title === title); return ex ?? { title, optionValues: c, price: null, sku: "", stock: 0, image: null }; }));
  };

  const submit = (andNew = false) => start(async () => {
    const r = await saveProduct(p?.id ?? null, f);
    notify(toast, r);
    if (r.ok) { if (andNew) router.push("/admin/products/new"); else if (!p) router.push(`/admin/products/${r.id}`); else router.refresh(); }
  });

  const margin = f.costPrice && f.price ? Math.round(((f.price - f.costPrice) / f.price) * 100) : null;

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-gray-500 hover:text-black inline-flex items-center gap-1 mb-3"><ArrowLeft className="h-3.5 w-3.5" /> Products</Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{p ? "Edit product" : "New product"}</h1>
        <div className="flex gap-2">{p && <a href={`/products/${p.slug}`} target="_blank" className="btn-outline btn-sm">View in store</a>}{!p && <button onClick={() => submit(true)} disabled={pending} className="btn-outline">Save & add another</button>}<button onClick={() => submit()} disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save product"}</button></div>
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <div><label className="label">Name</label><input value={f.name} onChange={(e) => { set("name", e.target.value); if (!p) set("slug", slugify(e.target.value)); }} className="input text-base" placeholder="e.g. Linen Throw Blanket" /></div>
            <div><label className="label">Short description (shown on cards)</label><input value={f.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} className="input" /></div>
            <div><label className="label">Description (HTML allowed)</label><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={8} className="input font-mono text-xs" /></div>
          </div>
          <div className="card p-5"><label className="label">Images</label><ImageUploader value={f.images} onChange={(v) => set("images", v)} /></div>
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Pricing</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><label className="label">Price (₹)</label><input type="number" step="0.01" value={f.price} onChange={(e) => set("price", Number(e.target.value))} className="input" /></div>
              <div><label className="label">Compare-at price (₹)</label><input type="number" step="0.01" value={f.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} className="input" placeholder="Original price" /></div>
              <div><label className="label">Cost per item (₹)</label><input type="number" step="0.01" value={f.costPrice ?? ""} onChange={(e) => set("costPrice", e.target.value ? Number(e.target.value) : null)} className="input" />{margin != null && <div className="text-xs text-gray-500 mt-1">Margin {margin}%</div>}</div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Inventory</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><label className="label">SKU</label><input value={f.sku ?? ""} onChange={(e) => set("sku", e.target.value)} className="input" /></div>
              <div><label className="label">Stock{f.variants.length > 0 && " (sum of variants)"}</label><input type="number" value={f.variants.length ? f.variants.reduce((a, v) => a + v.stock, 0) : f.stock} disabled={f.variants.length > 0} onChange={(e) => set("stock", Number(e.target.value))} className="input" /></div>
              <div><label className="label">Weight (g)</label><input type="number" value={f.weightGrams ?? ""} onChange={(e) => set("weightGrams", e.target.value ? Number(e.target.value) : null)} className="input" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm mt-3"><input type="checkbox" checked={f.trackStock} onChange={(e) => set("trackStock", e.target.checked)} /> Track stock (prevent overselling)</label>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Options & variants</h3><button type="button" onClick={() => set("options", [...f.options, { name: "", values: [] }])} className="btn-outline btn-sm"><Plus className="h-3.5 w-3.5" /> Add option</button></div>
            {f.options.map((o, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <input value={o.name} onChange={(e) => set("options", f.options.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="Option name (Size, Colour)" className="input w-44" />
                <input value={o.values.join(", ")} onChange={(e) => set("options", f.options.map((x, k) => (k === i ? { ...x, values: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x)))} placeholder="Values, comma separated (S, M, L)" className="input flex-1" />
                <button type="button" onClick={() => set("options", f.options.filter((_, k) => k !== i))} className="btn-ghost p-2"><X className="h-4 w-4" /></button>
              </div>
            ))}
            {f.options.length > 0 && <button type="button" onClick={generateVariants} className="btn-outline btn-sm mt-1"><Wand2 className="h-3.5 w-3.5" /> Generate variants</button>}
            {f.variants.length > 0 && (
              <table className="data mt-4"><thead><tr><th>Variant</th><th>Price override (₹)</th><th>SKU</th><th>Stock</th></tr></thead>
                <tbody>{f.variants.map((v, i) => { const up = (patch: Partial<V>) => set("variants", f.variants.map((x, k) => (k === i ? { ...x, ...patch } : x))); return (
                  <tr key={v.title}><td className="font-medium">{v.title}</td><td><input type="number" step="0.01" value={v.price ?? ""} onChange={(e) => up({ price: e.target.value ? Number(e.target.value) : null })} placeholder={String(f.price)} className="input py-1 w-28" /></td><td><input value={v.sku ?? ""} onChange={(e) => up({ sku: e.target.value })} className="input py-1 w-36" /></td><td><input type="number" value={v.stock} onChange={(e) => up({ stock: Number(e.target.value) })} className="input py-1 w-20" /></td></tr>
                ); })}</tbody></table>
            )}
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Search engine listing</h3>
            <div className="space-y-3"><div><label className="label">URL slug</label><input value={f.slug} onChange={(e) => set("slug", e.target.value)} className="input font-mono text-xs" /></div><div><label className="label">SEO title</label><input value={f.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} className="input" placeholder={f.name} /></div><div><label className="label">Meta description</label><textarea value={f.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} rows={2} className="input" /></div></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <div><label className="label">Status</label><select value={f.status} onChange={(e) => set("status", e.target.value as ProductInput["status"])} className="input"><option value="active">Active — visible in store</option><option value="draft">Draft — hidden</option><option value="archived">Archived</option></select></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured on homepage</label>
          </div>
          <div className="card p-5 space-y-4">
            <div><label className="label">Category</label><select value={f.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value)} className="input"><option value="">— None —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "↳ " : ""}{c.name}</option>)}</select></div>
            <div><label className="label">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">{f.tags.map((t) => <span key={t} className="badge bg-gray-100 text-gray-700 gap-1">{t}<button type="button" onClick={() => set("tags", f.tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button></span>)}</div>
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) { e.preventDefault(); set("tags", [...new Set([...f.tags, tagInput.trim().toLowerCase()])]); setTagInput(""); } }} placeholder="Type and press Enter" className="input" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
