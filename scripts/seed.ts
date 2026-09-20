import { seed, isSeeded } from "../src/lib/seed";
(async () => {
  if (isSeeded() && !process.argv.includes("--force")) {
    console.log("Database already seeded. Use --force to reseed (delete data/store.db first).");
    return;
  }
  const r = await seed();
  console.log(`Seeded. Admin login: ${r.adminEmail} / ${r.adminPassword}`);
})();
