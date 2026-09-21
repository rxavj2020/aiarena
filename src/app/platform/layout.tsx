import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCurrentWorkspace } from "@/lib/platform";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PlatformLanding } from "@/components/platform/PlatformLanding";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aurelia Studio", robots: { index: false } };

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const path = (await headers()).get("x-pathname") ?? "";
  if (!session || session.role !== "admin") {
    if (path === "/platform" || path === "/platform/") return <PlatformLanding />;
    if (path.startsWith("/platform/login") || path.startsWith("/platform/signup")) return children;
    redirect(`/platform/login?next=${encodeURIComponent(path || "/platform")}`);
  }
  if (path.startsWith("/platform/login") || path.startsWith("/platform/signup")) redirect("/platform");
  const current = await getCurrentWorkspace();
  // Once a store is live, the subscriber's natural landing page is the
  // private operational console. Keep /platform for first-store onboarding
  // and setup, not as a place to choose between stores.
  if (path.startsWith("/platform/new") && current.tenant) {
    redirect(current.tenant.status === "active" ? "/admin" : `/platform/stores/${current.tenant.slug}`);
  }
  if ((path === "/platform" || path === "/platform/") && current.tenant?.status === "active") redirect("/admin");
  return <PlatformShell current={current.tenant}>{children}</PlatformShell>;
}
