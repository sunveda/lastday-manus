import { describe, expect, it } from "vitest";

describe("GitHub repository push token", () => {
  it("has access to the target LastDayNight repository", async () => {
    const token = process.env.GITHUB_REPO_PUSH_TOKEN;
    expect(token, "Missing short-lived GitHub repository push token").toBeTruthy();

    const response = await fetch("https://api.github.com/repos/sunveda/lastday", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "lastdaynight-repository-handoff",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.status).toBe(200);
    const repository = await response.json() as { full_name?: string; permissions?: { push?: boolean } };
    expect(repository.full_name).toBe("sunveda/lastday");
    expect(repository.permissions?.push).toBe(true);

    const blobResponse = await fetch("https://api.github.com/repos/sunveda/lastday/git/blobs", {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "lastdaynight-repository-handoff",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ content: "LastDayNight write-access verification", encoding: "utf-8" }),
    });
    // GitHub returns 409 for Git-data blob creation while a repository has no
    // first commit. A 409 here proves the token reached the write endpoint;
    // the repository bootstrap uses the Contents API before later blob writes.
    expect([201, 409]).toContain(blobResponse.status);
  }, 30_000);
});
