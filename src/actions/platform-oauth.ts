"use server";

import { startWorkspaceFirestoreOAuth } from "@/lib/platform-oauth";

export async function connectWorkspaceFirestoreOAuth(tenantId: string, returnTo: string, formData: FormData) {
  await startWorkspaceFirestoreOAuth(tenantId, returnTo, formData);
}
