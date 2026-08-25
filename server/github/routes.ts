import type { Express, Request, Response } from "express";
import { encryptGithubCredential } from "./crypto";
import { exchangeGithubAuthorizationCode, getGithubViewer, verifyGithubState } from "./oauth";
import { upsertGithubAccount } from "../db";

function redirectToApp(res: Response, query: Record<string, string>) {
  const url = new URL("/dashboard", process.env.GITHUB_APP_CALLBACK_URL ?? "https://git.sunveda.tech");
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  res.redirect(url.toString());
}

export function registerGithubRoutes(app: Express) {
  app.get("/api/github/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    if (!code || !state) return redirectToApp(res, { github: "missing-authorization" });

    try {
      const { userId } = verifyGithubState(state!);
      const authorization = await exchangeGithubAuthorizationCode(code!);
      const viewer = await getGithubViewer(authorization.accessToken);
      await upsertGithubAccount({
        userId,
        githubUserId: String(viewer.id),
        login: viewer.login,
        avatarUrl: viewer.avatar_url ?? null,
        accessTokenCiphertext: encryptGithubCredential(authorization.accessToken),
        refreshTokenCiphertext: authorization.refreshToken
          ? encryptGithubCredential(authorization.refreshToken)
          : null,
        tokenExpiresAt: authorization.expiresIn
          ? new Date(Date.now() + authorization.expiresIn * 1000)
          : null,
      });
      return redirectToApp(res, { github: "connected" });
    } catch (error) {
      console.error("[GitHub] Authorization callback failed", error instanceof Error ? error.message : "unknown error");
      return redirectToApp(res, { github: "connection-failed" });
    }
  });
}
