import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getGithubAppConfig } from "./config";

const STATE_LIFETIME_MS = 10 * 60 * 1000;

type GithubState = {
  userId: number;
  issuedAt: number;
  nonce: string;
};

function signState(payload: string): string {
  const key = process.env.JWT_SECRET;
  if (!key) throw new Error("Missing server signing key");
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createGithubAuthorizationUrl(userId: number): string {
  const config = getGithubAppConfig();
  if (!config.isConfigured || !config.clientId) {
    throw new Error(`GitHub App configuration is incomplete: ${config.missing.join(", ")}`);
  }
  const payload = Buffer.from(JSON.stringify({
    userId,
    issuedAt: Date.now(),
    nonce: randomBytes(18).toString("base64url"),
  } satisfies GithubState)).toString("base64url");
  const state = `${payload}.${signState(payload)}`;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("state", state);
  return url.toString();
}

export function verifyGithubState(state: string): GithubState {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Missing GitHub authorization state");
  const expected = signState(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid GitHub authorization state");
  }
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GithubState;
  if (!Number.isInteger(parsed.userId) || Date.now() - parsed.issuedAt > STATE_LIFETIME_MS) {
    throw new Error("Expired GitHub authorization state");
  }
  return parsed;
}

export async function exchangeGithubAuthorizationCode(code: string) {
  const config = getGithubAppConfig();
  if (!config.clientId || !config.clientSecret) throw new Error("GitHub App OAuth configuration is incomplete");

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
    }),
  });
  if (!response.ok) throw new Error("GitHub could not exchange the authorization code");
  const payload = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) throw new Error("GitHub did not return a user access token");
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
  };
}

export async function getGithubViewer(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "lastdaynight",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error("GitHub could not load the authorized account");
  return response.json() as Promise<{ id: number; login: string; avatar_url?: string }>;
}
