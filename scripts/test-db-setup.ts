import fs from "node:fs";
import path from "node:path";
import { runMigrations } from "../db/migrate";

export default async function setupTestDb() {
  const dbPath = path.resolve(process.cwd(), "test.db");
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }
  const journalPath = path.resolve(process.cwd(), "test.db-journal");
  if (fs.existsSync(journalPath)) {
    fs.rmSync(journalPath, { force: true });
  }

  console.log("Initializing test database at file:test.db...");
  await runMigrations("file:test.db");
  console.log("Test database initialized with migrations.");
}

if (process.argv[1] && process.argv[1].endsWith("test-db-setup.ts")) {
  setupTestDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to setup test database:", err);
      process.exit(1);
    });
}
