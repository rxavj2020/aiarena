import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cache } from "react";

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  ctaText?: string;
  ctaLink?: string;
  enabled: boolean;
  sortOrder: number;
  bgColor?: string;
};

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
  heroBanners: Banner[];
  banners: Banner[];
  homeSections: { id: string; type: "featured" | "categories" | "banner" | "banners" | "hero_banners" | "carousel" | "deals" | "newest" | "text" | "usps"; title: string; enabled: boolean; data?: Record<string, string> }[];
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
  tagline: "Clothing & Jewellery · Crafted for you",
  logoUrl: "",
  faviconUrl: "",
  supportEmail: "support@example.com",
  supportPhone: "+91 98765 43210",
  address: "12 MG Road, Bengaluru, Karnataka 560001",
  currency: "INR",
  locale: "en-IN",
  primaryColor: "#2874f0",
  accentColor: "#fb641b",
  announcement: "Free shipping on orders above ₹999 · Easy 7-day returns · 100% Genuine",
  announcementEnabled: true,
  hero: {
    title: "Everyday elegance, elevated.",
    subtitle: "Discover our curated collection of clothing and jewellery crafted with care for modern lifestyles.",
    ctaText: "Shop the collection",
    ctaLink: "/shop",
    image: "",
  },
  heroBanners: [
    {
      id: "hero_1",
      title: "Festive Jewellery Collection",
      subtitle: "Up to 40% off on gold-plated & silver jewellery",
      image: "https://picsum.photos/seed/jewellery-festive/1200/400",
      mobileImage: "https://picsum.photos/seed/jewellery-festive/600/400",
      ctaText: "Shop Jewellery",
      ctaLink: "/shop?category=jewellery",
      enabled: true,
      sortOrder: 1,
      bgColor: "#fff8e1",
    },
    {
      id: "hero_2",
      title: "New Clothing Arrivals",
      subtitle: "Trendy ethnic & western wear for every occasion",
      image: "https://picsum.photos/seed/clothing-new/1200/400",
      mobileImage: "https://picsum.photos/seed/clothing-new/600/400",
      ctaText: "Explore Clothing",
      ctaLink: "/shop?category=clothing",
      enabled: true,
      sortOrder: 2,
      bgColor: "#e8f0fe",
    },
    {
      id: "hero_3",
      title: "Bridal Jewellery Sets",
      subtitle: "Complete bridal sets starting at ₹8999",
      image: "https://picsum.photos/seed/bridal-set/1200/400",
      mobileImage: "https://picsum.photos/seed/bridal-set/600/400",
      ctaText: "Shop Bridal",
      ctaLink: "/shop?category=bridal-collection",
      enabled: true,
      sortOrder: 3,
      bgColor: "#fce4ec",
    },
  ],
  banners: [
    {
      id: "banner_1",
      title: "Wedding Season Sale",
      subtitle: "Flat 30% off on bridal jewellery",
      image: "https://picsum.photos/seed/wedding-sale/600/300",
      ctaText: "Shop Now",
      ctaLink: "/shop?sort=discount",
      enabled: true,
      sortOrder: 1,
      bgColor: "#fce4ec",
    },
    {
      id: "banner_2",
      title: "New Saree Collection",
      subtitle: "Banarasi & Kanjivaram sarees",
      image: "https://picsum.photos/seed/saree-new/600/300",
      ctaText: "Explore",
      ctaLink: "/shop?category=women's-clothing",
      enabled: true,
      sortOrder: 2,
      bgColor: "#e8f0fe",
    },
  ],
  homeSections: [
    { id: "usps", type: "usps", title: "", enabled: true },
    { id: "hero_banners", type: "hero_banners", title: "Featured Collections", enabled: true },
    { id: "categories", type: "categories", title: "Shop by category", enabled: true },
    { id: "deals", type: "deals", title: "Deals of the Day", enabled: true },
    { id: "featured", type: "featured", title: "Featured picks", enabled: true },
    { id: "banners", type: "banners", title: "Special Offers", enabled: true },
    { id: "newest", type: "newest", title: "New arrivals", enabled: true },
  ],
  usps: [
    { icon: "truck", title: "Free delivery", text: "On orders above ₹999" },
    { icon: "shield", title: "100% Genuine", text: "Quality checked" },
    { icon: "refresh", title: "Easy returns", text: "7-day return policy" },
    { icon: "headset", title: "24/7 Support", text: "Dedicated support" },
  ],
  footerText: "© Aurelia. All rights reserved. Made with ❤️ for clothing & jewellery lovers.",
  social: { instagram: "", facebook: "", twitter: "", youtube: "" },
  shipping: { flatRate: 7900, freeAbove: 99900, codEnabled: true, codFee: 4900, estimateText: "Delivered in 3–6 business days" },
  tax: { enabled: true, ratePercent: 18, inclusive: true, label: "GST" },
  notifications: { adminOrderEmail: "", sendCustomerConfirmation: true, sendAdminNewOrder: true, sendShippingUpdates: true },
  seo: { title: "Aurelia — Clothing & Jewellery, elevated", description: "Curated clothing and jewellery collection.", ogImage: "" },
  scripts: { headHtml: "", bodyHtml: "" },
  nav: [
    { label: "Shop", href: "/shop" },
    { label: "Clothing", href: "/shop?category=clothing" },
    { label: "Jewellery", href: "/shop?category=jewellery" },
    { label: "New", href: "/shop?sort=newest" },
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
  import("@/lib/plugins/firestore").then((m) => m.mirrorRow("settings", "store")).catch(() => {});
  return next;
}
