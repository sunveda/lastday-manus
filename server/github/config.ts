export type GithubAppConfig = {
  appId?: string;
  clientId?: string;
  clientSecret?: string;
  privateKey?: string;
  callbackUrl: string;
  isConfigured: boolean;
  missing: string[];
};

/**
 * Secret-entry interfaces may collapse PEM whitespace. Reconstruct a standard
 * PEM envelope without altering the underlying base64 key material.
 */
export function normalizeGithubPrivateKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const compact = value.replace(/\s+/g, "");
  const match = compact.match(
    /^-----BEGIN(?:(RSA))?PRIVATEKEY-----(.+)-----END(?:RSA)?PRIVATEKEY-----$/,
  );
  if (!match) return value;
  const keyType = match[1] ? "RSA " : "";
  const body = match[2].match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN ${keyType}PRIVATE KEY-----\n${body}\n-----END ${keyType}PRIVATE KEY-----`;
}

const requiredKeys = [
  ["GITHUB_APP_ID", "appId"],
  ["GITHUB_APP_CLIENT_ID", "clientId"],
  ["GITHUB_APP_CLIENT_SECRET", "clientSecret"],
  ["GITHUB_APP_PRIVATE_KEY", "privateKey"],
] as const;

export function getGithubAppConfig(): GithubAppConfig {
  const config: Omit<GithubAppConfig, "isConfigured" | "missing"> = {
    appId: process.env.GITHUB_APP_ID,
    clientId: process.env.GITHUB_APP_CLIENT_ID,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
    privateKey: normalizeGithubPrivateKey(process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n")),
    callbackUrl: process.env.GITHUB_APP_CALLBACK_URL ?? "https://git.sunveda.tech/api/github/callback",
  };

  const missing = requiredKeys
    .filter(([environmentKey]) => !process.env[environmentKey])
    .map(([environmentKey]) => environmentKey);

  return { ...config, isConfigured: missing.length === 0, missing };
}
