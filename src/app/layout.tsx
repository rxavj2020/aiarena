import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { getSettings, type StoreSettings } from "@/lib/settings";
import { getTenantByHost, getTenantBySlug } from "@/lib/platform";

async function getRequestSettings(): Promise<StoreSettings> {
  const base = await getSettings();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const slug = pathname.match(/^\/site\/([^/]+)/)?.[1];
  const host = (await headers()).get("host");
  const tenant = slug ? getTenantBySlug(slug) : host ? getTenantByHost(host) : null;
  if (!tenant) return base;
  // Tenant storefronts must not inherit another store's identity or custom scripts.
  return {
    ...base,
    storeName: tenant.name,
    tagline: tenant.tagline,
    logoUrl: tenant.logoUrl ?? "",
    faviconUrl: tenant.faviconUrl ?? "",
    primaryColor: tenant.primaryColor,
    accentColor: tenant.accentColor,
    seo: { ...base.seo, title: tenant.name, description: tenant.tagline },
    scripts: { headHtml: "", bodyHtml: "" },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getRequestSettings();
  return {
    title: { default: s.seo.title || s.storeName, template: `%s · ${s.storeName}` },
    description: s.seo.description,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    openGraph: { title: s.seo.title, description: s.seo.description, images: s.seo.ogImage ? [s.seo.ogImage] : undefined },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await getRequestSettings();
  return (
    <html lang="en" style={{ ["--primary" as string]: s.primaryColor, ["--accent" as string]: s.accentColor }}>
      <body>
        {children}
        {s.scripts.bodyHtml ? <div dangerouslySetInnerHTML={{ __html: s.scripts.bodyHtml }} /> : null}
      </body>
    </html>
  );
}
