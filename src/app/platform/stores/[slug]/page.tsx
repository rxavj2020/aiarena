import { notFound } from "next/navigation";
import { getTenantBySlug, requireWorkspaceAccess, workspaceSetup } from "@/lib/platform";
import { WorkspaceSetup } from "@/components/platform/WorkspaceSetup";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = getTenantBySlug(slug);
  if (!tenant) notFound();
  await requireWorkspaceAccess(tenant.id);
  return <WorkspaceSetup tenant={tenant} setup={workspaceSetup(tenant.id)} />;
}
