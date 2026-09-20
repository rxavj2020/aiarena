import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, and, like, eq, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { Plus, Search, Filter, Download, Package } from "lucide-react";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; stock?: string }> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const conds = [];
  if (sp.q) conds.push(like(schema.products.name, `%${sp.q}%`));
  if (sp.status) conds.push(eq(schema.products.status, sp.status as schema.Product["status"]));
  if (sp.category) conds.push(eq(schema.products.categoryId, sp.category));
  if (sp.stock === "low") conds.push(sql`stock <= 5`);
  const products = db.select().from(schema.products).where(conds.length ? and(...conds) : undefined).orderBy(desc(schema.products.updatedAt)).all();
  const cats = db.select().from(schema.categories).all();
  const activeCount = db.select({ n: sql<number>`count(*)` }).from(schema.products).where(eq(schema.products.status, "active")).get()!.n;
  const lowCount = db.select({ n: sql<number>`count(*)` }).from(schema.products).where(sql`track_stock = 1 and stock <= 5`).get()!.n;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" /> Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products · {activeCount} active · {lowCount} low stock · Fast management</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export?type=products" className="btn-outline btn-sm rounded-full bg-white"><Download className="h-4 w-4" /> Export</a>
          <Link href="/admin/products/new" className="btn-primary btn-sm rounded-full"><Plus className="h-4 w-4" /> Add product</Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3">
        <form className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input name="q" defaultValue={sp.q} placeholder="Search products, SKU, tags..." className="input pl-9 rounded-full bg-gray-50 border-gray-200" />
          </div>
          <select name="status" defaultValue={sp.status} className="input w-36 rounded-full bg-gray-50 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
          <select name="category" defaultValue={sp.category} className="input w-40 rounded-full bg-gray-50 text-sm"><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select name="stock" defaultValue={sp.stock} className="input w-32 rounded-full bg-gray-50 text-sm"><option value="">Any stock</option><option value="low">Low stock</option></select>
          <button className="btn-primary btn-sm rounded-full"><Filter className="h-4 w-4" /> Filter</button>
          {(sp.q || sp.status || sp.category || sp.stock) && <Link href="/admin/products" className="btn-ghost btn-sm rounded-full">Clear</Link>}
        </form>
      </div>

      <ProductsTable products={products} categories={cats} currency={s.currency} />
    </div>
  );
}
