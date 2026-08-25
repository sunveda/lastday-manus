import { describe, expect, it } from "vitest";
import { parseContributionSummary } from "./ingestion";

describe("GitHub TypeScript ingestion", () => {
  it("normalizes contribution calendar and repository metadata", () => {
    const summary = parseContributionSummary({
      data: {
        viewer: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 7,
              weeks: [
                { contributionDays: [{ date: "2026-08-24", contributionCount: 3 }] },
                { contributionDays: [{ date: "2026-08-25", contributionCount: 4 }] },
              ],
            },
            totalCommitContributions: 4,
            totalPullRequestContributions: 1,
            totalIssueContributions: 1,
            totalPullRequestReviewContributions: 1,
          },
          repositories: {
            nodes: [
              {
                id: "repo-1",
                name: "private-project",
                nameWithOwner: "sunveda/private-project",
                isPrivate: true,
                isArchived: false,
                visibility: "PRIVATE",
                pushedAt: "2026-08-25T03:00:00Z",
                updatedAt: "2026-08-25T03:01:00Z",
                owner: { login: "sunveda" },
                primaryLanguage: { name: "TypeScript" },
                defaultBranchRef: { name: "main" },
              },
            ],
          },
        },
        rateLimit: { remaining: 4980 },
      },
    });

    expect(summary).toEqual({
      totalContributions: 7,
      commitCount: 4,
      pullRequestCount: 1,
      issueCount: 1,
      reviewCount: 1,
      rateLimitRemaining: 4980,
      days: [
        { date: "2026-08-24", count: 3 },
        { date: "2026-08-25", count: 4 },
      ],
      repositories: [
        {
          id: "repo-1",
          name: "private-project",
          fullName: "sunveda/private-project",
          ownerLogin: "sunveda",
          visibility: "private",
          isPrivate: true,
          isArchived: false,
          primaryLanguage: "TypeScript",
          defaultBranch: "main",
          pushedAt: "2026-08-25T03:00:00Z",
          updatedAt: "2026-08-25T03:01:00Z",
        },
      ],
    });
  });

  it("rejects malformed GraphQL responses", () => {
    expect(() => parseContributionSummary({ errors: [{ message: "forbidden" }] })).toThrow(
      "GitHub GraphQL returned an error",
    );
  });
});
