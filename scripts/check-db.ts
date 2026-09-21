import { client } from "../db";

async function checkDatabase() {
  try {
    if (client.protocol === "file") {
      throw new Error("Application database is using a local file.");
    }
    await client.execute("SELECT 1");
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('user', 'session', 'account', 'verification') ORDER BY name"
    );
    console.log(`Connection: hosted Turso (${client.protocol})`);
    console.log(`Auth tables: ${result.rows.map((row) => row.name).join(", ") || "none"}`);
    if (result.rows.length !== 4) {
      throw new Error("Auth schema is incomplete. Run npm run db:migrate.");
    }
    console.log("PASS: the current application client connects to Turso and the auth schema exists.");
  } finally {
    client.close();
  }
}

checkDatabase().catch(() => {
  console.error("Database check failed. Verify Turso credentials, network access, and run npm run db:migrate if the auth schema is missing.");
  process.exitCode = 1;
});
