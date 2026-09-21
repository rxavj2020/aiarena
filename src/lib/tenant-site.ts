/**
 * Tenant website context.
 *
 * Every public website owned by a subscriber is addressed at `/store/{slug}/*`
 * and is fully isolated from the Aurelia platform: its own chrome, its own
 * theme, its own cart and its own home link. Helpers here resolve that context
 * and the site-scoped catalogue in one place.
 */
import { cache } from "react";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getTenantById, getTenantBySlug, DEFAULT_TENANT_ID } from "@/lib/platform";
import { listTenantProducts, type TenantProduct } from "@/lib/tenant-firestore";
import { resolveTheme, themeFromJson, type TenantTheme } from "@/lib/themes";
import { writeCart } from "@/lib/cart";
import { siteBase, siteDiscount } from "@/lib/site-links";

export { siteBase, siteHref, siteDiscount } from "@/lib/site-links";

export type SiteProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  /** `firestore` products mirror an external catalogue and are view-only. */
  source: "db" | "firestore";
  buyable: boolean;
  status: string;
  createdAt: string;
};

export type TenantSite = {
  tenant: schema.Tenant;
  theme: TenantTheme;
  /** URL prefix of the website, e.g. `/store/my-shop`. */
  basePath: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

/** Link inside a website: `siteHref("/store/my-shop", "/shop")` → `/store/my-shop/shop`. */
export function themeOfTenant(tenant: schema.Tenant): TenantTheme {
  // The tenant columns mirror Colour 1 (frame) and Colour 2 (ground); the theme
  // JSON carries the full role trio (legacy colours are mapped by resolveTheme).
  return resolveTheme({
    ...themeFromJson(tenant.theme),
    frameColor: tenant.primaryColor || undefined,
    groundColor: tenant.accentColor || undefined,
  });
}

export const getTenantSite = cache(async (slug: string): Promise<TenantSite | null> => {
  const tenant = getTenantBySlug(slug);
  if (!tenant) return null;
  return {
    tenant,
    theme: themeOfTenant(tenant),
    basePath: siteBase(tenant.slug),
    name: tenant.name,
    tagline: tenant.tagline,
    logoUrl: tenant.logoUrl,
    faviconUrl: tenant.faviconUrl,
  };
});

function dbProductToSite(p: schema.Product): SiteProduct {
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    images,
    source: "db",
    buyable: true,
    status: p.status,
    createdAt: p.createdAt,
  };
}

function firestoreProductToSite(p: TenantProduct): SiteProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    images: p.image ? [p.image] : [],
    source: "firestore",
    buyable: false,
    status: p.status,
    createdAt: p.createdAt,
  };
}

/**
 * Catalogue of one website: local (SQLite) products first; if the subscriber
 * connected Firestore and has no local catalogue, their mirrored products are
 * shown. The legacy demo workspace falls back to the seeded catalogue.
 */
export async function listSiteProducts(tenantId: string, opts?: { limit?: number; search?: string; category?: string; sort?: "newest" | "price-asc" | "price-desc" | "discount" }): Promise<SiteProduct[]> {
  const limit = opts?.limit ?? 24;
  let items: SiteProduct[] = db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.tenantId, tenantId), eq(schema.products.status, "active")))
    .orderBy(desc(schema.products.createdAt))
    .all()
    .map(dbProductToSite);

  if (!items.length) {
    const firestoreProducts = await listTenantProducts(tenantId).catch(() => []);
    items = firestoreProducts.map(firestoreProductToSite);
  }

  if (!items.length && tenantId === DEFAULT_TENANT_ID) {
    items = db
      .select()
      .from(schema.products)
      .where(eq(schema.products.status, "active"))
      .orderBy(desc(schema.products.createdAt))
      .all()
      .map(dbProductToSite);
  }

  // Category browse (DB products carry a categoryId; mirrored products fall back to a name match)
  const catSlug = opts?.category?.trim().toLowerCase();
  if (catSlug) {
    const cat = db.select().from(schema.categories).where(eq(schema.categories.slug, catSlug)).get();
    if (cat) {
      const ids = [cat.id, ...db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.parentId, cat.id)).all().map((c) => c.id)];
      const byName = cat.name.toLowerCase();
      items = items.filter((p) => {
        const row = db.select({ categoryId: schema.products.categoryId }).from(schema.products).where(eq(schema.products.id, p.id)).get();
        return row ? ids.includes(row.categoryId ?? "") : p.name.toLowerCase().includes(byName);
      });
    }
  }

  const q = opts?.search?.trim().toLowerCase();
  if (q) items = items.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));

  switch (opts?.sort) {
    case "price-asc":
      items = [...items].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      items = [...items].sort((a, b) => b.price - a.price);
      break;
    case "discount":
      items = [...items].sort((a, b) => discountOf(b) - discountOf(a));
      break;
    default:
      break;
  }
  return items.slice(0, limit);
}

function discountOf(p: SiteProduct) {
  return siteDiscount(p);
}

export const getSiteProduct = cache(async (tenantId: string, slugOrId: string): Promise<SiteProduct | null> => {
  const row =
    db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.tenantId, tenantId), eq(schema.products.status, "active")))
      .all()
      .find((p) => p.slug === slugOrId || p.id === slugOrId) ?? null;
  if (row) return dbProductToSite(row);
  const firestoreProducts = await listTenantProducts(tenantId).catch(() => []);
  const found = firestoreProducts.find((p) => p.slug === slugOrId || p.id === slugOrId);
  return found ? firestoreProductToSite(found) : null;
});

export function siteVariants(productId: string) {
  return db.select().from(schema.variants).where(eq(schema.variants.productId, productId)).all();
}

/** The website an order was placed on — used by payment returns. */
export function orderSiteBase(orderId: string): string {
  const order = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!order?.tenantId) return "";
  const tenant = getTenantById(order.tenantId);
  return tenant ? siteBase(tenant.slug) : "";
}

/** Clear the bag of whichever website the order belonged to (and the legacy demo bag). */
export async function clearOrderCart(orderId: string) {
  const order = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  const tenantId = order?.tenantId ?? null;
  if (tenantId) await writeCart([], tenantId);
  if (!tenantId || tenantId === DEFAULT_TENANT_ID) await writeCart([]);
}
