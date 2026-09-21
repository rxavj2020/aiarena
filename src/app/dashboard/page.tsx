import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCurrentWorkspace, ensureDefaultMembership } from "@/lib/platform";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { tenantPluginDefs, getTenantPluginState, maskedTenantPluginConfig } from "@/lib/tenant-plugins";
import { listTenantProducts, listTenantOrders } from "@/lib/tenant-firestore";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) {
    redirect("/platform/login?next=/dashboard");
  }

  // Ensure workspace exists
  let current = await getCurrentWorkspace();
  if (!current.tenant) {
    ensureDefaultMembership(session.id);
    current = await getCurrentWorkspace();
  }

  const tenant = current.tenant;
  if (!tenant) {
    redirect("/platform/new");
  }

  // Query products for this tenant
  const dbProducts = db
    .select()
    .from(schema.products)
    .where(eq(schema.products.tenantId, tenant.id))
    .orderBy(desc(schema.products.updatedAt))
    .all();

  // If this tenant has no custom products yet and is the default tenant, load default catalog
  const isDefault = tenant.id === "tenant_aurelia";
  let fallbackProducts = dbProducts;
  if (!dbProducts.length && isDefault) {
    fallbackProducts = db
      .select()
      .from(schema.products)
      .orderBy(desc(schema.products.updatedAt))
      .limit(20)
      .all();
  }

  // Also query Firestore products if connected
  const firestoreProducts = await listTenantProducts(tenant.id, { includeDrafts: true }).catch(() => []);

  // Merge products
  const formattedDbProducts = fallbackProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    status: p.status,
    image: (p.images && Array.isArray(p.images) && p.images[0]) || "",
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  const allProducts = formattedDbProducts.length ? formattedDbProducts : firestoreProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    status: p.status,
    image: p.image,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  // Query orders for this tenant
  const dbOrders = db
    .select()
    .from(schema.orders)
    .where(isDefault ? undefined : eq(schema.orders.tenantId, tenant.id))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  const firestoreOrders = await listTenantOrders(tenant.id).catch(() => []);

  const formattedOrders = dbOrders.length ? dbOrders.map((o) => ({
    id: o.id,
    orderNumber: String(o.orderNumber),
    email: o.email,
    phone: o.phone || "",
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: o.total,
    itemCount: 1,
    createdAt: o.createdAt,
    shippingAddress: typeof o.shippingAddress === "object" ? {
      name: o.shippingAddress?.name || "",
      city: o.shippingAddress?.city || "",
      state: o.shippingAddress?.state || "",
    } : null,
  })) : firestoreOrders;

  // Query plugins
  const defs = tenantPluginDefs();
  const plugins = defs.map((def) => {
    const state = getTenantPluginState(tenant.id, def.id);
    const masked = maskedTenantPluginConfig(tenant.id, def.id);
    return {
      def,
      state,
      maskedConfig: masked.config,
      hasSecret: masked.hasSecret,
    };
  });

  // Query domains
  const domains = db
    .select()
    .from(schema.storeDomains)
    .where(eq(schema.storeDomains.tenantId, tenant.id))
    .all();

  // Overview stats + site theme for this workspace
  const orderRows = db.select().from(schema.orders).where(eq(schema.orders.tenantId, tenant.id)).all();
  const stats = {
    revenue: orderRows.filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "cod").reduce((a, o) => a + o.total, 0),
    orderCount: orderRows.length,
    productCount: allProducts.length,
    lowStockCount: allProducts.filter((p) => p.status === "active" && p.stock <= 5).length,
    pendingOrders: orderRows.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length,
  };
  const { themeOfTenant } = await import("@/lib/tenant-site");
  const siteTheme = themeOfTenant(tenant);
  const settingsRow = db.select().from(schema.settings).where(eq(schema.settings.key, "store")).get();
  const currency = (settingsRow?.value as { currency?: string } | null)?.currency ?? "INR";

  return (
    <DashboardClient
      user={session}
      tenant={tenant}
      initialProducts={allProducts}
      initialOrders={formattedOrders}
      plugins={plugins}
      domains={domains}
      theme={siteTheme}
      stats={stats}
      initialTab={sp.tab}
      currency={currency}
    />
  );
}
