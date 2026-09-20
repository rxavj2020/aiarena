import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = db.select().from(schema.pages).where(eq(schema.pages.slug, (await params).slug)).get();
  return { title: p?.title };
}
export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = db.select().from(schema.pages).where(and(eq(schema.pages.slug, (await params).slug), eq(schema.pages.published, true))).get();
  if (!p) notFound();
  return (
    <div className="container-x py-14 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold mb-6">{p.title}</h1>
      <div className="prose-store" dangerouslySetInnerHTML={{ __html: p.content }} />
    </div>
  );
}
