import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const githubAccounts = mysqlTable(
  "github_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    githubUserId: varchar("githubUserId", { length: 64 }).notNull(),
    login: varchar("login", { length: 255 }).notNull(),
    avatarUrl: text("avatarUrl"),
    accessTokenCiphertext: text("accessTokenCiphertext"),
    refreshTokenCiphertext: text("refreshTokenCiphertext"),
    tokenExpiresAt: timestamp("tokenExpiresAt"),
    syncStatus: mysqlEnum("syncStatus", ["idle", "queued", "syncing", "error", "needs_reauth"])
      .default("idle")
      .notNull(),
    syncCursor: varchar("syncCursor", { length: 512 }),
    lastSyncedAt: timestamp("lastSyncedAt"),
    lastSyncError: text("lastSyncError"),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    disconnectedAt: timestamp("disconnectedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("github_accounts_user_github_unique").on(table.userId, table.githubUserId),
    index("github_accounts_user_idx").on(table.userId),
    index("github_accounts_schedule_task_idx").on(table.scheduleCronTaskUid),
  ],
);

export const repositories = mysqlTable(
  "repositories",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    githubAccountId: int("githubAccountId").notNull().references(() => githubAccounts.id, { onDelete: "cascade" }),
    githubRepositoryId: varchar("githubRepositoryId", { length: 64 }).notNull(),
    ownerLogin: varchar("ownerLogin", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("fullName", { length: 512 }).notNull(),
    visibility: mysqlEnum("visibility", ["public", "private", "internal"]).notNull(),
    isSelected: boolean("isSelected").default(true).notNull(),
    isArchived: boolean("isArchived").default(false).notNull(),
    primaryLanguage: varchar("primaryLanguage", { length: 100 }),
    defaultBranch: varchar("defaultBranch", { length: 255 }),
    lastActivityAt: timestamp("lastActivityAt"),
    pushedAt: timestamp("pushedAt"),
    syncedAt: timestamp("syncedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("repositories_account_repo_unique").on(table.githubAccountId, table.githubRepositoryId),
    index("repositories_user_visibility_idx").on(table.userId, table.visibility),
  ],
);

export const activities = mysqlTable(
  "activities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    githubAccountId: int("githubAccountId").notNull().references(() => githubAccounts.id, { onDelete: "cascade" }),
    repositoryId: int("repositoryId").notNull().references(() => repositories.id, { onDelete: "cascade" }),
    githubNodeId: varchar("githubNodeId", { length: 255 }).notNull(),
    kind: mysqlEnum("kind", ["commit", "pull_request", "issue", "review", "repository"])
      .notNull(),
    occurredAt: timestamp("occurredAt").notNull(),
    isPrivate: boolean("isPrivate").default(true).notNull(),
    title: text("title"),
    url: text("url"),
    additions: int("additions").default(0).notNull(),
    deletions: int("deletions").default(0).notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("activities_account_node_unique").on(table.githubAccountId, table.githubNodeId),
    index("activities_user_occurred_idx").on(table.userId, table.occurredAt),
    index("activities_repository_occurred_idx").on(table.repositoryId, table.occurredAt),
  ],
);

export const syncRuns = mysqlTable(
  "sync_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    githubAccountId: int("githubAccountId").notNull().references(() => githubAccounts.id, { onDelete: "cascade" }),
    mode: mysqlEnum("mode", ["initial", "incremental", "backfill"]).notNull(),
    status: mysqlEnum("status", ["queued", "running", "completed", "partial", "failed"])
      .default("queued")
      .notNull(),
    cursorBefore: varchar("cursorBefore", { length: 512 }),
    cursorAfter: varchar("cursorAfter", { length: 512 }),
    importedCount: int("importedCount").default(0).notNull(),
    rateLimitRemaining: int("rateLimitRemaining"),
    errorMessage: text("errorMessage"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("sync_runs_account_created_idx").on(table.githubAccountId, table.createdAt)],
);

export const contributionDays = mysqlTable(
  "contribution_days",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    githubAccountId: int("githubAccountId").notNull().references(() => githubAccounts.id, { onDelete: "cascade" }),
    occurredOn: varchar("occurredOn", { length: 10 }).notNull(),
    contributionCount: int("contributionCount").default(0).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("contribution_days_account_date_unique").on(table.githubAccountId, table.occurredOn),
    index("contribution_days_user_date_idx").on(table.userId, table.occurredOn),
  ],
);

export const portfolioItems = mysqlTable(
  "portfolio_items",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    sourceActivityId: int("sourceActivityId").references(() => activities.id, { onDelete: "set null" }),
    headline: varchar("headline", { length: 120 }).notNull(),
    description: text("description").notNull(),
    tags: json("tags").$type<string[]>().notNull(),
    publicSlug: varchar("publicSlug", { length: 140 }).notNull(),
    visibility: mysqlEnum("visibility", ["draft", "unlisted", "public"]).default("draft").notNull(),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("portfolio_items_user_slug_unique").on(table.userId, table.publicSlug),
    index("portfolio_items_visibility_idx").on(table.visibility),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type GithubAccount = typeof githubAccounts.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type ContributionDay = typeof contributionDays.$inferSelect;
