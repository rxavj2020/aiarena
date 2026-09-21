import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { readCart } from "@/lib/cart";
import { getTenantSite } from "@/lib/tenant-site";
import { TenantShell } from "@/components/store/tenant/TenantShell";

export const dynamic = "force-dynamic";

/**
 * Chrome of `/store/{slug}/*` — one website, one theme, one home link.
 * Every page inside inherits the site theme and the visitor's saved
 * appearance; nothing here links out to the platform.
 */
export default async function TenantSiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getTenantSite(slug);
  if (!site) notFound();
  const [cart, settings] = await Promise.all([readCart(site.tenant.id), getSettings()]);
  const cartCount = cart.reduce((a, l) => a + l.qty, 0);

  return (
    <TenantShell site={site} cartCount={cartCount} supportEmail={settings.supportEmail} supportPhone={settings.supportPhone}>
      {children}
    </TenantShell>
  );
}
