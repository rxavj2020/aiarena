import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { getSettings, type StoreSettings } from "@/lib/settings";
import { getTenantByHost, getTenantBySlug } from "@/lib/platform";

const platformSettings = (base: StoreSettings): StoreSettings => ({
  ...base,
  storeName: "Aurelia Studio",
  tagline: "Build a commerce brand that feels like yours.",
  primaryColor: "#11110f",
  accentColor: "#e9c78d",
  seo: {
    title: "Aurelia Studio — build your commerce brand",
    description: "Build, launch and run a fast, secure e-commerce website from one workspace.",
    ogImage: "",
  },
  scripts: { headHtml: "", bodyHtml: "" },
});

const tenantSettings = (base: StoreSettings, tenant: NonNullable<ReturnType<typeof getTenantBySlug>>): StoreSettings => ({
  ...base,
  storeName: tenant.name,
  tagline: tenant.tagline,
  logoUrl: tenant.logoUrl ?? "",
  faviconUrl: tenant.faviconUrl ?? "",
  primaryColor: tenant.primaryColor,
  accentColor: tenant.accentColor,
  seo: { ...base.seo, title: tenant.name, description: tenant.tagline },
  scripts: { headHtml: "", bodyHtml: "" },
});

async function getRequestSettings(): Promise<StoreSettings> {
  const base = await getSettings();
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const host = requestHeaders.get("host");
  const slug = pathname.match(/^\/(?:site|store)\/([^/]+)/)?.[1];
  // A verified custom domain owns its root URL, even though that URL shares the
  // platform's route tree. Keep its metadata tenant-specific.
  const tenant = slug ? getTenantBySlug(slug) : host ? getTenantByHost(host) : null;
  if (tenant && pathname === "/") return tenantSettings(base, tenant);
  if (pathname === "/" || pathname.startsWith("/platform")) return platformSettings(base);
  if (!tenant) return base;
  // Tenant storefronts must not inherit another store's identity or custom scripts.
  return tenantSettings(base, tenant);
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
