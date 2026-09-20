import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ProductForm";
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = db.select().from(schema.products).where(eq(schema.products.id, id)).get();
  if (!p) notFound();
  const variants = db.select().from(schema.variants).where(eq(schema.variants.productId, id)).all();
  const cats = db.select().from(schema.categories).all();
  return <ProductForm categories={cats} product={p} variants={variants} />;
}
