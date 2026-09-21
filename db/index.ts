import { loadEnvConfig } from "@next/env";
import { createDb } from "./client";

loadEnvConfig(process.cwd());

export { createDb, type Database } from "./client";
export const { client, db } = createDb();
