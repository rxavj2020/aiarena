"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/platform";
import { getTenantById } from "@/lib/platform";
import { saveTenantProduct } from "@/lib/tenant-firestore";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { id } from "@/lib/utils";

export type TenantAdminResult = { ok: true; message?: string } | { ok: false; error: string };

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Product name is required").max(160),
  slug: z.string().trim().min(1, "Product URL is required").max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters and hyphens"),
  description: z.string().trim().max(5000).default(""),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  image: z.string().trim().url("Use a full image URL").or(z.literal("")).default(""),
});

export async function saveWorkspaceProduct(tenantId: string, input: unknown): Promise<TenantAdminResult> {
  try {
    await requireWorkspaceAccess(tenantId);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    
    const prodId = parsed.data.id || id("prd_");
    const pricePaise = Math.round(parsed.data.price * 100);
    const comparePaise = parsed.data.compareAtPrice ? Math.round(parsed.data.compareAtPrice * 100) : null;
    const nowStr = new Date().toISOString();

    const existing = db.select().from(schema.products).where(and(eq(schema.products.id, prodId), eq(schema.products.tenantId, tenantId))).get();

    if (existing) {
      db.update(schema.products).set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        price: pricePaise,
        compareAtPrice: comparePaise,
        stock: parsed.data.stock,
        status: parsed.data.status,
        images: parsed.data.image ? [parsed.data.image] : [],
        updatedAt: nowStr,
      }).where(and(eq(schema.products.id, prodId), eq(schema.products.tenantId, tenantId))).run();
    } else {
      db.insert(schema.products).values({
        id: prodId,
        tenantId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        price: pricePaise,
        compareAtPrice: comparePaise,
        stock: parsed.data.stock,
        status: parsed.data.status,
        images: parsed.data.image ? [parsed.data.image] : [],
        createdAt: nowStr,
        updatedAt: nowStr,
      }).run();
    }

    try {
      await saveTenantProduct(tenantId, {
        ...parsed.data,
        id: prodId,
        price: pricePaise,
        compareAtPrice: comparePaise,
      });
    } catch {
      // Local SQLite persistence succeeded; Firestore mirror is optional if not connected
    }

    const tenant = getTenantById(tenantId);
    if (tenant) {
      revalidatePath(`/dashboard`);
      revalidatePath(`/store/${tenant.slug}`);
    }
    return { ok: true, message: parsed.data.status === "active" ? "Product published" : "Product saved as draft" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteWorkspaceProduct(tenantId: string, productId: string): Promise<TenantAdminResult> {
  try {
    await requireWorkspaceAccess(tenantId);
    db.delete(schema.products).where(and(eq(schema.products.id, productId), eq(schema.products.tenantId, tenantId))).run();
    const tenant = getTenantById(tenantId);
    if (tenant) {
      revalidatePath(`/dashboard`);
      revalidatePath(`/store/${tenant.slug}`);
    }
    return { ok: true, message: "Product deleted" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
