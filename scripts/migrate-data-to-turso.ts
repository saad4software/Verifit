import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@libsql/client";

async function migrateData() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.");
    process.exit(1);
  }

  console.log("Connecting to local database (file:local.db)...");
  const localClient = createClient({ url: "file:local.db" });

  console.log("Connecting to Turso database...");
  const tursoClient = createClient({ url: tursoUrl, authToken: tursoToken });

  try {
    // 1. Migrate Users
    const users = await localClient.execute("SELECT * FROM user;");
    console.log(`Found ${users.rows.length} users in local database.`);
    for (const row of users.rows) {
      await tursoClient.execute({
        sql: `INSERT OR IGNORE INTO user (id, name, email, email_verified, image, created_at, updated_at, role, banned, ban_reason, ban_expires)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          row.id,
          row.name,
          row.email,
          row.email_verified,
          row.image,
          row.created_at,
          row.updated_at,
          row.role,
          row.banned,
          row.ban_reason,
          row.ban_expires,
        ],
      });
    }

    // 2. Migrate Accounts
    const accounts = await localClient.execute("SELECT * FROM account;");
    console.log(`Found ${accounts.rows.length} accounts in local database.`);
    for (const row of accounts.rows) {
      await tursoClient.execute({
        sql: `INSERT OR IGNORE INTO account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          row.id,
          row.account_id,
          row.provider_id,
          row.user_id,
          row.access_token,
          row.refresh_token,
          row.id_token,
          row.access_token_expires_at,
          row.refresh_token_expires_at,
          row.scope,
          row.password,
          row.created_at,
          row.updated_at,
        ],
      });
    }

    // 3. Migrate Sessions
    const sessions = await localClient.execute("SELECT * FROM session;");
    console.log(`Found ${sessions.rows.length} sessions in local database.`);
    for (const row of sessions.rows) {
      await tursoClient.execute({
        sql: `INSERT OR IGNORE INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id, impersonated_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          row.id,
          row.expires_at,
          row.token,
          row.created_at,
          row.updated_at,
          row.ip_address,
          row.user_agent,
          row.user_id,
          row.impersonated_by,
        ],
      });
    }

    // 4. Migrate Verification tokens if any
    const verifications = await localClient.execute("SELECT * FROM verification;");
    console.log(`Found ${verifications.rows.length} verification tokens in local database.`);
    for (const row of verifications.rows) {
      await tursoClient.execute({
        sql: `INSERT OR IGNORE INTO verification (id, identifier, value, expires_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?);`,
        args: [
          row.id,
          row.identifier,
          row.value,
          row.expires_at,
          row.created_at,
          row.updated_at,
        ],
      });
    }

    console.log("Data migration from local.db to Turso completed successfully!");
  } finally {
    localClient.close();
    tursoClient.close();
  }
}

migrateData().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
