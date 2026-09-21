/**
 * Site theme layer for tenant websites — "Role Trio".
 *
 * The owner provides three colour codes; each owns whole groups of components
 * (flat brand colours across the UI, the way a designed brand site works):
 *
 *   Colour 1 · FRAME  — announcement bar, header / nav, hero overlay start
 *   Colour 2 · GROUND — footer, marquee, serif headings, section panels
 *   Colour 3 · ACTION — buttons, links, badges, cart, focus rings
 *
 * Everything else (cream page background, cards, ink text, borders) is derived
 * from the trio so any three hexes look like one designed system. Two layers of
 * preference compose on every page: the owner's `TenantTheme` and the visitor's
 * light / dark / system appearance (cookie scoped to the website).
 */

export type Appearance = "light" | "dark" | "system";

export type ThemePresetId =
  | "royal-emerald" | "heritage-maroon" | "midnight-gold" | "indigo-pearl"
  | "terracotta" | "rosewood" | "emerald-coast" | "ink-coral";

export type ThemeRadius = "sharp" | "soft" | "round";
export type ThemeFont = "sans" | "display" | "serif";

export type TenantTheme = {
  preset: ThemePresetId;
  /** Appearance shown to first-time visitors (before they pick their own). */
  appearance: Appearance;
  /** Colour 1 · FRAME — header, announcement bar, hero overlay start. */
  frameColor: string;
  /** Colour 2 · GROUND — footer, headings, marquee, section panels. */
  groundColor: string;
  /** Colour 3 · ACTION — buttons, links, badges, cart, focus. */
  actionColor: string;
  radius: ThemeRadius;
  font: ThemeFont;
};

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  blurb: string;
  frameColor: string;
  groundColor: string;
  actionColor: string;
  radius: ThemeRadius;
  font: ThemeFont;
  appearance: Appearance;
};

/** Role order used everywhere in the admin UI and palette stripes. */
export const ROLE_ORDER = ["frame", "ground", "action"] as const;
export type ThemeRole = (typeof ROLE_ORDER)[number];

export const ROLE_LABELS: Record<ThemeRole, { swatch: string; title: string; usedBy: string }> = {
  frame: { swatch: "Colour 1", title: "Header & frame", usedBy: "Announcement bar, header, navigation, hero overlay" },
  ground: { swatch: "Colour 2", title: "Footer & sections", usedBy: "Footer, headings, marquee, story & visit panels" },
  action: { swatch: "Colour 3", title: "Buttons & links", usedBy: "Buttons, links, badges, cart, focus rings" },
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "royal-emerald",
    label: "Royal Emerald",
    blurb: "Deep green frame, warm dark ground, gold actions — boutique jewellery.",
    frameColor: "#0c3b2e",
    groundColor: "#241c13",
    actionColor: "#c9a227",
    radius: "soft",
    font: "serif",
    appearance: "light",
  },
  {
    id: "heritage-maroon",
    label: "Heritage Maroon",
    blurb: "Wedding-season maroon with antique gold detailing.",
    frameColor: "#5b1a22",
    groundColor: "#24160f",
    actionColor: "#c6a15b",
    radius: "soft",
    font: "serif",
    appearance: "light",
  },
  {
    id: "midnight-gold",
    label: "Midnight Gold",
    blurb: "Near-black frame and ground with pure gold actions.",
    frameColor: "#14120e",
    groundColor: "#0e0d0b",
    actionColor: "#c9a227",
    radius: "sharp",
    font: "display",
    appearance: "dark",
  },
  {
    id: "indigo-pearl",
    label: "Indigo Pearl",
    blurb: "Regal indigo frame, ink ground, pearl-gold actions.",
    frameColor: "#232f5c",
    groundColor: "#171a24",
    actionColor: "#d4af37",
    radius: "soft",
    font: "serif",
    appearance: "light",
  },
  {
    id: "terracotta",
    label: "Terracotta Studio",
    blurb: "Clay-red frame with warm umber ground — artisanal and calm.",
    frameColor: "#8c3b1b",
    groundColor: "#2a1f16",
    actionColor: "#e3b341",
    radius: "round",
    font: "serif",
    appearance: "light",
  },
  {
    id: "rosewood",
    label: "Rosewood",
    blurb: "Plum-rose frame, cocoa ground, champagne gold actions.",
    frameColor: "#4a1d33",
    groundColor: "#241a14",
    actionColor: "#c9a227",
    radius: "soft",
    font: "serif",
    appearance: "light",
  },
  {
    id: "emerald-coast",
    label: "Emerald Coast",
    blurb: "Fresh teal frame, slate ground, honey actions — modern retail.",
    frameColor: "#0e5c4a",
    groundColor: "#1b2420",
    actionColor: "#e0b24c",
    radius: "round",
    font: "display",
    appearance: "light",
  },
  {
    id: "ink-coral",
    label: "Ink & Coral",
    blurb: "Ink-blue frame, navy ground, coral actions — sharp and current.",
    frameColor: "#1f2a44",
    groundColor: "#16202e",
    actionColor: "#f97316",
    radius: "sharp",
    font: "display",
    appearance: "light",
  },
];

export const defaultTenantTheme: TenantTheme = {
  preset: "royal-emerald",
  appearance: "light",
  frameColor: "#0c3b2e",
  groundColor: "#241c13",
  actionColor: "#c9a227",
  radius: "soft",
  font: "serif",
};

const HEX = /^#[0-9a-f]{6}$/i;
const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T =>
  typeof value === "string" && (options as readonly string[]).includes(value);
const hexOr = (value: unknown, fallback: string) => (typeof value === "string" && HEX.test(value) ? value : fallback);

export function getPreset(id: string | null | undefined): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/**
 * Merge any stored/partial theme onto the preset defaults with validation.
 * Understands the legacy gradient-era fields (`primaryColor`, `accentColor`,
 * `tertiaryColor`) and maps them onto the role trio.
 */
export function resolveTheme(input?: (Partial<TenantTheme> & Record<string, unknown>) | null): TenantTheme {
  const preset = getPreset(input?.preset as string | undefined);
  const legacy = input as Record<string, unknown> | undefined;
  // Legacy mapping: primary was buttons, accent was highlights, tertiary the third.
  const frame = hexOr(input?.frameColor, hexOr(legacy?.accentColor, hexOr(legacy?.primaryColor, preset.frameColor)));
  const ground = hexOr(input?.groundColor, hexOr(legacy?.tertiaryColor, preset.groundColor));
  const action = hexOr(input?.actionColor, hexOr(legacy?.primaryColor, preset.actionColor));
  return {
    preset: preset.id,
    appearance: isOneOf(input?.appearance, ["light", "dark", "system"] as const) ? input!.appearance : preset.appearance,
    frameColor: frame,
    groundColor: ground,
    actionColor: action,
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
  const { frameColor: f, groundColor: g, actionColor: a } = theme;
  return {
    // The three provided colours, by role.
    "--site-frame": f,
    "--site-frame-ink": readableInk(f),
    "--site-ground": g,
    "--site-ground-ink": readableInk(g),
    "--site-action": a,
    "--site-action-ink": readableInk(a),
    // Derived neutrals — what makes any three hexes look designed.
    "--site-heading": g,
    "--site-hero": `linear-gradient(120deg, ${f} 0%, ${g} 92%)`,
    "--site-wash": `color-mix(in srgb, ${g} 6%, #ffffff)`,
    "--site-wash-strong": `color-mix(in srgb, ${g} 12%, #ffffff)`,
    "--site-tint-action": `color-mix(in srgb, ${a} 14%, transparent)`,
    // Palette stripe: the three roles in order — the theme's signature.
    "--site-bar": `linear-gradient(90deg, ${f} 0 33.3%, ${g} 33.3% 66.6%, ${a} 66.6% 100%)`,
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
