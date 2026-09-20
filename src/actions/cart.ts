"use server";
import { readCart, writeCart } from "@/lib/cart";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function addToCart(formData: FormData) {
  const productId = String(formData.get("productId"));
  const variantId = formData.get("variantId") ? String(formData.get("variantId")) : undefined;
  const qty = Math.max(1, Number(formData.get("qty") || 1));
  const buyNow = formData.get("buyNow") === "1";
  const product = db.select().from(schema.products).where(eq(schema.products.id, productId)).get();
  if (!product) return { ok: false, error: "Product not found" };
  if (product.options.length && !variantId) return { ok: false, error: "Please select an option" };
  const lines = await readCart();
  const existing = lines.find((l) => l.productId === productId && (l.variantId ?? "") === (variantId ?? ""));
  if (existing) existing.qty += qty;
  else lines.push({ productId, variantId, qty });
  await writeCart(lines);
  revalidatePath("/", "layout");
  if (buyNow) redirect("/checkout");
  return { ok: true };
}

export async function updateQty(key: string, qty: number) {
  const [productId, variantId] = key.split(":");
  let lines = await readCart();
  if (qty <= 0) lines = lines.filter((l) => !(l.productId === productId && (l.variantId ?? "") === variantId));
  else lines = lines.map((l) => (l.productId === productId && (l.variantId ?? "") === variantId ? { ...l, qty } : l));
  await writeCart(lines);
  revalidatePath("/", "layout");
}

export async function clearCart() {
  await writeCart([]);
  revalidatePath("/", "layout");
}
