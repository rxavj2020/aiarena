"use server";

import { disconnectPluginOAuth, startGooglePluginOAuth } from "@/lib/plugins/oauth";
import { revalidatePath } from "next/cache";

export async function connectPluginOAuth(pluginId: string, returnTo: string, formData: FormData) {
  await startGooglePluginOAuth(pluginId, returnTo, formData);
}

export async function disconnectOAuth(pluginId: string) {
  try {
    const result = await disconnectPluginOAuth(pluginId);
    revalidatePath(`/admin/plugins/${pluginId}`);
    return result;
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
  }
}
