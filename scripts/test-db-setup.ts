import { loadEnvConfig } from "@next/env";
import { getTursoConfig } from "../db/config";
import { runMigrations } from "../db/migrate";

loadEnvConfig(process.cwd());

export default async function setupTestDb() {
  const { url, authToken } = getTursoConfig({
    TURSO_DATABASE_URL: process.env.TEST_TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TEST_TURSO_AUTH_TOKEN,
  });
  if (url === process.env.TURSO_DATABASE_URL) {
    throw new Error("Browser tests require a separate Turso database.");
  }
  const { client } = await runMigrations(url, authToken);
  client.close();
  console.log("Turso test database initialized with migrations.");
}
