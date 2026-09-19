import { migrate } from "drizzle-orm/libsql/migrator";
import { createDb } from "./index";
import path from "node:path";

export async function runMigrations(databaseUrl?: string) {
  const { db, client } = createDb(databaseUrl);
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder });
  return { db, client };
}

if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations()
    .then(() => {
      console.log("Migrations applied successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
