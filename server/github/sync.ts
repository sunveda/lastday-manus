import { decryptGithubCredential } from "./crypto";
import { summarizeContributionBatch } from "./pythonRunner";
import {
  failGithubSync,
  getGithubAccountForSync,
  persistContributionCalendar,
  startGithubSync,
} from "../db";

function toGithubDate(date: Date) {
  return date.toISOString();
}

/**
 * Imports only contribution totals and per-day counts for a bounded period.
 * It runs serially and persists the remaining API quota for operational safety.
 */
export async function runGithubContributionSync(githubAccountId: number) {
  const account = await getGithubAccountForSync(githubAccountId);
  if (!account) throw new Error("GitHub account is not available for synchronization");
  if (account.syncStatus === "syncing") return { skipped: "already-syncing" as const };

  const started = await startGithubSync(account);
  try {
    const token = decryptGithubCredential(account.accessTokenCiphertext);
    const to = new Date();
    const from = account.lastSyncedAt
      ? new Date(account.lastSyncedAt.getTime() - 2 * 24 * 60 * 60 * 1000)
      : new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
    const summary = await summarizeContributionBatch({ accessToken: token, from: toGithubDate(from), to: toGithubDate(to) });
    await persistContributionCalendar(account, started.runId, summary);
    return { importedDays: summary.days.length, rateLimitRemaining: summary.rateLimitRemaining };
  } catch (error) {
    await failGithubSync(account.id, started.runId, error instanceof Error ? error.message : "Unknown synchronization error");
    throw error;
  }
}
