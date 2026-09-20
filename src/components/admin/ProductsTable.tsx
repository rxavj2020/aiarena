"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Product, Category } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { bulkProductStatus, deleteProducts, quickUpdateProduct, duplicateProduct } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { Copy, Star, Trash2, ExternalLink, MoreVertical, Package } from "lucide-react";

export function ProductsTable({ products, categories, currency }: { products: Product[]; categories: Category[]; currency: string }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const all = sel.size === products.length && products.length > 0;
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { notify(toast, await fn()); router.refresh(); });
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const InlineNum = ({ p, field }: { p: Product; field: "price" | "stock" }) => {
    const initial = field === "price" ? (p.price / 100).toString() : String(p.stock);
    const [v, setV] = useState(initial);
    const commit = () => { if (v === initial) return; const n = Number(v); if (isNaN(n)) return setV(initial); run(() => quickUpdateProduct(p.id, { [field]: n })); };
    return <input value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className={`w-20 rounded-full border border-transparent hover:border-gray-300 focus:border-gray-900 px-2.5 py-1 text-sm text-right bg-transparent focus:bg-white ${field === "stock" && p.stock <= 5 ? "text-red-600 font-bold" : ""}`} />;
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4"><Package className="h-8 w-8 text-gray-300" /></div>
        <div className="font-bold">No products found</div>
        <div className="text-sm text-gray-500 mt-1">Try adjusting filters or create a new product</div>
        <Link href="/admin/products/new" className="btn-primary btn-sm mt-4 rounded-full">Add product</Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-3">
            <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} className="mt-1" />
            <div className="h-16 w-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 border">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex-1 min-w-0">
              <Link href={`/admin/products/${p.id}`} className="font-semibold text-sm line-clamp-1">{p.name}</Link>
              <div className="text-xs text-gray-500">{catName(p.categoryId)} · {p.sku || "No SKU"}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-bold">{formatMoney(p.price, currency)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                <span className={`text-xs ${p.stock <= 5 ? "text-red-600 font-bold" : "text-gray-500"}`}>{p.trackStock ? `${p.stock} left` : "∞ stock"}</span>
              </div>
            </div>
            <Link href={`/admin/products/${p.id}`} className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className={`hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden ${pending ? "opacity-60" : ""}`}>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 text-sm">
            <span className="font-bold mr-2">{sel.size} selected</span>
            <button onClick={() => run(() => bulkProductStatus([...sel], "active"))} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium">Active</button>
            <button onClick={() => run(() => bulkProductStatus([...sel], "draft"))} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium">Draft</button>
            <button onClick={() => run(() => bulkProductStatus([...sel], "archived"))} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium">Archive</button>
            <button onClick={() => confirm(`Delete ${sel.size} products?`) && run(async () => { const r = await deleteProducts([...sel]); setSel(new Set()); return r; })} className="bg-red-600 hover:bg-red-700 text-white ml-auto px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="data">
            <thead><tr><th className="w-8"><input type="checkbox" checked={all} onChange={() => setSel(all ? new Set() : new Set(products.map((p) => p.id)))} /></th><th>Product</th><th>Category</th><th>Status</th><th className="text-right">Price</th><th className="text-right">Stock</th><th className="text-center">Featured</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="group">
                  <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} /></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gray-50 overflow-hidden shrink-0 border">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition" />}</div>
                      <div className="min-w-0"><Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline line-clamp-1 text-sm">{p.name}</Link><div className="text-xs text-gray-400 font-mono">{p.sku ?? "no SKU"}</div></div>
                    </div>
                  </td>
                  <td className="text-gray-600 text-xs"><span className="bg-gray-50 border px-2 py-1 rounded-full">{catName(p.categoryId)}</span></td>
                  <td><select value={p.status} onChange={(e) => run(() => quickUpdateProduct(p.id, { status: e.target.value as Product["status"] }))} className="bg-white border border-gray-200 rounded-full text-xs px-2.5 py-1"><option value="active">active</option><option value="draft">draft</option><option value="archived">archived</option></select></td>
                  <td className="text-right"><InlineNum p={p} field="price" /></td>
                  <td className="text-right">{p.trackStock ? <InlineNum p={p} field="stock" /> : <span className="text-xs text-gray-400">∞</span>}</td>
                  <td className="text-center"><button onClick={() => run(() => quickUpdateProduct(p.id, { featured: !p.featured }))} className="h-7 w-7 rounded-full bg-gray-50 hover:bg-amber-50 flex items-center justify-center transition"><Star className={`h-4 w-4 ${p.featured ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} /></button></td>
                  <td className="text-right whitespace-nowrap">
                    <a href={`/products/${p.slug}`} target="_blank" className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100" title="View"><ExternalLink className="h-3.5 w-3.5" /></a>
                    <button onClick={() => run(() => duplicateProduct(p.id))} className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 ml-1" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={() => confirm("Delete this product?") && run(() => deleteProducts([p.id]))} className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 ml-1" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-[11px] text-gray-400 border-t bg-gray-50/50 flex items-center justify-between">
          <span>Tip: click price or stock to edit inline · Fast product management</span>
          <span className="font-bold">{formatMoney(products.reduce((a, p) => a + p.price * p.stock, 0), currency)} inventory value</span>
        </div>
      </div>

      {sel.size > 0 && (
        <div className="lg:hidden fixed bottom-[72px] left-0 right-0 bg-gray-900 text-white p-3 flex items-center gap-2 z-20">
          <span className="text-sm font-bold">{sel.size} selected</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => run(() => bulkProductStatus([...sel], "active"))} className="bg-white/10 px-3 py-1.5 rounded-full text-xs">Active</button>
            <button onClick={() => { setSel(new Set()); }} className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold">Done</button>
          </div>
        </div>
      )}
    </>
  );
}
