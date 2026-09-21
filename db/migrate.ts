import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { migrate } from "drizzle-orm/libsql/migrator";
import { createDb } from "./client";
import path from "node:path";

export async function runMigrations(databaseUrl?: string, authToken?: string) {
  const { db, client } = createDb(databaseUrl, authToken);
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  try {
    await migrate(db, { migrationsFolder });
    return { db, client };
  } catch (error) {
    client.close();
    throw error;
  }
}

if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations()
    .then(({ client }) => {
      console.log("Migrations applied successfully.");
      client.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
