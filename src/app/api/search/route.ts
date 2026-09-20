import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, like, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const queryLike = `%${q}%`;

  // Search products
  const products = db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      slug: schema.products.slug,
      price: schema.products.price,
      compareAtPrice: schema.products.compareAtPrice,
      images: schema.products.images,
      stock: schema.products.stock,
      trackStock: schema.products.trackStock,
    })
    .from(schema.products)
    .where(
      and(
        eq(schema.products.status, "active"),
        or(
          like(schema.products.name, queryLike),
          like(schema.products.description, queryLike),
          like(schema.products.tags, queryLike)
        )
      )
    )
    .orderBy(desc(schema.products.createdAt))
    .limit(6)
    .all();

  // Search categories
  const categories = db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      slug: schema.categories.slug,
    })
    .from(schema.categories)
    .where(like(schema.categories.name, queryLike))
    .limit(3)
    .all();

  return NextResponse.json({ products, categories });
}
