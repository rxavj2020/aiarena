import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Subscriber Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const s = await getSession();
  if (s) redirect("/dashboard");
  const next = (await searchParams).next;
  redirect(`/platform/login?next=${encodeURIComponent(next || "/dashboard")}`);
}
