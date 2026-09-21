/**
 * Site theme layer for tenant websites.
 *
 * Two kinds of preference compose on every page of a website:
 *  - Owner-selected `TenantTheme` (preset, brand colours, font, radius, default
 *    appearance) stored on the tenant record and applied site-wide.
 *  - Visitor-selected appearance (light / dark / system) persisted in a cookie
 *    whose Path is scoped to that website so it never leaks to other sites.
 *
 * Palettes come in two kinds — `two` (primary + accent) and `three` (primary +
 * accent + tertiary). Three-colour themes render gradient hero surfaces,
 * gradient buttons and a tri-stripe accent bar; two-colour themes stay solid.
 */

export type Appearance = "light" | "dark" | "system";
export type ThemeColorMode = "two" | "three";

export type ThemePresetId =
  // Two-colour themes
  | "minimal" | "vivid" | "elegant" | "noir" | "organic"
  // Three-colour themes
  | "sunset" | "aurora" | "candy" | "bazaar";

export type ThemeRadius = "sharp" | "soft" | "round";
export type ThemeFont = "sans" | "display" | "serif";

export type TenantTheme = {
  preset: ThemePresetId;
  /** Appearance shown to first-time visitors (before they pick their own). */
  appearance: Appearance;
  /** `two` uses primary + accent; `three` adds the trending tri-colour look. */
  colorMode: ThemeColorMode;
  primaryColor: string;
  accentColor: string;
  /** Only rendered when `colorMode === "three"`. */
  tertiaryColor: string;
  radius: ThemeRadius;
  font: ThemeFont;
};

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  blurb: string;
  colorMode: ThemeColorMode;
  primaryColor: string;
  accentColor: string;
  tertiaryColor: string;
  radius: ThemeRadius;
  font: ThemeFont;
  appearance: Appearance;
};

export const THEME_PRESETS: ThemePreset[] = [
  // ── Two-colour themes ──────────────────────────────────────────────
  {
    id: "minimal",
    label: "Minimal",
    blurb: "Airy neutrals, quiet type — lets the products speak.",
    colorMode: "two",
    primaryColor: "#151515",
    accentColor: "#c98b5b",
    tertiaryColor: "#7c8a74",
    radius: "soft",
    font: "sans",
    appearance: "light",
  },
  {
    id: "vivid",
    label: "Vivid",
    blurb: "High-energy colour blocks made for drops and deals.",
    colorMode: "two",
    primaryColor: "#2874f0",
    accentColor: "#fb641b",
    tertiaryColor: "#7c3aed",
    radius: "round",
    font: "display",
    appearance: "light",
  },
  {
    id: "elegant",
    label: "Elegant",
    blurb: "Editorial serif headlines with refined gold detailing.",
    colorMode: "two",
    primaryColor: "#3b2f2f",
    accentColor: "#b08d57",
    tertiaryColor: "#b76e79",
    radius: "soft",
    font: "serif",
    appearance: "light",
  },
  {
    id: "noir",
    label: "Noir",
    blurb: "Dark canvas, sharp geometry — premium and dramatic.",
    colorMode: "two",
    primaryColor: "#e5e2da",
    accentColor: "#c9a227",
    tertiaryColor: "#8aa1b9",
    radius: "sharp",
    font: "display",
    appearance: "dark",
  },
  {
    id: "organic",
    label: "Organic",
    blurb: "Warm earth tones and rounded shapes, calm and handmade.",
    colorMode: "two",
    primaryColor: "#3f6c51",
    accentColor: "#d9a451",
    tertiaryColor: "#c07a4a",
    radius: "round",
    font: "serif",
    appearance: "light",
  },
  // ── Three-colour themes (trending trios) ───────────────────────────
  {
    id: "sunset",
    label: "Sunset Glow",
    blurb: "Orange melting into pink and violet — the trending dusk gradient.",
    colorMode: "three",
    primaryColor: "#f97316",
    accentColor: "#ec4899",
    tertiaryColor: "#8b5cf6",
    radius: "round",
    font: "display",
    appearance: "light",
  },
  {
    id: "aurora",
    label: "Aurora",
    blurb: "Teal, blue and violet flowing like northern lights.",
    colorMode: "three",
    primaryColor: "#2dd4bf",
    accentColor: "#3b82f6",
    tertiaryColor: "#a855f7",
    radius: "soft",
    font: "display",
    appearance: "system",
  },
  {
    id: "candy",
    label: "Candy Pop",
    blurb: "Hot pink, sunny amber and sky blue — playful and loud.",
    colorMode: "three",
    primaryColor: "#ec4899",
    accentColor: "#f59e0b",
    tertiaryColor: "#38bdf8",
    radius: "round",
    font: "display",
    appearance: "light",
  },
  {
    id: "bazaar",
    label: "Bazaar",
    blurb: "Magenta, gold and teal — festive market energy.",
    colorMode: "three",
    primaryColor: "#db2777",
    accentColor: "#f59e0b",
    tertiaryColor: "#0d9488",
    radius: "soft",
    font: "serif",
    appearance: "light",
  },
];

export const defaultTenantTheme: TenantTheme = {
  preset: "minimal",
  appearance: "light",
  colorMode: "two",
  primaryColor: "#151515",
  accentColor: "#c98b5b",
  tertiaryColor: "#7c8a74",
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
    colorMode: isOneOf(input?.colorMode, ["two", "three"] as const) ? input!.colorMode : preset.colorMode,
    primaryColor: input?.primaryColor && HEX.test(input.primaryColor) ? input.primaryColor : preset.primaryColor,
    accentColor: input?.accentColor && HEX.test(input.accentColor) ? input.accentColor : preset.accentColor,
    tertiaryColor: input?.tertiaryColor && HEX.test(input.tertiaryColor) ? input.tertiaryColor : preset.tertiaryColor,
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
  const { primaryColor: p, accentColor: a, tertiaryColor: t, colorMode } = theme;
  const trio = colorMode === "three";
  return {
    "--site-primary": p,
    "--site-primary-ink": readableInk(p),
    "--site-accent": a,
    "--site-accent-ink": readableInk(a),
    "--site-third": t,
    "--site-third-ink": readableInk(t),
    "--site-radius": RADIUS_VALUES[theme.radius],
    "--site-font": FONT_STACKS[theme.font],
    "--site-font-display": DISPLAY_STACKS[theme.font],
    // Hero / large surfaces: 2-stop for duo themes, flowing trio gradient for three.
    "--site-gradient": trio
      ? `linear-gradient(115deg, ${p} 0%, ${a} 55%, ${t} 130%)`
      : `linear-gradient(115deg, ${p} 0%, color-mix(in srgb, ${p} 55%, #1a1a18) 58%, ${a} 150%)`,
    // Small solid-button surface.
    "--site-btn-gradient": trio
      ? `linear-gradient(95deg, ${p} 0%, ${a} 65%, ${t} 150%)`
      : p,
    // Accent stripe: colour blocks — 2 or 3 depending on the palette kind.
    "--site-bar": trio
      ? `linear-gradient(90deg, ${p} 0 33.3%, ${a} 33.3% 66.6%, ${t} 66.6% 100%)`
      : `linear-gradient(90deg, ${p} 0 50%, ${a} 50% 100%)`,
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
