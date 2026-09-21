import { loadEnvConfig } from "@next/env";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

loadEnvConfig(process.cwd());

const defaultDatabaseUrl =
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "file:local.db";

const defaultAuthToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN;

export function createDb(
  url: string = defaultDatabaseUrl,
  authToken: string | undefined = defaultAuthToken
) {
  const isRemote =
    url.startsWith("libsql:") ||
    url.startsWith("https:") ||
    url.startsWith("http:") ||
    url.startsWith("wss:");

  const client = createClient({
    url,
    authToken: isRemote ? authToken : undefined,
  });
  const db = drizzle(client, { schema });
  return { client, db };
}

export const { client, db } = createDb();
export type Database = ReturnType<typeof createDb>["db"];
