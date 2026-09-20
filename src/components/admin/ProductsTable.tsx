"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Product, Category } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { bulkProductStatus, deleteProducts, quickUpdateProduct, duplicateProduct } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { Copy, Star, Trash2, ExternalLink } from "lucide-react";

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
    return <input value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className={`w-20 rounded border border-transparent hover:border-gray-300 focus:border-gray-900 px-1.5 py-1 text-sm text-right bg-transparent focus:bg-white ${field === "stock" && p.stock <= 5 ? "text-red-600 font-medium" : ""}`} />;
  };

  return (
    <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
      {sel.size > 0 && (
        <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-sm">
          <span className="mr-2">{sel.size} selected</span>
          <button onClick={() => run(() => bulkProductStatus([...sel], "active"))} className="btn-sm btn bg-white/10 hover:bg-white/20 text-white">Set active</button>
          <button onClick={() => run(() => bulkProductStatus([...sel], "draft"))} className="btn-sm btn bg-white/10 hover:bg-white/20 text-white">Set draft</button>
          <button onClick={() => run(() => bulkProductStatus([...sel], "archived"))} className="btn-sm btn bg-white/10 hover:bg-white/20 text-white">Archive</button>
          <button onClick={() => confirm(`Delete ${sel.size} products? This cannot be undone.`) && run(async () => { const r = await deleteProducts([...sel]); setSel(new Set()); return r; })} className="btn-sm btn bg-red-600 hover:bg-red-700 text-white ml-auto"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="data">
          <thead><tr><th className="w-8"><input type="checkbox" checked={all} onChange={() => setSel(all ? new Set() : new Set(products.map((p) => p.id)))} /></th><th>Product</th><th>Category</th><th>Status</th><th className="text-right">Price</th><th className="text-right">Stock</th><th className="text-center">Featured</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} /></td>
                <td><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-md bg-gray-100 overflow-hidden shrink-0">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><Link href={`/admin/products/${p.id}`} className="font-medium hover:underline line-clamp-1">{p.name}</Link><div className="text-xs text-gray-400">{p.sku ?? "no SKU"}</div></div></div></td>
                <td className="text-gray-600">{catName(p.categoryId)}</td>
                <td><select value={p.status} onChange={(e) => run(() => quickUpdateProduct(p.id, { status: e.target.value as Product["status"] }))} className="bg-transparent text-xs border border-transparent hover:border-gray-300 rounded px-1 py-0.5"><option value="active">active</option><option value="draft">draft</option><option value="archived">archived</option></select></td>
                <td className="text-right"><InlineNum p={p} field="price" /></td>
                <td className="text-right">{p.trackStock ? <InlineNum p={p} field="stock" /> : <span className="text-xs text-gray-400">∞</span>}</td>
                <td className="text-center"><button onClick={() => run(() => quickUpdateProduct(p.id, { featured: !p.featured }))}><Star className={`h-4 w-4 ${p.featured ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} /></button></td>
                <td className="text-right whitespace-nowrap">
                  <a href={`/products/${p.slug}`} target="_blank" className="btn-ghost p-1.5" title="View"><ExternalLink className="h-3.5 w-3.5" /></a>
                  <button onClick={() => run(() => duplicateProduct(p.id))} className="btn-ghost p-1.5" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => confirm("Delete this product?") && run(() => deleteProducts([p.id]))} className="btn-ghost p-1.5 text-red-600" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-500">No products found</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-[11px] text-gray-400 border-t">Tip: click a price or stock value to edit it inline · {formatMoney(products.reduce((a, p) => a + p.price * p.stock, 0), currency)} inventory value at retail</div>
    </div>
  );
}
