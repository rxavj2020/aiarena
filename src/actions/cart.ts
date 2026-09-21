"use server";
import { readCart, writeCart } from "@/lib/cart";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type CartScope = { tenantId?: string | null; base?: string };

export async function addToCart(formData: FormData) {
  const productId = String(formData.get("productId"));
  const variantId = formData.get("variantId") ? String(formData.get("variantId")) : undefined;
  const qty = Math.max(1, Number(formData.get("qty") || 1));
  const buyNow = formData.get("buyNow") === "1";
  const tenantId = formData.get("tenantId") ? String(formData.get("tenantId")) : null;
  const base = formData.get("base") ? String(formData.get("base")) : "";
  const product = db.select().from(schema.products).where(eq(schema.products.id, productId)).get();
  if (!product) return { ok: false, error: "Product not found" };
  if (tenantId && product.tenantId !== tenantId) return { ok: false, error: "Product not found" };
  if (product.options.length && !variantId) return { ok: false, error: "Please select an option" };
  const lines = await readCart(tenantId);
  const existing = lines.find((l) => l.productId === productId && (l.variantId ?? "") === (variantId ?? ""));
  if (existing) existing.qty += qty;
  else lines.push({ productId, variantId, qty });
  await writeCart(lines, tenantId);
  revalidatePath("/", "layout");
  if (buyNow) redirect(`${base}/checkout`);
  return { ok: true };
}

export async function updateQty(key: string, qty: number, scope?: CartScope) {
  const tenantId = scope?.tenantId ?? null;
  const [productId, variantId] = key.split(":");
  let lines = await readCart(tenantId);
  if (qty <= 0) lines = lines.filter((l) => !(l.productId === productId && (l.variantId ?? "") === variantId));
  else lines = lines.map((l) => (l.productId === productId && (l.variantId ?? "") === variantId ? { ...l, qty } : l));
  await writeCart(lines, tenantId);
  revalidatePath("/", "layout");
}

export async function clearCart(scope?: CartScope) {
  await writeCart([], scope?.tenantId ?? null);
  revalidatePath("/", "layout");
}
