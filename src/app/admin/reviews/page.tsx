import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/admin/PageHeader";
import { ReviewRow } from "@/components/admin/ReviewRow";
import Link from "next/link";
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const rows = db.select({ r: schema.reviews, product: schema.products.name, slug: schema.products.slug }).from(schema.reviews).innerJoin(schema.products, eq(schema.reviews.productId, schema.products.id)).where(f === "pending" ? eq(schema.reviews.approved, false) : f === "approved" ? eq(schema.reviews.approved, true) : undefined).orderBy(desc(schema.reviews.createdAt)).all();
  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews before they appear on product pages." />
      <div className="flex gap-2 mb-4">{[["", "All"], ["pending", "Pending"], ["approved", "Approved"]].map(([v, l]) => <Link key={v} href={`/admin/reviews?f=${v}`} className={`rounded-full px-3 py-1 text-xs font-medium ${(f ?? "") === v ? "bg-gray-900 text-white" : "bg-white border"}`}>{l}</Link>)}</div>
      <div className="card divide-y">{rows.map(({ r, product, slug }) => <ReviewRow key={r.id} review={r} product={product} slug={slug} />)}{rows.length === 0 && <div className="p-10 text-center text-gray-500">No reviews</div>}</div>
    </div>
  );
}
