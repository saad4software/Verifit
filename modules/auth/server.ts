import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { db, type Database } from "@/db";
import * as schema from "@/db/schema";

function getBaseURL() {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function getTrustedOrigins() {
  const origins = ["https://*.vercel.app"];
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.BETTER_AUTH_URL) {
    origins.push(process.env.BETTER_AUTH_URL);
  }
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  return Array.from(new Set(origins));
}

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
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRole: "admin",
      }),
    ],
    baseURL: getBaseURL(),
    trustedOrigins: getTrustedOrigins(),
    secret:
      process.env.BETTER_AUTH_SECRET ||
      "development-secret-key-that-is-at-least-32-chars-long-12345",
  });
}

export const auth = createAuthInstance();
export type Auth = typeof auth;
