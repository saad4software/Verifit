import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { db, type Database } from "@/db";
import * as schema from "@/db/schema";

export function createAuthInstance(databaseInstance: Database = db) {
  return betterAuth({
    database: drizzleAdapter(databaseInstance, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRole: "admin",
      }),
    ],
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret:
      process.env.BETTER_AUTH_SECRET ||
      "development-secret-key-that-is-at-least-32-chars-long-12345",
  });
}

export const auth = createAuthInstance();
export type Auth = typeof auth;
