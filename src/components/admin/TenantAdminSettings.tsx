import { WorkspaceSetup } from "@/components/platform/WorkspaceSetup";
import { isGoogleOAuthConfigured } from "@/lib/plugins/oauth";
import { workspaceSetup } from "@/lib/platform";
import type { Tenant } from "@/lib/db/schema";

/**
 * The subscriber settings route deliberately reuses the guarded store setup
 * surface. It keeps branding, Firestore, domains and launch state in one
 * tenant-scoped page instead of sending subscribers to global demo settings.
 */
export function TenantAdminSettings({ tenant }: { tenant: Tenant }) {
  return <WorkspaceSetup tenant={tenant} setup={workspaceSetup(tenant.id)} oauthConfigured={isGoogleOAuthConfigured()} oauthReturnTo="/admin/settings" />;
}
