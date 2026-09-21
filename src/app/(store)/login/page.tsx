import { redirect } from "next/navigation";

export const metadata = { title: "Log in to Aurelia Studio" };

/** SaaS owner login alias. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next;
  redirect(`/platform/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}
