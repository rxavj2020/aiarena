import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/plugins/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await req.formData();
  const folder = String(fd.get("folder") || "products").replace(/[^a-z0-9-]/gi, "");
  const files = fd.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  const out = [];
  for (const f of files) {
    if (f.size > 8 * 1024 * 1024) return NextResponse.json({ error: `${f.name} is larger than 8MB` }, { status: 400 });
    if (!f.type.startsWith("image/")) return NextResponse.json({ error: `${f.name} is not an image` }, { status: 400 });
    out.push(await uploadFile(f, folder));
  }
  return NextResponse.json({ files: out });
}
