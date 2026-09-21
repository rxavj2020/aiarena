import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Compatibility alias. Canonical websites live at /store/{slug}. */
export default async function SiteAliasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/store/${slug}`);
}
