import { NextResponse } from "next/server";
import { resolveCart, computeTotals } from "@/lib/cart";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const [lines, s] = await Promise.all([resolveCart(), getSettings()]);
  const totals = await computeTotals(lines);

  return NextResponse.json({
    lines,
    totals,
    currency: s.currency,
    freeAbove: s.shipping.freeAbove,
  });
}
