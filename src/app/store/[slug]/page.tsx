import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/platform";
import { TenantStorefront } from "@/components/store/TenantStorefront";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = getTenantBySlug((await params).slug);
  return tenant ? { title: tenant.name, description: tenant.tagline } : { title: "Store" };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = getTenantBySlug((await params).slug);
  if (!tenant) notFound();
  return <TenantStorefront tenant={tenant} />;
}
