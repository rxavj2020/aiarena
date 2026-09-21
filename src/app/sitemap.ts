import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const products = db.select({ slug: schema.products.slug, updatedAt: schema.products.updatedAt }).from(schema.products).where(eq(schema.products.status, "active")).all();
  const pages = db.select({ slug: schema.pages.slug }).from(schema.pages).where(eq(schema.pages.published, true)).all();
  const cats = db.select({ slug: schema.categories.slug }).from(schema.categories).all();
  const tenants = db.select({ slug: schema.tenants.slug }).from(schema.tenants).where(eq(schema.tenants.status, "active")).all();
  return [
    { url: base, priority: 1 }, { url: `${base}/platform`, priority: 0.8 }, { url: `${base}/shop`, priority: 0.9 }, { url: `${base}/categories` },
    ...tenants.map((t) => ({ url: `${base}/store/${t.slug}`, priority: 0.9 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...cats.map((c) => ({ url: `${base}/shop?category=${c.slug}` })),
    ...pages.map((p) => ({ url: `${base}/pages/${p.slug}`, priority: 0.4 })),
  ];
}
