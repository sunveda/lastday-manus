import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activities,
  contributionDays,
  GithubAccount,
  githubAccounts,
  InsertUser,
  portfolioItems,
  repositories,
  syncRuns,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import type { PortfolioProjectionInput } from "./portfolio";
import type { PythonContributionSummary } from "./github/pythonRunner";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

const emptyOverview = {
  totals: { repositories: 0, contributions: 0, pullRequests: 0, reviews: 0 },
  calendar: [] as Array<{ date: string; count: number }>,
  repositoryTrends: [] as Array<{ name: string; visibility: "public" | "private" | "internal"; primaryLanguage: string | null; pushedAt: Date | null }>,
  recentActivity: [] as Array<{ kind: string; occurredAt: Date; title: string | null; isPrivate: boolean }>,
  sync: { status: "idle" as const, lastSyncedAt: null as Date | null },
};

export async function getGithubConnectionStatus(userId: number) {
  const db = await getDb();
  if (!db) return { connected: false, login: null, syncStatus: "idle" as const, lastSyncedAt: null as Date | null };
  const account = (await db.select().from(githubAccounts).where(eq(githubAccounts.userId, userId)).limit(1))[0];
  if (!account) return { connected: false, login: null, syncStatus: "idle" as const, lastSyncedAt: null as Date | null };
  return {
    connected: true,
    login: account.login,
    syncStatus: account.syncStatus,
    lastSyncedAt: account.lastSyncedAt,
  };
}

export async function getLastdayOverview(userId: number) {
  const db = await getDb();
  if (!db) return emptyOverview;
  const account = (await db.select().from(githubAccounts).where(eq(githubAccounts.userId, userId)).limit(1))[0];
  if (!account) return emptyOverview;

  const since = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [[repositoryTotal], [activityTotal], [calendarTotal], calendar, recentActivity] = await Promise.all([
    db.select({ total: count() }).from(repositories).where(and(eq(repositories.userId, userId), eq(repositories.isSelected, true))),
    db.select({ total: count() }).from(activities).where(eq(activities.userId, userId)),
    db.select({ total: sql<number>`coalesce(${sum(contributionDays.contributionCount)}, 0)` }).from(contributionDays).where(eq(contributionDays.userId, userId)),
    db.select({ date: contributionDays.occurredOn, count: contributionDays.contributionCount })
      .from(contributionDays)
      .where(and(eq(contributionDays.userId, userId), gte(contributionDays.occurredOn, since)))
      .orderBy(contributionDays.occurredOn),
    db.select({ kind: activities.kind, occurredAt: activities.occurredAt, title: activities.title, isPrivate: activities.isPrivate })
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.occurredAt))
      .limit(5),
  ]);
  const allKinds = await db.select({ kind: activities.kind }).from(activities).where(eq(activities.userId, userId));
  const repositoryTrends = await db.select({
    name: repositories.name,
    visibility: repositories.visibility,
    primaryLanguage: repositories.primaryLanguage,
    pushedAt: repositories.pushedAt,
  }).from(repositories).where(and(eq(repositories.userId, userId), eq(repositories.isSelected, true))).orderBy(desc(repositories.pushedAt)).limit(5);
  const pullRequests = allKinds.filter(activity => activity.kind === "pull_request").length;
  const reviews = allKinds.filter(activity => activity.kind === "review").length;

  return {
    totals: {
      repositories: repositoryTotal?.total ?? 0,
      contributions: calendarTotal?.total ?? activityTotal?.total ?? 0,
      pullRequests,
      reviews,
    },
    recentActivity,
    calendar,
    repositoryTrends,
    sync: { status: account.syncStatus, lastSyncedAt: account.lastSyncedAt },
  };
}

export async function listPortfolioItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: portfolioItems.id,
    headline: portfolioItems.headline,
    description: portfolioItems.description,
    tags: portfolioItems.tags,
    publicSlug: portfolioItems.publicSlug,
    visibility: portfolioItems.visibility,
    publishedAt: portfolioItems.publishedAt,
    createdAt: portfolioItems.createdAt,
  }).from(portfolioItems).where(eq(portfolioItems.userId, userId)).orderBy(desc(portfolioItems.updatedAt));
}

export async function createPortfolioItem(userId: number, projection: PortfolioProjectionInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(portfolioItems).values({
    userId,
    sourceActivityId: projection.sourceActivityId,
    headline: projection.headline,
    description: projection.description,
    tags: projection.tags,
    publicSlug: projection.publicSlug,
    visibility: "draft",
  });
  return { id: result[0].insertId, visibility: "draft" as const };
}

export async function publishPortfolioItem(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.update(portfolioItems)
    .set({ visibility: "public", publishedAt: new Date() })
    .where(and(eq(portfolioItems.id, id), eq(portfolioItems.userId, userId)));
  return { published: result[0].affectedRows === 1 };
}

export async function getPublicPortfolioItem(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const item = (await db.select({
    headline: portfolioItems.headline,
    description: portfolioItems.description,
    tags: portfolioItems.tags,
    publicSlug: portfolioItems.publicSlug,
    publishedAt: portfolioItems.publishedAt,
  }).from(portfolioItems).where(and(eq(portfolioItems.publicSlug, slug), eq(portfolioItems.visibility, "public"))).limit(1))[0];
  return item ?? null;
}

export async function upsertGithubAccount(input: {
  userId: number;
  githubUserId: string;
  login: string;
  avatarUrl: string | null;
  accessTokenCiphertext: string;
  refreshTokenCiphertext: string | null;
  tokenExpiresAt: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(githubAccounts).values({
    ...input,
    syncStatus: "queued",
  }).onDuplicateKeyUpdate({
    set: {
      login: input.login,
      avatarUrl: input.avatarUrl,
      accessTokenCiphertext: input.accessTokenCiphertext,
      refreshTokenCiphertext: input.refreshTokenCiphertext,
      tokenExpiresAt: input.tokenExpiresAt,
      syncStatus: "queued",
      lastSyncError: null,
    },
  });
}

export async function getGithubAccountForSync(githubAccountId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(githubAccounts).where(eq(githubAccounts.id, githubAccountId)).limit(1))[0];
}

export async function getGithubAccountByScheduleTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(githubAccounts).where(eq(githubAccounts.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function getPrimaryGithubAccount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(githubAccounts).where(eq(githubAccounts.userId, userId)).limit(1))[0];
}

export async function setGithubScheduleTaskUid(userId: number, githubAccountId: number, taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(githubAccounts)
    .set({ scheduleCronTaskUid: taskUid })
    .where(and(eq(githubAccounts.id, githubAccountId), eq(githubAccounts.userId, userId)));
}

export async function startGithubSync(account: GithubAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(githubAccounts).set({ syncStatus: "syncing", lastSyncError: null }).where(eq(githubAccounts.id, account.id));
  const result = await db.insert(syncRuns).values({
    userId: account.userId,
    githubAccountId: account.id,
    mode: account.lastSyncedAt ? "incremental" : "initial",
    status: "running",
    startedAt: new Date(),
  });
  return { runId: result[0].insertId };
}

export async function persistContributionCalendar(account: GithubAccount, runId: number, summary: PythonContributionSummary) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  for (const day of summary.days) {
    await db.insert(contributionDays).values({
      userId: account.userId,
      githubAccountId: account.id,
      occurredOn: day.date,
      contributionCount: day.count,
    }).onDuplicateKeyUpdate({ set: { contributionCount: day.count } });
  }
  for (const repository of summary.repositories) {
    await db.insert(repositories).values({
      userId: account.userId,
      githubAccountId: account.id,
      githubRepositoryId: repository.id,
      ownerLogin: repository.ownerLogin,
      name: repository.name,
      fullName: repository.fullName,
      visibility: repository.visibility,
      isSelected: true,
      isArchived: repository.isArchived,
      primaryLanguage: repository.primaryLanguage,
      defaultBranch: repository.defaultBranch,
      pushedAt: repository.pushedAt ? new Date(repository.pushedAt) : null,
      lastActivityAt: repository.updatedAt ? new Date(repository.updatedAt) : null,
      syncedAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        ownerLogin: repository.ownerLogin,
        name: repository.name,
        fullName: repository.fullName,
        visibility: repository.visibility,
        isArchived: repository.isArchived,
        primaryLanguage: repository.primaryLanguage,
        defaultBranch: repository.defaultBranch,
        pushedAt: repository.pushedAt ? new Date(repository.pushedAt) : null,
        lastActivityAt: repository.updatedAt ? new Date(repository.updatedAt) : null,
        syncedAt: new Date(),
      },
    });
  }
  const now = new Date();
  await db.update(syncRuns).set({
    status: "completed", importedCount: summary.days.length, rateLimitRemaining: summary.rateLimitRemaining, completedAt: now,
  }).where(eq(syncRuns.id, runId));
  await db.update(githubAccounts).set({ syncStatus: "idle", lastSyncedAt: now, lastSyncError: null }).where(eq(githubAccounts.id, account.id));
}

export async function failGithubSync(githubAccountId: number, runId: number, errorMessage: string) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  await db.update(syncRuns).set({ status: "failed", errorMessage, completedAt: now }).where(eq(syncRuns.id, runId));
  await db.update(githubAccounts).set({ syncStatus: "error", lastSyncError: errorMessage }).where(eq(githubAccounts.id, githubAccountId));
}
