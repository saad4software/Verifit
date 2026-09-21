import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { getTursoConfig } from "./db/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: getTursoConfig(),
});
