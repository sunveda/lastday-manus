ALTER TABLE `github_accounts` MODIFY COLUMN `accessTokenCiphertext` text;--> statement-breakpoint
ALTER TABLE `github_accounts` ADD `disconnectedAt` timestamp;