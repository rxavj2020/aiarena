import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Compatibility alias for /store/{slug}/* pages. */
export default async function SiteAliasCatchAll({ params }: { params: Promise<{ slug: string; rest: string[] }> }) {
  const { slug, rest } = await params;
  redirect(`/store/${slug}${rest.map((r) => `/${encodeURIComponent(r)}`).join("")}`);
}
