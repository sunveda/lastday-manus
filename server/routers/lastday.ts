import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import {
  createPortfolioItem,
  getGithubConnectionStatus,
  getLastdayOverview,
  getPublicPortfolioItem,
  listPortfolioItems,
  publishPortfolioItem,
  getPrimaryGithubAccount,
  setGithubScheduleTaskUid,
} from "../db";
import { getGithubAppConfig } from "../github/config";
import { createGithubAuthorizationUrl } from "../github/oauth";
import { runGithubContributionSync } from "../github/sync";
import { createHeartbeatJob } from "../_core/heartbeat";
import { createSafePortfolioProjection } from "../portfolio";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const portfolioInput = z.object({
  headline: z.string().trim().min(3).max(120),
  description: z.string().trim().min(12).max(1_000),
  tags: z.array(z.string().trim().min(1).max(24)).max(5),
  publicSlug: z.string().trim().regex(/^[a-z0-9-]{3,140}$/),
  sourceActivityId: z.number().int().positive().optional(),
});

export const lastdayRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const [overview, connection] = await Promise.all([
      getLastdayOverview(ctx.user.id),
      getGithubConnectionStatus(ctx.user.id),
    ]);
    const app = getGithubAppConfig();
    return { ...overview, connection, githubAppReady: app.isConfigured, missingGithubConfig: app.missing };
  }),
  github: router({
    connectionStatus: protectedProcedure.query(({ ctx }) => getGithubConnectionStatus(ctx.user.id)),
    authorize: protectedProcedure.mutation(({ ctx }) => {
      const app = getGithubAppConfig();
      return {
        ready: app.isConfigured,
        authorizationUrl: app.isConfigured ? createGithubAuthorizationUrl(ctx.user.id) : null,
        missing: app.missing,
      };
    }),
    syncNow: protectedProcedure.mutation(async ({ ctx }) => {
      const account = await getPrimaryGithubAccount(ctx.user.id);
      if (!account) throw new Error("Connect GitHub before starting an import");
      return runGithubContributionSync(account.id);
    }),
    enableScheduledSync: protectedProcedure.mutation(async ({ ctx }) => {
      const account = await getPrimaryGithubAccount(ctx.user.id);
      if (!account) throw new Error("Connect GitHub before scheduling synchronization");
      if (account.scheduleCronTaskUid) return { scheduled: true, taskUid: account.scheduleCronTaskUid };
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const job = await createHeartbeatJob({
        name: `github-sync-${account.id}`,
        cron: "0 0 */12 * * *",
        path: "/api/scheduled/github-sync",
        description: `LastDayNight twelve-hour contribution sync for GitHub account ${account.id}`,
      }, sessionToken);
      await setGithubScheduleTaskUid(ctx.user.id, account.id, job.taskUid);
      return { scheduled: true, taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt ?? null };
    }),
  }),
  portfolio: router({
    list: protectedProcedure.query(({ ctx }) => listPortfolioItems(ctx.user.id)),
    create: protectedProcedure.input(portfolioInput).mutation(async ({ ctx, input }) => {
      const projection = createSafePortfolioProjection(input);
      return createPortfolioItem(ctx.user.id, projection);
    }),
    publish: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) =>
      publishPortfolioItem(ctx.user.id, input.id),
    ),
    publicBySlug: publicProcedure.input(z.object({ slug: z.string().min(3).max(140) })).query(({ input }) =>
      getPublicPortfolioItem(input.slug),
    ),
  }),
});
