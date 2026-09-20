import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.seo.title || s.storeName, template: `%s · ${s.storeName}` },
    description: s.seo.description,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    openGraph: { title: s.seo.title, description: s.seo.description, images: s.seo.ogImage ? [s.seo.ogImage] : undefined },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await getSettings();
  return (
    <html lang="en" style={{ ["--primary" as string]: s.primaryColor, ["--accent" as string]: s.accentColor }}>
      <body>
        {children}
        {s.scripts.bodyHtml ? <div dangerouslySetInnerHTML={{ __html: s.scripts.bodyHtml }} /> : null}
      </body>
    </html>
  );
}
