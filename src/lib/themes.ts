/**
 * Site theme layer for tenant websites.
 *
 * Two kinds of preference compose on every page of a website:
 *  - Owner-selected `TenantTheme` (preset, brand colours, font, radius, default
 *    appearance) stored on the tenant record and applied site-wide.
 *  - Visitor-selected appearance (light / dark / system) persisted in a cookie
 *    whose Path is scoped to that website so it never leaks to other sites.
 */

export type Appearance = "light" | "dark" | "system";

export type ThemePresetId = "minimal" | "vivid" | "elegant" | "noir" | "organic";
export type ThemeRadius = "sharp" | "soft" | "round";
export type ThemeFont = "sans" | "display" | "serif";

export type TenantTheme = {
  preset: ThemePresetId;
  /** Appearance shown to first-time visitors (before they pick their own). */
  appearance: Appearance;
  primaryColor: string;
  accentColor: string;
  radius: ThemeRadius;
  font: ThemeFont;
};

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  blurb: string;
  primaryColor: string;
  accentColor: string;
  radius: ThemeRadius;
  font: ThemeFont;
  appearance: Appearance;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "minimal",
    label: "Minimal",
    blurb: "Airy neutrals, quiet type — lets the products speak.",
    primaryColor: "#151515",
    accentColor: "#c98b5b",
    radius: "soft",
    font: "sans",
    appearance: "light",
  },
  {
    id: "vivid",
    label: "Vivid",
    blurb: "High-energy colour blocks made for drops and deals.",
    primaryColor: "#2874f0",
    accentColor: "#fb641b",
    radius: "round",
    font: "display",
    appearance: "light",
  },
  {
    id: "elegant",
    label: "Elegant",
    blurb: "Editorial serif headlines with refined gold detailing.",
    primaryColor: "#3b2f2f",
    accentColor: "#b08d57",
    radius: "soft",
    font: "serif",
    appearance: "light",
  },
  {
    id: "noir",
    label: "Noir",
    blurb: "Dark canvas, sharp geometry — premium and dramatic.",
    primaryColor: "#e5e2da",
    accentColor: "#c9a227",
    radius: "sharp",
    font: "display",
    appearance: "dark",
  },
  {
    id: "organic",
    label: "Organic",
    blurb: "Warm earth tones and rounded shapes, calm and handmade.",
    primaryColor: "#3f6c51",
    accentColor: "#d9a451",
    radius: "round",
    font: "serif",
    appearance: "light",
  },
];

export const defaultTenantTheme: TenantTheme = {
  preset: "minimal",
  appearance: "light",
  primaryColor: "#151515",
  accentColor: "#c98b5b",
  radius: "soft",
  font: "sans",
};

const HEX = /^#[0-9a-f]{6}$/i;
const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T =>
  typeof value === "string" && (options as readonly string[]).includes(value);

export function getPreset(id: string | null | undefined): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/** Merge any stored/partial theme onto the defaults with validation. */
export function resolveTheme(input?: Partial<TenantTheme> | null): TenantTheme {
  const preset = getPreset(input?.preset);
  return {
    preset: preset.id,
    appearance: isOneOf(input?.appearance, ["light", "dark", "system"] as const) ? input!.appearance : preset.appearance,
    primaryColor: input?.primaryColor && HEX.test(input.primaryColor) ? input.primaryColor : preset.primaryColor,
    accentColor: input?.accentColor && HEX.test(input.accentColor) ? input.accentColor : preset.accentColor,
    radius: isOneOf(input?.radius, ["sharp", "soft", "round"] as const) ? input!.radius : preset.radius,
    font: isOneOf(input?.font, ["sans", "display", "serif"] as const) ? input!.font : preset.font,
  };
}

const RADIUS_VALUES: Record<ThemeRadius, string> = { sharp: "4px", soft: "14px", round: "24px" };
const FONT_STACKS: Record<ThemeFont, string> = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  display: '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif',
  serif: '"Playfair Display", "Georgia", "Times New Roman", serif',
};
const DISPLAY_STACKS: Record<ThemeFont, string> = {
  sans: '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif',
  display: '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif',
  serif: '"Playfair Display", "Georgia", "Times New Roman", serif',
};

/** Readable text colour over a solid background (WCAG-ish luminance cut-off). */
export function readableInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#141412" : "#ffffff";
}

/** CSS custom properties applied inline on the website's root wrapper. */
export function themeVars(theme: TenantTheme): Record<string, string> {
  return {
    "--site-primary": theme.primaryColor,
    "--site-primary-ink": readableInk(theme.primaryColor),
    "--site-accent": theme.accentColor,
    "--site-accent-ink": readableInk(theme.accentColor),
    "--site-radius": RADIUS_VALUES[theme.radius],
    "--site-font": FONT_STACKS[theme.font],
    "--site-font-display": DISPLAY_STACKS[theme.font],
  };
}

/** Serialised theme for the browser (theme picker previews etc). */
export function themeToJson(theme: TenantTheme): string {
  return JSON.stringify(theme);
}

export function themeFromJson(raw: unknown): TenantTheme {
  if (!raw || typeof raw !== "object") return { ...defaultTenantTheme };
  return resolveTheme(raw as Partial<TenantTheme>);
}

/** Cookie name + path that keep a visitor's appearance choice on one website. */
export const APPEARANCE_COOKIE = "appearance";

export function appearanceCookiePath(basePath: string): string {
  return basePath && basePath !== "/" ? basePath : "/";
}
