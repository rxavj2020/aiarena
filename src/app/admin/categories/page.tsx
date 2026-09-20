import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { categoryProductCounts } from "@/lib/catalog";
export default function CategoriesPage() {
  const cats = db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)).all();
  const counts = categoryProductCounts();
  return <div><PageHeader title="Categories" subtitle="Organise your catalogue. Supports one level of sub-categories." /><CategoriesManager categories={cats} counts={Object.fromEntries(counts.map((c) => [c.categoryId ?? "", c.n]))} /></div>;
}
