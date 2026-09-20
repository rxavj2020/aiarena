import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { and, gt, lte, or, isNull, sql } from "drizzle-orm";

export type CartLine = { productId: string; variantId?: string; qty: number };

const COOKIE = "cart";

export async function readCart(): Promise<CartLine[]> {
  const c = await cookies();
  try {
    const raw = c.get(COOKIE)?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.productId && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]) {
  const c = await cookies();
  c.set(COOKIE, JSON.stringify(lines), { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
}

export type ResolvedLine = {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  variantTitle?: string;
  image?: string;
  price: number;
  qty: number;
  stock: number;
  trackStock: boolean;
  sku?: string | null;
};

export async function resolveCart(lines?: CartLine[]) {
  const raw = lines ?? (await readCart());
  if (!raw.length) return [] as ResolvedLine[];
  const ids = [...new Set(raw.map((l) => l.productId))];
  const products = db.select().from(schema.products).where(and(inArray(schema.products.id, ids), eq(schema.products.status, "active"))).all();
  const variantIds = raw.map((l) => l.variantId).filter(Boolean) as string[];
  const variants = variantIds.length ? db.select().from(schema.variants).where(inArray(schema.variants.id, variantIds)).all() : [];
  const out: ResolvedLine[] = [];
  for (const l of raw) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) continue;
    const v = l.variantId ? variants.find((x) => x.id === l.variantId) : undefined;
    if (l.variantId && !v) continue;
    out.push({
      key: `${l.productId}:${l.variantId ?? ""}`,
      productId: p.id,
      variantId: v?.id,
      name: p.name,
      slug: p.slug,
      variantTitle: v?.title,
      image: v?.image || p.images[0],
      price: v?.price ?? p.price,
      qty: l.qty,
      stock: v ? v.stock : p.stock,
      trackStock: p.trackStock,
      sku: v?.sku ?? p.sku,
    });
  }
  return out;
}

export type Totals = { subtotal: number; discount: number; shipping: number; tax: number; total: number; couponCode?: string; couponError?: string };

export async function computeTotals(lines: ResolvedLine[], couponCode?: string, paymentMethod?: string): Promise<Totals> {
  const s = await getSettings();
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  let discount = 0;
  let freeShip = false;
  let couponError: string | undefined;
  let applied: string | undefined;
  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    const now = new Date().toISOString();
    const c = db
      .select()
      .from(schema.coupons)
      .where(and(eq(schema.coupons.code, code), eq(schema.coupons.active, true), or(isNull(schema.coupons.startsAt), lte(schema.coupons.startsAt, now)), or(isNull(schema.coupons.expiresAt), gt(schema.coupons.expiresAt, now))))
      .get();
    if (!c) couponError = "Invalid or expired coupon";
    else if (c.maxUses != null && c.usedCount >= c.maxUses) couponError = "This coupon has been fully redeemed";
    else if (subtotal < c.minOrder) couponError = `Minimum order for this coupon is ${(c.minOrder / 100).toFixed(0)}`;
    else {
      applied = code;
      if (c.type === "percent") discount = Math.round((subtotal * c.value) / 100);
      else if (c.type === "fixed") discount = Math.min(c.value, subtotal);
      else freeShip = true;
    }
  }
  const afterDiscount = subtotal - discount;
  let shipping = 0;
  if (lines.length && !freeShip && !(s.shipping.freeAbove > 0 && afterDiscount >= s.shipping.freeAbove)) shipping = s.shipping.flatRate;
  if (paymentMethod === "cod" && s.shipping.codEnabled) shipping += s.shipping.codFee;
  let tax = 0;
  if (s.tax.enabled && s.tax.ratePercent > 0) {
    tax = s.tax.inclusive ? Math.round(afterDiscount - afterDiscount / (1 + s.tax.ratePercent / 100)) : Math.round((afterDiscount * s.tax.ratePercent) / 100);
  }
  const total = afterDiscount + shipping + (s.tax.inclusive ? 0 : tax);
  return { subtotal, discount, shipping, tax, total, couponCode: applied, couponError };
}

export function nextOrderNumber() {
  const r = db.select({ m: sql<number>`coalesce(max(${schema.orders.orderNumber}), 1000)` }).from(schema.orders).get();
  return (r?.m ?? 1000) + 1;
}
