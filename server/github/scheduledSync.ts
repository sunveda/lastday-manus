import type { Express, Request, Response } from "express";
import { getGithubAccountByScheduleTaskUid } from "../db";
import { sdk } from "../_core/sdk";
import { runGithubContributionSync } from "./sync";

export function registerGithubScheduledSync(app: Express) {
  app.post("/api/scheduled/github-sync", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const account = await getGithubAccountByScheduleTaskUid(user.taskUid);
      if (!account) return res.json({ ok: true, skipped: "orphaned-sync-job" });
      const result = await runGithubContributionSync(account.id);
      return res.json({ ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown synchronization failure";
      return res.status(500).json({
        error: message,
        context: { path: "/api/scheduled/github-sync" },
        timestamp: new Date().toISOString(),
      });
    }
  });
}
