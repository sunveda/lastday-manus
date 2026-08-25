# Project TODO

- [x] Define Lastday’s domain model for GitHub connections, repositories, activities, synchronization runs, analytics summaries, and portfolio highlights.
- [x] Add user-scoped database tables with strict private/public separation and indexes for contribution queries.
- [x] Implement secure GitHub App configuration validation, encrypted credential storage interfaces, and read-only authorization entry points.
- [x] Create a mobile-first authenticated dashboard shell with contribution calendar, trends, repository insights, sync status, and portfolio navigation.
- [x] Build a mobile-first unauthenticated landing and connection experience that explains the read-only private-data model.
- [x] Implement Python service scaffolding for GitHub ingestion, normalization, rate-limit-aware incremental sync, and scheduled batches.
- [x] Create portfolio highlight controls that require explicit publication and prevent private repository names or details from appearing by default.
- [x] Add server procedures, loading/error states, and responsive interactions for dashboard data and portfolio controls.
- [x] Write and run Vitest coverage for the data privacy rules and API procedures.
- [x] Verify desktop and mobile rendering, run type checks/tests, and resolve detected issues.
- [x] Configure the repository handoff and document production setup for the GitHub App callback and git.sunveda.tech custom domain.
- [x] Update visible product naming and GitHub App onboarding from Lastday to LastDayNight while retaining the existing repository name.
- [x] Complete and verify the GitHub App authorization callback and read-only connection entry flow.
- [x] Complete and verify the LastDayNight dashboard routes, mobile shell, and portfolio navigation.
- [x] Replace the starter home page with the mobile-first LastDayNight landing and connection experience.
- [x] Complete LastDayNight naming across visible product UI, metadata, and setup documentation.
- [x] Import selected repository metadata during contribution sync and display protected repository trends plus the contribution calendar in the dashboard.
