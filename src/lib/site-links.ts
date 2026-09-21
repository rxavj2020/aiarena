/**
 * Pure website-link helpers, safe to import from client components
 * (no server-only modules in this file).
 */

/** URL prefix of a website, e.g. `/store/my-shop`. */
export function siteBase(slug: string) {
  return `/store/${slug}`;
}

/** Link inside a website: `siteHref("/store/my-shop", "/shop")` → `/store/my-shop/shop`. */
export function siteHref(base: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}` || "/";
}

export type DiscountableProduct = { price: number; compareAtPrice: number | null };

export function siteDiscount(p: DiscountableProduct) {
  return p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;
}
