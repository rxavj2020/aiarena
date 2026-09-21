import { notFound } from "next/navigation";
import { getTenantBySlug, requireWorkspaceAccess, workspaceSetup } from "@/lib/platform";
import { WorkspaceSetup } from "@/components/platform/WorkspaceSetup";
import { isGoogleOAuthConfigured } from "@/lib/plugins/oauth";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ oauth?: string; oauth_error?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const tenant = getTenantBySlug(slug);
  if (!tenant) notFound();
  await requireWorkspaceAccess(tenant.id);
  return <div>{query.oauth_error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">Google Firestore connection could not be completed: {query.oauth_error}</div> : null}{query.oauth === "connected" ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">Google Firestore OAuth connected and tested for this workspace.</div> : null}<WorkspaceSetup tenant={tenant} setup={workspaceSetup(tenant.id)} oauthConfigured={isGoogleOAuthConfigured()} /></div>;
}
