# Lastday Architecture Notes

The existing `sunveda/lastday` GitHub repository is public and currently empty. The application will therefore be created from the initialized full-stack project and later pushed to that repository after owner confirmation.

Lastday uses the supplied React, Express, tRPC, and MySQL/TiDB scaffold for the authenticated web experience and durable user-scoped data. A compact Python ingestion and analytics module runs from the server process for each requested or scheduled synchronization batch. It is not a separately persistent service: scheduled execution must use the platform-supported HTTP scheduling facility and every batch must finish within the request window.

Production needs Python available to the Node server process. The deployment will therefore use a root Dockerfile based on the Node image with Python 3 installed. The application server remains responsible for serving the built client and listening on the deployment-provided port.

The custom domain target is `git.sunveda.tech`. The GitHub App authorization callback should eventually use `https://git.sunveda.tech/api/github/callback`; the real route and GitHub App values will be added only after the deployment is publicly available and the relevant secrets have been configured.
