import crypto from "node:crypto";

const prefix = "enc:v1:";

function key() {
  return crypto.createHash("sha256").update(process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32-chars-min").digest();
}

/** Encrypts tenant credentials before they are persisted. The plaintext is never returned to a client. */
export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${prefix}${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSecret(value: string) {
  if (!value.startsWith(prefix)) return value;
  const [ivText, tagText, ciphertextText] = value.slice(prefix.length).split(".");
  if (!ivText || !tagText || !ciphertextText) throw new Error("Invalid encrypted secret");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}
