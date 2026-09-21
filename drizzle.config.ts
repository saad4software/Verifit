import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const url =
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "file:local.db";

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN;

const isTurso =
  url.startsWith("libsql:") ||
  url.startsWith("https:") ||
  url.startsWith("http:") ||
  url.startsWith("wss:");

export default defineConfig(
  isTurso
    ? {
        schema: "./db/schema/index.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: {
          url,
          authToken,
        },
      }
    : {
        schema: "./db/schema/index.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url,
        },
      }
);

