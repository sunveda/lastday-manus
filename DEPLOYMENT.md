# LastDay Release Guide

LastDay is deployed at `https://lastdayapp-ur7gpuvm.manus.space`. The project uses a Node 22 application server with TypeScript-based GitHub synchronization. The production process remains a single web server; it does not rely on in-container timers.

## 1. Publish the project

Create a project checkpoint, then use the **Publish** button in the project interface. Do not publish until the GitHub App private key has been rotated if a previous key was exposed during setup. The deployment must be live before its recurring synchronization job is enabled.

## 2. Optional: connect a custom domain later

The deployed platform URL can be used directly. If you later want `git.sunveda.tech`, add it in the project’s **Settings → Domains** panel first, then use the displayed DNS target to create or update the `git` record in Cloudflare. Keep proxying and HTTPS enabled as directed by the domain panel, then wait for domain verification to complete.

## 3. Confirm GitHub App configuration

In the GitHub App settings, use the following production values:

| Field | Value |
| --- | --- |
| App name | Current registration: `LastDayNight`. Rename it to `LastDay` in GitHub Developer Settings when ready so the consent screen matches the product. |
| Homepage URL | `https://lastdayapp-ur7gpuvm.manus.space` |
| User authorization callback URL | `https://lastdayapp-ur7gpuvm.manus.space/api/github/callback` |
| Install scope | Any account |
| Webhooks | Off for the first release |

The required server-only secret names are `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_APP_CALLBACK_URL`. No GitHub token, client secret, or PEM key belongs in the source repository.

## 4. Verify the first connection

Sign into LastDay, select **Connect GitHub**, then complete GitHub’s authorization and app installation process. Choose **Only select repositories** and approve only repositories that should be part of your private workspace. Once returned to the dashboard, select **Start first import**. The app imports a 12-month contribution calendar and selected repository metadata without publishing any repository detail.

## 5. Enable background refresh

After deployment, choose the scheduled-refresh control once it is exposed in the dashboard. The platform calls `/api/scheduled/github-sync` every 12 hours. Each callback is authenticated as a scheduled job, resolves its GitHub account by a persisted task identifier, and performs an idempotent, rate-aware batch. Do not attempt to run the sync with an in-process timer.

## 6. Push the code to the existing repository

The target repository is `https://github.com/sunveda/lastday`. The repository is public, so review the project before pushing and confirm that no secrets, `.pem` files, sync outputs, or local `.env` files are included. The TypeScript ingestion module, database migrations, and application code are safe to commit; credentials are injected only through the deployment secret configuration. The default Node deployment image is sufficient because the production runtime has no extra system dependency.
