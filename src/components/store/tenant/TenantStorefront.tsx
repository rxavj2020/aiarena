import { TenantShell } from "./TenantShell";
import { TenantHome } from "./TenantHome";
import { getTenantSite, type TenantSite } from "@/lib/tenant-site";

/**
 * A complete website for one tenant: themed chrome + home content.
 * Used by `/store/{slug}` and by the root URL of a verified custom domain.
 */
export async function TenantStorefront({ site, currency = "INR", cartCount = 0, supportEmail, supportPhone }: {
  site: TenantSite;
  currency?: string;
  cartCount?: number;
  supportEmail?: string;
  supportPhone?: string;
}) {
  return (
    <TenantShell site={site} cartCount={cartCount} supportEmail={supportEmail} supportPhone={supportPhone}>
      <TenantHome site={site} currency={currency} />
    </TenantShell>
  );
}

/** Convenience for host-root rendering where only the slug is known. */
export async function TenantStorefrontBySlug({ slug, ...rest }: { slug: string } & Omit<Parameters<typeof TenantStorefront>[0], "site">) {
  const site = await getTenantSite(slug);
  if (!site) return null;
  return <TenantStorefront site={site} {...rest} />;
}
