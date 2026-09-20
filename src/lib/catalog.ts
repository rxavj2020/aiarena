import { db, schema } from "@/lib/db";
import { and, asc, desc, eq, inArray, like, or, sql, gt } from "drizzle-orm";
import { cache } from "react";

export type ProductWithExtras = schema.Product & { category?: schema.Category | null; variants: schema.Variant[]; rating: number; reviewCount: number };

export const listCategories = cache(() => db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder), asc(schema.categories.name)).all());

export const getCategory = cache((slug: string) => db.select().from(schema.categories).where(eq(schema.categories.slug, slug)).get());

export type ShopQuery = { q?: string; category?: string; sort?: string; min?: number; max?: number; page?: number; perPage?: number; tag?: string; featured?: boolean };

export function queryProducts(qs: ShopQuery) {
  const perPage = qs.perPage ?? 12;
  const page = Math.max(1, qs.page ?? 1);
  const conds = [eq(schema.products.status, "active")];
  if (qs.q) conds.push(or(like(schema.products.name, `%${qs.q}%`), like(schema.products.description, `%${qs.q}%`), like(schema.products.tags, `%${qs.q}%`))!);
  if (qs.category) {
    const cat = getCategory(qs.category);
    if (cat) {
      const children = db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.parentId, cat.id)).all().map((c) => c.id);
      conds.push(inArray(schema.products.categoryId, [cat.id, ...children]));
    }
  }
  if (qs.min) conds.push(sql`${schema.products.price} >= ${qs.min}`);
  if (qs.max) conds.push(sql`${schema.products.price} <= ${qs.max}`);
  if (qs.tag) conds.push(like(schema.products.tags, `%"${qs.tag}"%`));
  if (qs.featured) conds.push(eq(schema.products.featured, true));
  if (qs.sort === "discount") conds.push(gt(schema.products.compareAtPrice, schema.products.price));

  const order =
    qs.sort === "price_asc" ? asc(schema.products.price)
    : qs.sort === "price_desc" ? desc(schema.products.price)
    : qs.sort === "name" ? asc(schema.products.name)
    : qs.sort === "discount" ? desc(sql`(${schema.products.compareAtPrice} - ${schema.products.price}) * 1.0 / ${schema.products.compareAtPrice}`)
    : desc(schema.products.createdAt);

  const where = and(...conds);
  const total = db.select({ n: sql<number>`count(*)` }).from(schema.products).where(where).get()?.n ?? 0;
  const rows = db.select().from(schema.products).where(where).orderBy(order).limit(perPage).offset((page - 1) * perPage).all();
  return { items: attachRatings(rows), total, page, perPage, pages: Math.ceil(total / perPage) };
}

function attachRatings(rows: schema.Product[]) {
  if (!rows.length) return [] as (schema.Product & { rating: number; reviewCount: number })[];
  const ids = rows.map((r) => r.id);
  const agg = db
    .select({ productId: schema.reviews.productId, avg: sql<number>`avg(${schema.reviews.rating})`, n: sql<number>`count(*)` })
    .from(schema.reviews)
    .where(and(inArray(schema.reviews.productId, ids), eq(schema.reviews.approved, true)))
    .groupBy(schema.reviews.productId)
    .all();
  const m = new Map(agg.map((a) => [a.productId, a]));
  return rows.map((r) => ({ ...r, rating: m.get(r.id)?.avg ?? 0, reviewCount: m.get(r.id)?.n ?? 0 }));
}

export const getProductBySlug = cache((slug: string): ProductWithExtras | null => {
  const p = db.select().from(schema.products).where(eq(schema.products.slug, slug)).get();
  if (!p) return null;
  const variants = db.select().from(schema.variants).where(eq(schema.variants.productId, p.id)).all();
  const category = p.categoryId ? db.select().from(schema.categories).where(eq(schema.categories.id, p.categoryId)).get() : null;
  const [withRating] = attachRatings([p]);
  return { ...withRating, category, variants };
});

export function getProductReviews(productId: string) {
  return db.select().from(schema.reviews).where(and(eq(schema.reviews.productId, productId), eq(schema.reviews.approved, true))).orderBy(desc(schema.reviews.createdAt)).all();
}

export function relatedProducts(p: schema.Product, n = 4) {
  const rows = db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.status, "active"), p.categoryId ? eq(schema.products.categoryId, p.categoryId) : sql`1=1`, sql`${schema.products.id} != ${p.id}`))
    .orderBy(sql`random()`)
    .limit(n)
    .all();
  return attachRatings(rows);
}

export function featuredProducts(n = 8) {
  return queryProducts({ featured: true, perPage: n }).items;
}
export function newestProducts(n = 8) {
  return queryProducts({ perPage: n, sort: "newest" }).items;
}
export function categoryProductCounts() {
  return db.select({ categoryId: schema.products.categoryId, n: sql<number>`count(*)` }).from(schema.products).where(eq(schema.products.status, "active")).groupBy(schema.products.categoryId).all();
}
