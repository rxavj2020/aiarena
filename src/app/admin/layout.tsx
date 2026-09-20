import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { getSettings } from "@/lib/settings";
import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const h = await headers();
  const path = h.get("x-pathname") ?? "";
  if (!s || s.role !== "admin") {
    if (path.startsWith("/admin/login")) return <ToastProvider>{children}</ToastProvider>;
    redirect("/admin/login");
  }
  if (path.startsWith("/admin/login")) redirect("/admin");
  const set = await getSettings();
  const pendingOrders = db.select({ n: sql<number>`count(*)` }).from(schema.orders).where(sql`status in ('pending','confirmed')`).get()?.n ?? 0;
  const pendingReviews = db.select({ n: sql<number>`count(*)` }).from(schema.reviews).where(eq(schema.reviews.approved, false)).get()?.n ?? 0;
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f8f9fb]">
        <Sidebar storeName={set.storeName} pendingOrders={pendingOrders} pendingReviews={pendingReviews} />
        <main className="flex-1 min-w-0 p-4 lg:p-8 pb-20 lg:pb-8 pt-[72px] lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
