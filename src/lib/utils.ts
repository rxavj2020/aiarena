export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
export function id(prefix = "") {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
