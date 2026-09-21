import { handleGoogleCallback } from "@/lib/plugins/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleGoogleCallback(request);
}
