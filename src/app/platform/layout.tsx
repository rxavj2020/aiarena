import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCurrentUserWorkspaces, getCurrentWorkspace } from "@/lib/platform";
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
  const [{ workspaces }, current] = await Promise.all([getCurrentUserWorkspaces(), getCurrentWorkspace()]);
  return <PlatformShell workspaces={workspaces} current={current.tenant}>{children}</PlatformShell>;
}
