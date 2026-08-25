import { createPrivateKey } from "node:crypto";
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { getGithubAppConfig } from "./config";

describe("GitHub App credentials", () => {
  it("authenticates the configured App ID and PEM private key with GitHub", async () => {
    const config = getGithubAppConfig();
    expect(config.isConfigured, `Missing GitHub configuration: ${config.missing.join(", ")}`).toBe(true);
    if (!config.privateKey?.includes("PRIVATE KEY")) {
      throw new Error("GitHub private key is missing a valid PEM header");
    }

    const key = createPrivateKey({ key: config.privateKey, format: "pem", type: "pkcs1" });
    const now = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt(now - 30)
      .setExpirationTime(now + 540)
      .setIssuer(config.appId!)
      .sign(key);

    const response = await fetch("https://api.github.com/app", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "User-Agent": "lastdaynight-credential-check",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.status).toBe(200);
    const app = await response.json() as { id?: number; name?: string };
    expect(String(app.id)).toBe(config.appId);
    expect(app.name).toBe("LastDayNight");
  }, 30_000);
});
