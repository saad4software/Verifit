import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const defaultDatabaseUrl = process.env.DATABASE_URL || "file:local.db";

export function createDb(url: string = defaultDatabaseUrl) {
  const client = createClient({ url });
  const db = drizzle(client, { schema });
  return { client, db };
}

export const { client, db } = createDb();
export type Database = ReturnType<typeof createDb>["db"];
