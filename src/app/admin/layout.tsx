import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/admin/Sidebar";
import { TenantAdminWorkspace } from "@/components/admin/TenantAdminWorkspace";
import { TenantAdminOrders } from "@/components/admin/TenantAdminOrders";
import { TenantAdminSettings } from "@/components/admin/TenantAdminSettings";
import { TenantAdminPlugins } from "@/components/admin/TenantAdminPlugins";
import { listTenantOrders } from "@/lib/tenant-firestore";
import { ToastProvider } from "@/components/ui/Toast";
import { getSettings } from "@/lib/settings";
import { db, schema } from "@/lib/db";
import { DEFAULT_TENANT_ID, getCurrentWorkspace, workspaceSetup } from "@/lib/platform";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const h = await headers();
  const path = h.get("x-pathname") ?? "";
  if (!s || s.role !== "admin") {
    if (path.startsWith("/admin/login")) return <ToastProvider>{children}</ToastProvider>;
    redirect("/login?next=/admin");
  }
  if (path.startsWith("/admin/login")) redirect("/admin");
  const set = await getSettings();
  const current = (await getCurrentWorkspace()).tenant;
  // A newly registered owner has no workspace until setup is completed. Never
  // fall back to Aurelia's demo workspace for that account.
  if (!current) redirect("/platform");
  const workspace = current;
  const isLegacyWorkspace = workspace.id === DEFAULT_TENANT_ID;
  const tenantSetup = isLegacyWorkspace ? null : workspaceSetup(workspace.id);
  const tenantOrders = !isLegacyWorkspace && tenantSetup?.firestoreConnected ? await listTenantOrders(workspace.id).catch(() => []) : [];
  const pendingOrders = isLegacyWorkspace
    ? db.select({ n: sql<number>`count(*)` }).from(schema.orders).where(sql`status in ('pending','confirmed')`).get()?.n ?? 0
    : tenantOrders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status.toLowerCase())).length;
  const pendingReviews = isLegacyWorkspace ? db.select({ n: sql<number>`count(*)` }).from(schema.reviews).where(eq(schema.reviews.approved, false)).get()?.n ?? 0 : 0;
  let workspaceContent: React.ReactNode = children;
  if (!isLegacyWorkspace) {
    if (path === "/admin" || path.startsWith("/admin/products")) workspaceContent = <TenantAdminWorkspace tenant={workspace} firestoreConnected={!!tenantSetup?.firestoreConnected} />;
    else if (path === "/admin/orders") workspaceContent = <TenantAdminOrders tenant={workspace} firestoreConnected={!!tenantSetup?.firestoreConnected} />;
    else if (path === "/admin/settings") workspaceContent = <TenantAdminSettings tenant={workspace} />;
    else if (path === "/admin/plugins") workspaceContent = <TenantAdminPlugins tenant={workspace} />;
    else if (path.startsWith("/admin/plugins/")) workspaceContent = <TenantAdminPlugins tenant={workspace} provider={path.split("/").filter(Boolean).pop()} />;
    else workspaceContent = <TenantAdminWorkspace tenant={workspace} firestoreConnected={!!tenantSetup?.firestoreConnected} />;
  }
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f8f9fb]">
        <Sidebar storeName={workspace.name || set.storeName} publicHref={`/store/${workspace.slug}`} pendingOrders={pendingOrders} pendingReviews={pendingReviews} tenantWorkspace={!isLegacyWorkspace} />
        <main className="flex-1 min-w-0 p-4 lg:p-8 pb-20 lg:pb-8 pt-[72px] lg:pt-8">{workspaceContent}</main>
      </div>
    </ToastProvider>
  );
}
