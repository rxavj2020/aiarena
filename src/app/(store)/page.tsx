import { headers } from "next/headers";
import { PlatformLanding } from "@/components/platform/PlatformLanding";
import { getTenantByHost } from "@/lib/platform";
import { TenantStorefront } from "@/components/store/TenantStorefront";

export const dynamic = "force-dynamic";

/**
 * The bare platform host is the SaaS website. A verified custom domain owns
 * its root URL and renders the corresponding tenant storefront instead.
 */
export default async function HomePage() {
  const host = (await headers()).get("host");
  const tenant = host ? getTenantByHost(host) : null;
  if (tenant) return <TenantStorefront tenant={tenant} />;
  return <PlatformLanding />;
}
