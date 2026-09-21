"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/platform";
import { getTenantById } from "@/lib/platform";
import { saveTenantProduct } from "@/lib/tenant-firestore";

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
    await saveTenantProduct(tenantId, {
      ...parsed.data,
      price: Math.round(parsed.data.price * 100),
      compareAtPrice: parsed.data.compareAtPrice == null ? null : Math.round(parsed.data.compareAtPrice * 100),
    });
    const tenant = getTenantById(tenantId);
    if (tenant) {
      revalidatePath(`/admin`);
      revalidatePath(`/store/${tenant.slug}`);
    }
    return { ok: true, message: parsed.data.status === "active" ? "Product published" : "Product saved as draft" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
