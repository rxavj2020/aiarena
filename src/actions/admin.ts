"use server";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { id, slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { saveSettings, type StoreSettings } from "@/lib/settings";
import { updateOrderStatus, addEvent } from "@/lib/orders";
import { savePlugin, recordTest, getPluginState } from "@/lib/plugins/store";
import { testRazorpay, testCashfree, testCloudflare, cloudflarePurge } from "@/lib/plugins/payments";
import { testShiprocket, getCouriers, shipOrder, createShiprocketOrder, trackOrder, cancelShipment } from "@/lib/plugins/shiprocket";
import { testFirestore, fullSync, restoreFromFirestore, mirrorRow, scheduleAutoSync } from "@/lib/plugins/firestore";
import { getOrder } from "@/lib/orders";
import { testR2 } from "@/lib/plugins/storage";
import { makeTransport, sendMail } from "@/lib/plugins/mail";
import { pluginById } from "@/lib/plugins/registry";
import { redirect } from "next/navigation";
import { z } from "zod";

type R = { ok: true; message?: string } | { ok: false; error: string };
const wrap = async (fn: () => Promise<void> | void, message?: string): Promise<R> => {
  try {
    await requireAdmin();
    await fn();
    return { ok: true, message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
};
const revalidateAll = () => revalidatePath("/", "layout");

// ---------- Products ----------
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().default(""),
  shortDescription: z.string().optional(),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().optional().nullable(),
  costPrice: z.coerce.number().optional().nullable(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  trackStock: z.boolean().default(true),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  images: z.array(z.string()).default([]),
  categoryId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  options: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).default([]),
  variants: z.array(z.object({ id: z.string().optional(), title: z.string(), optionValues: z.record(z.string(), z.string()), price: z.number().nullable().optional(), sku: z.string().optional().nullable(), stock: z.number().int().default(0), image: z.string().optional().nullable() })).default([]),
  weightGrams: z.coerce.number().optional().nullable(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});
export type ProductInput = z.infer<typeof productSchema>;

export async function saveProduct(productId: string | null, input: ProductInput): Promise<R & { id?: string }> {
  try {
    await requireAdmin();
    const d = productSchema.parse(input);
    const pid = productId ?? id("prd_");
    let slug = slugify(d.slug || d.name) || pid;
    const clash = db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, slug)).get();
    if (clash && clash.id !== pid) slug = `${slug}-${pid.slice(-4)}`;
    const { variants, ...rest } = d;
    const row = { ...rest, slug, price: Math.round(d.price * 100), compareAtPrice: d.compareAtPrice ? Math.round(d.compareAtPrice * 100) : null, costPrice: d.costPrice ? Math.round(d.costPrice * 100) : null, categoryId: d.categoryId || null, updatedAt: new Date().toISOString() };
    if (productId) db.update(schema.products).set(row).where(eq(schema.products.id, pid)).run();
    else db.insert(schema.products).values({ id: pid, ...row }).run();
    // variants: replace set
    const existing = db.select({ id: schema.variants.id }).from(schema.variants).where(eq(schema.variants.productId, pid)).all().map((v) => v.id);
    const keep = new Set(variants.map((v) => v.id).filter(Boolean) as string[]);
    const toDelete = existing.filter((e) => !keep.has(e));
    if (toDelete.length) db.delete(schema.variants).where(inArray(schema.variants.id, toDelete)).run();
    for (const v of variants) {
      const vrow = { productId: pid, title: v.title, optionValues: v.optionValues, price: v.price != null ? Math.round(v.price * 100) : null, sku: v.sku ?? null, stock: v.stock, image: v.image ?? null };
      if (v.id && existing.includes(v.id)) db.update(schema.variants).set(vrow).where(eq(schema.variants.id, v.id)).run();
      else db.insert(schema.variants).values({ id: id("var_"), ...vrow }).run();
    }
    if (variants.length) db.update(schema.products).set({ stock: variants.reduce((a, v) => a + v.stock, 0) }).where(eq(schema.products.id, pid)).run();
    mirrorRow("products", pid);
    for (const v of db.select({ id: schema.variants.id }).from(schema.variants).where(eq(schema.variants.productId, pid)).all()) mirrorRow("variants", v.id);
    revalidateAll();
    return { ok: true, id: pid, message: "Product saved" };
  } catch (e) {
    return { ok: false, error: e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteProducts(ids: string[]) {
  return wrap(() => { db.delete(schema.products).where(inArray(schema.products.id, ids)).run(); ids.forEach((i) => mirrorRow("products", i)); revalidateAll(); }, `${ids.length} product(s) deleted`);
}
export async function bulkProductStatus(ids: string[], status: "active" | "draft" | "archived") {
  return wrap(() => { db.update(schema.products).set({ status }).where(inArray(schema.products.id, ids)).run(); ids.forEach((i) => mirrorRow("products", i)); revalidateAll(); }, `Updated ${ids.length} product(s)`);
}
export async function quickUpdateProduct(pid: string, patch: { price?: number; stock?: number; featured?: boolean; status?: "active" | "draft" | "archived" }) {
  return wrap(() => {
    db.update(schema.products).set({ ...(patch.price != null ? { price: Math.round(patch.price * 100) } : {}), ...(patch.stock != null ? { stock: patch.stock } : {}), ...(patch.featured != null ? { featured: patch.featured } : {}), ...(patch.status ? { status: patch.status } : {}), updatedAt: new Date().toISOString() }).where(eq(schema.products.id, pid)).run();
    mirrorRow("products", pid);
    revalidateAll();
  }, "Saved");
}
export async function duplicateProduct(pid: string) {
  return wrap(() => {
    const p = db.select().from(schema.products).where(eq(schema.products.id, pid)).get();
    if (!p) throw new Error("Not found");
    const nid = id("prd_");
    db.insert(schema.products).values({ ...p, id: nid, name: p.name + " (copy)", slug: p.slug + "-copy-" + nid.slice(-4), status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).run();
    const vs = db.select().from(schema.variants).where(eq(schema.variants.productId, pid)).all();
    if (vs.length) db.insert(schema.variants).values(vs.map((v) => ({ ...v, id: id("var_"), productId: nid }))).run();
    revalidateAll();
  }, "Duplicated as draft");
}

// ---------- Categories ----------
export async function saveCategory(cid: string | null, input: { name: string; slug?: string; description?: string; image?: string; parentId?: string | null; sortOrder?: number; featured?: boolean }) {
  return wrap(() => {
    const slug = slugify(input.slug || input.name);
    const row = { name: input.name, slug, description: input.description ?? "", image: input.image ?? "", parentId: input.parentId || null, sortOrder: input.sortOrder ?? 0, featured: !!input.featured };
    const theId = cid ?? id("cat_");
    if (cid) db.update(schema.categories).set(row).where(eq(schema.categories.id, cid)).run();
    else db.insert(schema.categories).values({ id: theId, ...row }).run();
    mirrorRow("categories", theId);
    revalidateAll();
  }, "Category saved");
}
export async function deleteCategory(cid: string) {
  return wrap(() => { db.delete(schema.categories).where(eq(schema.categories.id, cid)).run(); mirrorRow("categories", cid); revalidateAll(); }, "Category deleted");
}

// ---------- Orders ----------
export async function setOrderStatus(orderId: string, status: schema.Order["status"], opts?: { trackingNumber?: string; trackingUrl?: string; carrier?: string; notify?: boolean }) {
  return wrap(async () => { await updateOrderStatus(orderId, status, opts); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`); }, `Order marked ${status}`);
}
export async function bulkOrderStatus(ids: string[], status: schema.Order["status"]) {
  return wrap(async () => { for (const i of ids) await updateOrderStatus(i, status); revalidatePath("/admin/orders"); }, `${ids.length} order(s) marked ${status}`);
}
export async function setPaymentStatus(orderId: string, paymentStatus: schema.Order["paymentStatus"]) {
  return wrap(() => { db.update(schema.orders).set({ paymentStatus, updatedAt: new Date().toISOString() }).where(eq(schema.orders.id, orderId)).run(); addEvent(orderId, "payment", `Payment status set to ${paymentStatus} by admin`); revalidatePath(`/admin/orders/${orderId}`); }, "Payment status updated");
}
export async function saveOrderNote(orderId: string, note: string) {
  return wrap(() => { db.update(schema.orders).set({ adminNote: note }).where(eq(schema.orders.id, orderId)).run(); revalidatePath(`/admin/orders/${orderId}`); }, "Note saved");
}
export async function resendOrderEmail(orderId: string) {
  return wrap(async () => {
    const { notifyNewOrder } = await import("@/lib/orders");
    await notifyNewOrder(orderId);
    revalidatePath(`/admin/orders/${orderId}`);
  }, "Emails re-sent (check mail log)");
}

// ---------- Coupons ----------
export async function saveCoupon(cid: string | null, input: { code: string; type: "percent" | "fixed" | "free_shipping"; value: number; minOrder: number; maxUses?: number | null; startsAt?: string | null; expiresAt?: string | null; active: boolean }) {
  return wrap(() => {
    const row = { code: input.code.toUpperCase().trim(), type: input.type, value: input.type === "fixed" ? Math.round(input.value * 100) : Math.round(input.value), minOrder: Math.round(input.minOrder * 100), maxUses: input.maxUses || null, startsAt: input.startsAt || null, expiresAt: input.expiresAt || null, active: input.active };
    const theId = cid ?? id("cpn_");
    if (cid) db.update(schema.coupons).set(row).where(eq(schema.coupons.id, cid)).run();
    else db.insert(schema.coupons).values({ id: theId, ...row }).run();
    mirrorRow("coupons", theId);
    revalidatePath("/admin/coupons");
  }, "Coupon saved");
}
export async function deleteCoupon(cid: string) {
  return wrap(() => { db.delete(schema.coupons).where(eq(schema.coupons.id, cid)).run(); mirrorRow("coupons", cid); revalidatePath("/admin/coupons"); }, "Coupon deleted");
}

// ---------- Reviews ----------
export async function setReviewApproval(rid: string, approved: boolean) {
  return wrap(() => { db.update(schema.reviews).set({ approved }).where(eq(schema.reviews.id, rid)).run(); mirrorRow("reviews", rid); revalidateAll(); }, approved ? "Review approved" : "Review hidden");
}
export async function deleteReview(rid: string) {
  return wrap(() => { db.delete(schema.reviews).where(eq(schema.reviews.id, rid)).run(); mirrorRow("reviews", rid); revalidateAll(); }, "Review deleted");
}

// ---------- Pages ----------
export async function savePage(pid: string | null, input: { title: string; slug?: string; content: string; published: boolean; showInFooter: boolean }) {
  return wrap(() => {
    const slug = slugify(input.slug || input.title);
    const row = { title: input.title, slug, content: input.content, published: input.published, showInFooter: input.showInFooter, updatedAt: new Date().toISOString() };
    const theId = pid ?? id("pg_");
    if (pid) db.update(schema.pages).set(row).where(eq(schema.pages.id, pid)).run();
    else db.insert(schema.pages).values({ id: theId, ...row }).run();
    mirrorRow("pages", theId);
    revalidateAll();
  }, "Page saved");
}
export async function deletePage(pid: string) {
  return wrap(() => { db.delete(schema.pages).where(eq(schema.pages.id, pid)).run(); mirrorRow("pages", pid); revalidateAll(); }, "Page deleted");
}

// ---------- Settings ----------
export async function updateSettings(patch: Partial<StoreSettings>) {
  return wrap(() => { saveSettings(patch); revalidateAll(); }, "Settings saved");
}

// ---------- Customers ----------
export async function setUserRole(uid: string, role: "customer" | "admin") {
  return wrap(async () => {
    const me = await requireAdmin();
    if (me.id === uid && role !== "admin") throw new Error("You cannot demote yourself");
    db.update(schema.users).set({ role }).where(eq(schema.users.id, uid)).run();
    mirrorRow("users", uid);
    revalidatePath("/admin/customers");
  }, "Role updated");
}

// ---------- Plugins ----------
export async function updatePlugin(pluginId: string, patch: { enabled?: boolean; config?: Record<string, string> }) {
  return wrap(() => { savePlugin(pluginId, patch); mirrorRow("plugins", pluginId); if (pluginId === "firestore") scheduleAutoSync(); revalidateAll(); }, patch.enabled === true ? "Plugin enabled" : patch.enabled === false ? "Plugin disabled" : "Configuration saved");
}

export async function testPlugin(pluginId: string, config?: Record<string, string>): Promise<R> {
  try {
    await requireAdmin();
    const def = pluginById(pluginId);
    if (!def) throw new Error("Unknown plugin");
    const saved = getPluginState(pluginId).config;
    const c = { ...saved };
    for (const [k, v] of Object.entries(config ?? {})) if (v !== "") c[k] = v;
    let msg = "OK";
    if (pluginId === "razorpay") msg = await testRazorpay(c);
    else if (pluginId === "cashfree") msg = await testCashfree(c);
    else if (pluginId === "r2") msg = await testR2(c);
    else if (pluginId === "cloudflare") msg = await testCloudflare(c);
    else if (pluginId === "shiprocket") msg = await testShiprocket(c);
    else if (pluginId === "firestore") msg = await testFirestore(c);
    else if (pluginId === "smtp") {
      await makeTransport(c).verify();
      const to = c.adminEmail || c.fromEmail || c.user;
      const r = await sendMail({ to, subject: "Test email from your store", html: "<p>Your SMTP plugin is configured correctly. 🎉</p>", config: c });
      if (!r.ok) throw new Error(r.error);
      msg = `SMTP verified and test email sent to ${to}`;
    }
    recordTest(pluginId, true, msg);
    revalidatePath(`/admin/plugins/${pluginId}`);
    return { ok: true, message: msg };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    recordTest(pluginId, false, err);
    revalidatePath(`/admin/plugins/${pluginId}`);
    return { ok: false, error: err };
  }
}

export async function purgeCloudflare() {
  return wrap(async () => { await cloudflarePurge(getPluginState("cloudflare").config); }, "Cloudflare cache purged");
}

export async function adminLogout() {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/admin/login");
}

// ---------- Firestore ----------
export async function firestoreFullSync(): Promise<R> {
  try { await requireAdmin(); const n = await fullSync(); revalidatePath("/admin/plugins/firestore"); return { ok: true, message: `Synced ${n} documents to Firestore` }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
export async function firestoreRestore(): Promise<R> {
  try { await requireAdmin(); const n = await restoreFromFirestore(); revalidateAll(); return { ok: true, message: `Restored ${n} rows from Firestore` }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// ---------- Shiprocket ----------
export async function shiprocketCouriers(orderId: string) {
  try { await requireAdmin(); const d = getOrder(orderId); if (!d) throw new Error("Order not found"); return { ok: true as const, couriers: await getCouriers(d.order, d.items) }; }
  catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}
export async function shiprocketShip(orderId: string, courierId?: number): Promise<R> {
  try { await requireAdmin(); const r = await shipOrder(orderId, courierId); revalidatePath(`/admin/orders/${orderId}`); const { sendShippingUpdate } = await import("@/lib/plugins/mail"); const o = getOrder(orderId); if (o) sendShippingUpdate(o.order).catch(() => {}); return { ok: true, message: `Shipped via ${r.courier} · AWB ${r.awb}` }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
export async function shiprocketCreateOnly(orderId: string): Promise<R> {
  try { await requireAdmin(); const r = await createShiprocketOrder(orderId); revalidatePath(`/admin/orders/${orderId}`); return { ok: true, message: `Created in Shiprocket (#${r.shiprocketOrderId})` }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
export async function shiprocketTrack(orderId: string) {
  try { await requireAdmin(); return { ok: true as const, ...(await trackOrder(orderId)) }; }
  catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}
export async function shiprocketCancel(orderId: string): Promise<R> {
  try { await requireAdmin(); await cancelShipment(orderId); revalidatePath(`/admin/orders/${orderId}`); return { ok: true, message: "Shipment cancelled" }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
