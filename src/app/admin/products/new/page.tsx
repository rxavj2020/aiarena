import { db, schema } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
export default function NewProduct() {
  const cats = db.select().from(schema.categories).all();
  return <ProductForm categories={cats} />;
}
