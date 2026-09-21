import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getTursoConfig } from "./config";
import * as schema from "./schema";

// Explicit URLs support isolated in-memory tests; the default always requires Turso.
export function createDb(url?: string, authToken?: string) {
  const config = url === undefined ? getTursoConfig() : { url, authToken };
  const client = createClient(config);
  const db = drizzle(client, { schema });
  return { client, db };
}

export type Database = ReturnType<typeof createDb>["db"];
