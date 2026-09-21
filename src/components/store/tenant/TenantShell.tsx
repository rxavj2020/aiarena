import { cookies } from "next/headers";
import { APPEARANCE_COOKIE, type Appearance, themeVars } from "@/lib/themes";
import type { TenantSite } from "@/lib/tenant-site";
import { TenantHeader } from "./TenantHeader";
import { TenantFooter } from "./TenantFooter";

const APPEARANCES: Appearance[] = ["light", "dark", "system"];

/** Visitor appearance saved for this website (falls back to the site's default). */
export async function readSiteAppearance(site: TenantSite): Promise<Appearance> {
  const raw = (await cookies()).get(APPEARANCE_COOKIE)?.value;
  return raw && (APPEARANCES as string[]).includes(raw) ? (raw as Appearance) : site.theme.appearance;
}

/**
 * Root wrapper of one tenant website: applies the owner-selected theme on
 * every page and carries the visitor-selected appearance across all of them.
 */
export async function TenantShell({
  site,
  children,
  cartCount = 0,
  supportEmail,
  supportPhone,
  address,
  announcement,
}: {
  site: TenantSite;
  children: React.ReactNode;
  cartCount?: number;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  announcement?: string;
}) {
  const appearance = await readSiteAppearance(site);
  const resolved = appearance === "system" ? "light" : appearance;

  return (
    <div
      className="tenant-site"
      data-appearance-choice={appearance}
      data-appearance={resolved}
      data-preset={site.theme.preset}
      style={themeVars(site.theme) as React.CSSProperties}
    >
      {/* Resolve "system" before first paint and keep it in sync with the OS. */}
      <script dangerouslySetInnerHTML={{ __html: `(()=>{var r=document.querySelector(".tenant-site");if(!r)return;var sync=function(){if(r.getAttribute("data-appearance-choice")==="system"){r.setAttribute("data-appearance",window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");}};sync();window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",sync);})();` }} />
      <TenantHeader site={site} cartCount={cartCount} appearance={appearance} announcement={announcement} />
      <main className="s-main">{children}</main>
      <TenantFooter site={site} supportEmail={supportEmail} supportPhone={supportPhone} address={address} />
    </div>
  );
}
