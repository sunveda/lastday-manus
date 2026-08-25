# LastDayNight

LastDayNight is a mobile-first private GitHub contribution workspace with an owner-controlled portfolio layer. It is designed for people who want to understand their selected GitHub activity without automatically exposing private repository details.

## Product boundaries

The dashboard uses a read-only GitHub App authorization flow. Users select repositories during installation, encrypted credentials remain server-side, and synchronized records are scoped to the owning application user. Public portfolio items are separate, sanitized projections authored by the owner; private repository names, source links, and raw activity metadata are never copied into a public page by default.

## Stack

| Area | Implementation |
| --- | --- |
| User interface | React, TypeScript, Tailwind CSS |
| Application API | Express and tRPC |
| Private data | MySQL/TiDB with Drizzle ORM |
| GitHub ingestion | TypeScript `fetch`, GitHub GraphQL API |
| Deployment runtime | Node 22 TypeScript server |
| Scheduled work | Platform-managed authenticated HTTP callback |

## Local commands

```bash
pnpm dev
pnpm test
pnpm check
pnpm build
```

See [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md) for GitHub App registration and [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup at `lastdayapp-ur7gpuvm.manus.space`.
