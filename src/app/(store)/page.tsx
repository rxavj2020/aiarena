import { headers } from "next/headers";
import { PlatformLanding } from "@/components/platform/PlatformLanding";
import { getTenantByHost } from "@/lib/platform";
import { getSettings } from "@/lib/settings";
import { readCart } from "@/lib/cart";
import { TenantStorefront } from "@/components/store/tenant/TenantStorefront";

export const dynamic = "force-dynamic";

/**
 * The bare platform host is the SaaS website. A verified custom domain owns
 * its root URL and renders the corresponding tenant storefront instead —
 * with that website's own chrome, theme and home link.
 */
export default async function HomePage() {
  const host = (await headers()).get("host");
  const tenant = host ? getTenantByHost(host) : null;
  if (tenant) {
    const { getTenantSite } = await import("@/lib/tenant-site");
    const site = await getTenantSite(tenant.slug);
    if (site) {
      const [cart, settings] = await Promise.all([readCart(tenant.id), getSettings()]);
      return (
        <TenantStorefront
          site={site}
          currency={settings.currency}
          cartCount={cart.reduce((a, l) => a + l.qty, 0)}
          supportEmail={settings.supportEmail}
          supportPhone={settings.supportPhone}
        />
      );
    }
  }
  return <PlatformLanding />;
}
