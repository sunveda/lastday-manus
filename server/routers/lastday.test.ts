import { describe, expect, it } from "vitest";
import type { TrpcContext } from "../_core/context";
import { lastdayRouter } from "./lastday";

function createAuthenticatedContext(): TrpcContext {
  const now = new Date();
  return {
    user: {
      id: 714,
      openId: "lastdaynight-test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "github",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("lastday.github.authorize", () => {
  it("returns an app-scoped GitHub authorization URL without exposing credentials", async () => {
    const caller = lastdayRouter.createCaller(createAuthenticatedContext());
    const result = await caller.github.authorize();

    expect(result.ready).toBe(true);
    expect(result.authorizationUrl).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
    expect(result.authorizationUrl).toContain("client_id=");
    expect(result.authorizationUrl).toContain("state=");
    expect(result.authorizationUrl).not.toContain("client_secret");
    expect(result.authorizationUrl).not.toContain("private_key");
  });
});
