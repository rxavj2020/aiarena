import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getTenantSite } from "@/lib/tenant-site";
import { TenantHome } from "@/components/store/tenant/TenantHome";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  return site ? { title: site.name, description: site.tagline } : { title: "Store" };
}

export default async function TenantHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  if (!site) notFound();
  const settings = await getSettings();
  return <TenantHome site={site} settings={settings} />;
}
