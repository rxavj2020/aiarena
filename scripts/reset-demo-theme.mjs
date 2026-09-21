import Database from "better-sqlite3";

const db = new Database(process.env.DB_PATH || new URL("../data/store.db", import.meta.url).pathname);

const theme = {
  preset: "royal-emerald",
  appearance: "light",
  frameColor: "#0c3b2e",
  groundColor: "#241c13",
  actionColor: "#c9a227",
  radius: "8",
  font: "serif",
};

db.prepare(
  `UPDATE tenants SET theme = ?, primary_color = ?, accent_color = ? WHERE id = 'tenant_aurelia'`
).run(JSON.stringify(theme), theme.frameColor, theme.groundColor);

console.log("Demo reset to royal-emerald (Role Trio):");
console.log("  Colour 1 frame  =", theme.frameColor, "→ header / announcement / hero start");
console.log("  Colour 2 ground =", theme.groundColor, "→ footer / marquee / headings / panels");
console.log("  Colour 3 action =", theme.actionColor, "→ buttons / links / badges / cart");
