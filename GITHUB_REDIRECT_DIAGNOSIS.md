# GitHub Redirect Diagnosis

The live LastDayNight application generates this OAuth callback exactly:

```text
https://lastdayapp-ur7gpuvm.manus.space/api/github/callback
```

GitHub rejected the authorization request because the GitHub App’s saved Redirect URI was still:

```text
https://git.sunveda.tech/api/github/callback
```

The Redirect URI field in **GitHub App settings → General → Identifying and authorizing users** has been edited to the live built-in deployment callback. The remaining required action is to submit the GitHub App settings form, then retry **Connect GitHub** from the LastDayNight dashboard.
