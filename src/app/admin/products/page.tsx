import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, and, like, eq, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { Plus } from "lucide-react";

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
  return (
    <div>
      <PageHeader title="Products" subtitle={`${products.length} products`}>
        <a href="/api/admin/export?type=products" className="btn-outline btn-sm">Export CSV</a>
        <Link href="/admin/products/new" className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Add product</Link>
      </PageHeader>
      <form className="flex flex-wrap gap-2 mb-4">
        <input name="q" defaultValue={sp.q} placeholder="Search products" className="input w-64 py-1.5" />
        <select name="status" defaultValue={sp.status} className="input w-36 py-1.5"><option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <select name="category" defaultValue={sp.category} className="input w-44 py-1.5"><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="stock" defaultValue={sp.stock} className="input w-36 py-1.5"><option value="">Any stock</option><option value="low">Low stock (≤5)</option></select>
        <button className="btn-outline btn-sm">Filter</button>
        {(sp.q || sp.status || sp.category || sp.stock) && <Link href="/admin/products" className="btn-ghost btn-sm">Clear</Link>}
      </form>
      <ProductsTable products={products} categories={cats} currency={s.currency} />
    </div>
  );
}
