import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cache } from "react";

export type StoreSettings = {
  storeName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  locale: string;
  primaryColor: string;
  accentColor: string;
  announcement: string;
  announcementEnabled: boolean;
  hero: { title: string; subtitle: string; ctaText: string; ctaLink: string; image: string };
  homeSections: { id: string; type: "featured" | "categories" | "banner" | "newest" | "text" | "usps"; title: string; enabled: boolean; data?: Record<string, string> }[];
  usps: { icon: string; title: string; text: string }[];
  footerText: string;
  social: { instagram: string; facebook: string; twitter: string; youtube: string };
  shipping: { flatRate: number; freeAbove: number; codEnabled: boolean; codFee: number; estimateText: string };
  tax: { enabled: boolean; ratePercent: number; inclusive: boolean; label: string };
  notifications: { adminOrderEmail: string; sendCustomerConfirmation: boolean; sendAdminNewOrder: boolean; sendShippingUpdates: boolean };
  seo: { title: string; description: string; ogImage: string };
  scripts: { headHtml: string; bodyHtml: string };
  nav: { label: string; href: string }[];
};

export const defaultSettings: StoreSettings = {
  storeName: "Aurelia",
  tagline: "Thoughtfully made goods for everyday life",
  logoUrl: "",
  faviconUrl: "",
  supportEmail: "support@example.com",
  supportPhone: "+91 98765 43210",
  address: "12 MG Road, Bengaluru, Karnataka 560001",
  currency: "INR",
  locale: "en-IN",
  primaryColor: "#0f172a",
  accentColor: "#d97706",
  announcement: "Free shipping on orders above ₹999 · Easy 7-day returns",
  announcementEnabled: true,
  hero: {
    title: "Everyday essentials, elevated.",
    subtitle: "Discover a curated collection of home, lifestyle and wellness products crafted with care.",
    ctaText: "Shop the collection",
    ctaLink: "/shop",
    image: "",
  },
  homeSections: [
    { id: "usps", type: "usps", title: "", enabled: true },
    { id: "categories", type: "categories", title: "Shop by category", enabled: true },
    { id: "featured", type: "featured", title: "Featured picks", enabled: true },
    { id: "banner", type: "banner", title: "Season sale is live", enabled: true, data: { text: "Up to 40% off on selected items. Limited time only.", cta: "Shop sale", link: "/shop?sort=discount", image: "" } },
    { id: "newest", type: "newest", title: "New arrivals", enabled: true },
  ],
  usps: [
    { icon: "truck", title: "Fast delivery", text: "Dispatched within 24 hours" },
    { icon: "shield", title: "Secure payments", text: "UPI, cards, netbanking & COD" },
    { icon: "refresh", title: "Easy returns", text: "7-day hassle-free returns" },
    { icon: "headset", title: "Real support", text: "Humans, 9am–9pm every day" },
  ],
  footerText: "© Aurelia. All rights reserved.",
  social: { instagram: "", facebook: "", twitter: "", youtube: "" },
  shipping: { flatRate: 7900, freeAbove: 99900, codEnabled: true, codFee: 4900, estimateText: "Delivered in 3–6 business days" },
  tax: { enabled: true, ratePercent: 18, inclusive: true, label: "GST" },
  notifications: { adminOrderEmail: "", sendCustomerConfirmation: true, sendAdminNewOrder: true, sendShippingUpdates: true },
  seo: { title: "Aurelia — Everyday essentials, elevated", description: "Curated home, lifestyle and wellness products.", ogImage: "" },
  scripts: { headHtml: "", bodyHtml: "" },
  nav: [
    { label: "Shop", href: "/shop" },
    { label: "Categories", href: "/categories" },
    { label: "About", href: "/pages/about" },
    { label: "Contact", href: "/contact" },
  ],
};

function deepMerge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return (patch ?? base) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" && !Array.isArray(v) ? deepMerge(b, v) : v;
  }
  return out as T;
}

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const row = db.select().from(schema.settings).where(eq(schema.settings.key, "store")).get();
  return row ? deepMerge(defaultSettings, row.value) : defaultSettings;
});

export function getSettingsSync(): StoreSettings {
  const row = db.select().from(schema.settings).where(eq(schema.settings.key, "store")).get();
  return row ? deepMerge(defaultSettings, row.value) : defaultSettings;
}

export function saveSettings(patch: Partial<StoreSettings>) {
  const current = getSettingsSync();
  const next = deepMerge(current, patch);
  db.insert(schema.settings)
    .values({ key: "store", value: next })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: next } })
    .run();
  return next;
}
