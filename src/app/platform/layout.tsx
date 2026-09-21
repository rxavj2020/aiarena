import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PlatformLanding } from "@/components/platform/PlatformLanding";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aurelia Studio", robots: { index: false } };

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const path = (await headers()).get("x-pathname") ?? "";
  if (!session || session.role !== "admin") {
    if (path === "/platform" || path === "/platform/") return <PlatformLanding />;
    if (path.startsWith("/platform/login") || path.startsWith("/platform/signup")) return children;
    redirect(`/platform/login?next=${encodeURIComponent(path || "/dashboard")}`);
  }
  redirect("/dashboard");
}
