/** Require hosted Turso for application and migration connections. */
export function getTursoConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.TURSO_DATABASE_URL?.trim();
  const authToken = env.TURSO_AUTH_TOKEN?.trim();

  if (!url || !authToken) {
    throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to connect to Turso.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("TURSO_DATABASE_URL must be a valid hosted Turso URL.");
  }
  if (!["libsql:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error("TURSO_DATABASE_URL must use libsql:// or https://; local files are not supported.");
  }

  return { url, authToken };
}
