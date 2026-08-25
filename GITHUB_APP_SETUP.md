# LastDayNight GitHub App Registration

Create a **GitHub App**, not an OAuth App, from **GitHub Settings → Developer settings → GitHub Apps → New GitHub App**. Lastday uses a read-only GitHub App because repository access can be selected at installation time and GitHub credentials are handled only by the server.

## Basic information

| GitHub field | Value for Lastday |
| --- | --- |
| GitHub App name | `LastDayNight` |
| Description | `Private GitHub contribution analytics and owner-controlled developer portfolio.` |
| Homepage URL | `https://lastdayapp-ur7gpuvm.manus.space` |
| User authorization callback URL | `https://lastdayapp-ur7gpuvm.manus.space/api/github/callback` |
| Setup URL | Leave blank for the first release. |
| Webhook | Uncheck **Active**. Lastday v1 uses scheduled, rate-limit-aware synchronization rather than push webhooks. |

Choose **Any account** so other developers can independently connect their own GitHub accounts. Each person still must authorize the app, choose their own repositories, and can revoke access at any time.

## Required permissions

Configure the following repository permissions as **Read-only**. Leave every unlisted permission at **No access**.

| Permission | Level | Why Lastday needs it |
| --- | --- | --- |
| Metadata | Read-only | Identify available repositories, their visibility, language, and current state. This is normally provided automatically. |
| Contents | Read-only | Retrieve commit metadata for selected repositories. Lastday does not edit files or branches. |
| Pull requests | Read-only | Count and analyze pull requests and review-related contribution activity. |
| Issues | Read-only | Count and analyze issue activity where the account owner chooses to include it. |

Do **not** grant Administration, Actions, Deployments, Secrets, Webhooks, Workflows, Commit statuses, or any write permission. Do not grant user email access. Organization member access is also unnecessary for the initial release.

## After you create the app

GitHub will show the app settings page. Complete these steps before installing it:

1. Copy the numeric **App ID** and the **Client ID**.
2. Select **Generate a new client secret**, copy it once, and store it only in the project’s secure secret configuration.
3. Select **Generate a private key** to download the `.pem` file. Preserve the file securely. Its entire text, including the `BEGIN` and `END` lines, is required as a secure server secret.
4. Install the app on your `sunveda` account. Select **Only select repositories** and choose the private repositories you want Lastday to analyze. You can change this selection later from GitHub.

The project needs these values as secrets, never in source code or the public repository:

| Project secret | GitHub settings value |
| --- | --- |
| `GITHUB_APP_ID` | Numeric App ID |
| `GITHUB_APP_CLIENT_ID` | Client ID |
| `GITHUB_APP_CLIENT_SECRET` | Generated client secret |
| `GITHUB_APP_PRIVATE_KEY` | Full downloaded `.pem` private key text |
| `GITHUB_APP_CALLBACK_URL` | `https://lastdayapp-ur7gpuvm.manus.space/api/github/callback` |

> Never commit the client secret or `.pem` private key to `sunveda/lastday`, paste it into an issue, or share it in a public screenshot. Add each value only through the project’s secure secrets screen. If a secret or private key is ever exposed, revoke it immediately in GitHub and generate a replacement.
