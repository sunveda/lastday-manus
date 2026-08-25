# Portable Deployment Plan

## Recommendation

For the first independent deployment, use **Vercel’s Node.js runtime with an external PostgreSQL provider**. Vercel officially supports TypeScript Node.js servers and Node.js APIs, which matches the current Express/tRPC application with the fewest runtime changes [1]. Vercel Cron can call a protected HTTP endpoint on a UTC schedule [2].

Cloudflare Workers is a viable second target, but it should use a dedicated Worker adapter rather than assuming that the current Express process can be copied unchanged. Workers use the Fetch API and a `scheduled()` handler for Cron Triggers [3]. PostgreSQL can be connected from Workers through Hyperdrive, with Drizzle and supported PostgreSQL drivers documented by Cloudflare [4].

## Architecture options

| Approach | Trade-offs | Cost | Setup complexity |
| --- | --- | --- | --- |
| Vercel Node.js + managed PostgreSQL + Vercel Cron | Highest compatibility with the current Express/tRPC server and Node APIs. The server entrypoint and environment variables need Vercel configuration, and cron is UTC-based. | Depends on the selected providers and plan; no cost is assumed here. | Lower |
| Cloudflare Worker + PostgreSQL through Hyperdrive + Cron Trigger | Global edge execution and native scheduled handlers. Requires a Worker-compatible Fetch adapter, careful handling of Node APIs, and a separate database binding configuration. | Depends on the selected providers and plan; Hyperdrive and database usage must be checked for the chosen account. | Higher |
| Keep the current Node server on a conventional Node host + managed PostgreSQL + external cron | Maximum compatibility and simplest process model, but adds another hosting provider and separate cron configuration. | Depends on the selected provider and plan. | Medium |

## TypeScript application boundary

The shared application logic should remain independent of the host. GitHub GraphQL fetching and response normalization live in `server/github/ingestion.ts`; database persistence remains behind `server/db.ts`; and synchronization is entered through `runGithubContributionSync`. The host-specific layer should only provide HTTP routing, environment bindings, and a scheduled request that calls the same sync function.

The Vercel adapter should expose the existing application server as a Node.js server entrypoint or a thin function wrapper. The Cloudflare adapter should expose the HTTP routes through a Worker Fetch handler and invoke the same domain-level ingestion functions. No host adapter should contain GitHub token logic or duplicate the normalization code.

## PostgreSQL target

The current release still uses the scaffold’s MySQL/TiDB Drizzle dialect. PostgreSQL is the recommended target for the independent-hosting architecture because it is supported directly by common managed database providers and by Cloudflare Hyperdrive [4]. The migration must be schema-first: create a PostgreSQL Drizzle dialect, generate and review the SQL, migrate a disposable copy first, then validate user isolation, encrypted credentials, contribution days, repositories, synchronization runs, and portfolio publication boundaries before switching production.

No production database migration is performed by this document. Until that migration is explicitly executed, the existing MySQL/TiDB database remains the source of truth for the live application.

## Scheduled synchronization

The current scheduled endpoint is `POST /api/scheduled/github-sync` and is already protected by the platform’s authenticated scheduler. For Vercel, the endpoint should be invoked by a Vercel Cron definition in `vercel.json`, with the handler validating a secret or trusted Vercel cron header before running the sync. Vercel Cron requests use UTC [2].

For Cloudflare, the Worker should implement a `scheduled()` handler with a `0 */12 * * *` Cron Trigger and call the same sync service. Cloudflare Cron Triggers also execute in UTC [3]. A single-account scheduled route is not sufficient for a multi-user product; the production scheduler must enumerate due accounts in bounded batches or enqueue separate account jobs.

## Portability rules

The production code must not depend on Python, local filesystem state, in-process timers, or platform-specific secrets. GitHub credentials remain encrypted in the database, all public portfolio output remains explicitly published and sanitized, and every scheduled invocation must be idempotent and bounded. Environment variables should be the only host-specific inputs.

## References

[1]: https://vercel.com/docs/functions/runtimes/node-js "Using the Node.js Runtime with Vercel Functions"
[2]: https://vercel.com/docs/cron-jobs "Vercel Cron Jobs"
[3]: https://developers.cloudflare.com/workers/configuration/cron-triggers/ "Cloudflare Workers Cron Triggers"
[4]: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/ "Cloudflare Hyperdrive: Connect to PostgreSQL"
