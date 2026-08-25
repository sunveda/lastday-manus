CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubAccountId` int NOT NULL,
	`repositoryId` int NOT NULL,
	`githubNodeId` varchar(255) NOT NULL,
	`kind` enum('commit','pull_request','issue','review','repository') NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`isPrivate` boolean NOT NULL DEFAULT true,
	`title` text,
	`url` text,
	`additions` int NOT NULL DEFAULT 0,
	`deletions` int NOT NULL DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `activities_account_node_unique` UNIQUE(`githubAccountId`,`githubNodeId`)
);
--> statement-breakpoint
CREATE TABLE `github_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubUserId` varchar(64) NOT NULL,
	`login` varchar(255) NOT NULL,
	`avatarUrl` text,
	`accessTokenCiphertext` text NOT NULL,
	`refreshTokenCiphertext` text,
	`tokenExpiresAt` timestamp,
	`syncStatus` enum('idle','queued','syncing','error','needs_reauth') NOT NULL DEFAULT 'idle',
	`syncCursor` varchar(512),
	`lastSyncedAt` timestamp,
	`lastSyncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `github_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_accounts_user_github_unique` UNIQUE(`userId`,`githubUserId`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceActivityId` int,
	`headline` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`tags` json NOT NULL,
	`publicSlug` varchar(140) NOT NULL,
	`visibility` enum('draft','unlisted','public') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_items_user_slug_unique` UNIQUE(`userId`,`publicSlug`)
);
--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubAccountId` int NOT NULL,
	`githubRepositoryId` varchar(64) NOT NULL,
	`ownerLogin` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`fullName` varchar(512) NOT NULL,
	`visibility` enum('public','private','internal') NOT NULL,
	`isSelected` boolean NOT NULL DEFAULT true,
	`isArchived` boolean NOT NULL DEFAULT false,
	`primaryLanguage` varchar(100),
	`defaultBranch` varchar(255),
	`lastActivityAt` timestamp,
	`pushedAt` timestamp,
	`syncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repositories_id` PRIMARY KEY(`id`),
	CONSTRAINT `repositories_account_repo_unique` UNIQUE(`githubAccountId`,`githubRepositoryId`)
);
--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubAccountId` int NOT NULL,
	`mode` enum('initial','incremental','backfill') NOT NULL,
	`status` enum('queued','running','completed','partial','failed') NOT NULL DEFAULT 'queued',
	`cursorBefore` varchar(512),
	`cursorAfter` varchar(512),
	`importedCount` int NOT NULL DEFAULT 0,
	`rateLimitRemaining` int,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_githubAccountId_github_accounts_id_fk` FOREIGN KEY (`githubAccountId`) REFERENCES `github_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_repositoryId_repositories_id_fk` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `github_accounts` ADD CONSTRAINT `github_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_items` ADD CONSTRAINT `portfolio_items_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_items` ADD CONSTRAINT `portfolio_items_sourceActivityId_activities_id_fk` FOREIGN KEY (`sourceActivityId`) REFERENCES `activities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_githubAccountId_github_accounts_id_fk` FOREIGN KEY (`githubAccountId`) REFERENCES `github_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sync_runs` ADD CONSTRAINT `sync_runs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sync_runs` ADD CONSTRAINT `sync_runs_githubAccountId_github_accounts_id_fk` FOREIGN KEY (`githubAccountId`) REFERENCES `github_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activities_user_occurred_idx` ON `activities` (`userId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `activities_repository_occurred_idx` ON `activities` (`repositoryId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `github_accounts_user_idx` ON `github_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `portfolio_items_visibility_idx` ON `portfolio_items` (`visibility`);--> statement-breakpoint
CREATE INDEX `repositories_user_visibility_idx` ON `repositories` (`userId`,`visibility`);--> statement-breakpoint
CREATE INDEX `sync_runs_account_created_idx` ON `sync_runs` (`githubAccountId`,`createdAt`);