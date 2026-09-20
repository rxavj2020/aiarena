export function formatMoney(minor: number, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);
}
export function formatDate(d: string | Date) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
