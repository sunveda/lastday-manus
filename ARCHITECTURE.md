# LastDayNight Architecture Notes

LastDayNight uses the supplied React, Express, tRPC, and MySQL/TiDB scaffold for the authenticated web experience and durable user-scoped data. The GitHub contribution ingestion layer is implemented in TypeScript and calls the GitHub GraphQL API directly with the server-side encrypted credential. It is not a separately persistent service: scheduled execution uses an authenticated HTTP scheduling facility, and each batch must finish within the request window.

The production runtime is Node.js 22 with TypeScript compiled into the server bundle. No Python runtime or subprocess is required. The ingestion module validates the GraphQL response, normalizes contribution-calendar days and repository metadata, persists only the application’s private records, and never logs access tokens.

The current built-in deployment remains the reference environment for this release. The same Node/TypeScript application can later be adapted for independent hosting because its core ingestion path no longer depends on platform-specific Python availability. The database connection and scheduled HTTP callback remain configurable through environment variables and deployment-specific adapters.

The current built-in production URL is `https://lastdayapp-ur7gpuvm.manus.space`. A custom domain such as `git.sunveda.tech` can be added later through the hosting provider’s domain configuration and then used for the GitHub App homepage and callback URL.
