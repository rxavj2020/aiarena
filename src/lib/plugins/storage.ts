import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getPluginState } from "./store";
import fs from "node:fs/promises";
import path from "node:path";
import { id } from "@/lib/utils";

export function r2Client(config?: Record<string, string>) {
  const c = config ?? getPluginState("r2").config;
  return new S3Client({
    region: "auto",
    endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
}

export async function testR2(config: Record<string, string>) {
  const client = r2Client(config);
  await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
  return `Connected to bucket "${config.bucket}"`;
}

export async function uploadFile(file: File, folder = "products"): Promise<{ url: string; provider: "r2" | "local" }> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${id()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const r2 = getPluginState("r2");
  if (r2.enabled) {
    const client = r2Client(r2.config);
    await client.send(new PutObjectCommand({ Bucket: r2.config.bucket, Key: key, Body: buf, ContentType: file.type || "application/octet-stream", CacheControl: "public, max-age=31536000, immutable" }));
    return { url: `${r2.config.publicUrl.replace(/\/$/, "")}/${key}`, provider: "r2" };
  }
  const dest = path.join(process.cwd(), "public", "uploads", key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return { url: `/uploads/${key}`, provider: "local" };
}
