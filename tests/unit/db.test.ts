import { describe, it, expect } from "vitest";
import { runMigrations } from "@/db/migrate";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAuthInstance } from "@/modules/auth/server";

describe("Database & Migration Seam", () => {
  it("executes migrations on an in-memory database and creates schema tables", async () => {
    const { db } = await runMigrations(":memory:");
    const users = await db.select().from(user);
    expect(users).toEqual([]);
  });

  it("persists and queries a user with role support", async () => {
    const { db } = await runMigrations(":memory:");
    const testId = "user_test_123";
    const now = new Date();

    await db.insert(user).values({
      id: testId,
      name: "Jane Doe",
      email: "jane@example.com",
      emailVerified: false,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    const [retrieved] = await db
      .select()
      .from(user)
      .where(eq(user.id, testId));

    expect(retrieved).toBeDefined();
    expect(retrieved.name).toBe("Jane Doe");
    expect(retrieved.email).toBe("jane@example.com");
    expect(retrieved.role).toBe("admin");
  });

  it("initializes Better Auth server instance against migrated in-memory database", async () => {
    const { db } = await runMigrations(":memory:");
    const authInstance = createAuthInstance(db);
    expect(authInstance).toBeDefined();
    expect(authInstance.api).toBeDefined();
  });

  it("configures client correctly for remote Turso and local URLs", async () => {
    const { createDb } = await import("@/db/client");
    const local = createDb(":memory:");
    expect(local.db).toBeDefined();
    expect(local.client).toBeDefined();

    const remote = createDb("libsql://example-db.turso.io", "test-token");
    expect(remote.db).toBeDefined();
    expect(remote.client).toBeDefined();
    local.client.close();
    remote.client.close();
  });
});
