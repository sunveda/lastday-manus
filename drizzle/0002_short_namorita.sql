CREATE TABLE `contribution_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubAccountId` int NOT NULL,
	`occurredOn` varchar(10) NOT NULL,
	`contributionCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contribution_days_id` PRIMARY KEY(`id`),
	CONSTRAINT `contribution_days_account_date_unique` UNIQUE(`githubAccountId`,`occurredOn`)
);
--> statement-breakpoint
ALTER TABLE `github_accounts` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `contribution_days` ADD CONSTRAINT `contribution_days_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contribution_days` ADD CONSTRAINT `contribution_days_githubAccountId_github_accounts_id_fk` FOREIGN KEY (`githubAccountId`) REFERENCES `github_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contribution_days_user_date_idx` ON `contribution_days` (`userId`,`occurredOn`);--> statement-breakpoint
CREATE INDEX `github_accounts_schedule_task_idx` ON `github_accounts` (`scheduleCronTaskUid`);