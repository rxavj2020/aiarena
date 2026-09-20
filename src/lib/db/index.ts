import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";
import { ensureSchema } from "./migrate";

const dbPath = process.env.DATABASE_URL ?? path.join(process.cwd(), "data", "store.db");

declare global {
  var __db: ReturnType<typeof create> | undefined;
}

function create() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);
  return drizzle(sqlite, { schema });
}

export const db = globalThis.__db ?? create();
if (process.env.NODE_ENV !== "production") globalThis.__db = db;
export { schema };
