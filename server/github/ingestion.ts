export type GithubContributionSummary = {
  totalContributions: number;
  commitCount: number;
  pullRequestCount: number;
  issueCount: number;
  reviewCount: number;
  rateLimitRemaining: number | null;
  days: Array<{ date: string; count: number }>;
  repositories: Array<{
    id: string;
    name: string;
    fullName: string;
    ownerLogin: string;
    visibility: "public" | "private" | "internal";
    isPrivate: boolean;
    isArchived: boolean;
    primaryLanguage: string | null;
    defaultBranch: string | null;
    pushedAt: string | null;
    updatedAt: string | null;
  }>;
};

type GithubGraphqlResponse = {
  data?: {
    viewer?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: number;
          weeks?: Array<{
            contributionDays?: Array<{ date?: string; contributionCount?: number }>;
          }>;
        };
        totalCommitContributions?: number;
        totalPullRequestContributions?: number;
        totalIssueContributions?: number;
        totalPullRequestReviewContributions?: number;
      };
      repositories?: {
        nodes?: Array<{
          id?: string;
          name?: string;
          nameWithOwner?: string;
          isPrivate?: boolean;
          isArchived?: boolean;
          visibility?: string;
          pushedAt?: string | null;
          updatedAt?: string | null;
          owner?: { login?: string };
          primaryLanguage?: { name?: string } | null;
          defaultBranchRef?: { name?: string } | null;
        } | null>;
      };
    };
    rateLimit?: { remaining?: number };
  };
  errors?: unknown[];
};

const CONTRIBUTION_SUMMARY_QUERY = `
query ContributionSummary($from: DateTime!, $to: DateTime!) {
  viewer {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
    }
    repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}, affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
      nodes {
        id name nameWithOwner isPrivate isArchived visibility pushedAt updatedAt
        owner { login }
        primaryLanguage { name }
        defaultBranchRef { name }
      }
    }
  }
  rateLimit { remaining }
}`;

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`GitHub response is missing ${field}`);
  }
  return value;
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`GitHub response is missing ${field}`);
  }
  return value;
}

function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`GitHub response is missing ${field}`);
  }
  return value;
}

function normalizeVisibility(value: unknown): "public" | "private" | "internal" {
  const visibility = typeof value === "string" ? value.toLowerCase() : "";
  if (visibility !== "public" && visibility !== "private" && visibility !== "internal") {
    throw new Error("GitHub response contains an unsupported repository visibility");
  }
  return visibility;
}

export function parseContributionSummary(body: GithubGraphqlResponse): GithubContributionSummary {
  if (body.errors?.length) throw new Error("GitHub GraphQL returned an error");

  const collection = body.data?.viewer?.contributionsCollection;
  const calendar = collection?.contributionCalendar;
  if (!collection || !calendar || !calendar.weeks) {
    throw new Error("GitHub response is missing contribution data");
  }

  const days = calendar.weeks.flatMap(week =>
    (week.contributionDays ?? []).map(day => ({
      date: requiredString(day.date, "contribution date"),
      count: requiredNumber(day.contributionCount, "contribution count"),
    })),
  );

  const repositoryNodes = body.data?.viewer?.repositories?.nodes ?? [];
  const repositories = repositoryNodes.filter((repository): repository is NonNullable<typeof repository> => repository !== null).map(repository => ({
    id: requiredString(repository.id, "repository id"),
    name: requiredString(repository.name, "repository name"),
    fullName: requiredString(repository.nameWithOwner, "repository full name"),
    ownerLogin: requiredString(repository.owner?.login, "repository owner"),
    visibility: normalizeVisibility(repository.visibility),
    isPrivate: requiredBoolean(repository.isPrivate, "repository privacy"),
    isArchived: requiredBoolean(repository.isArchived, "repository archive status"),
    primaryLanguage: repository.primaryLanguage?.name ?? null,
    defaultBranch: repository.defaultBranchRef?.name ?? null,
    pushedAt: repository.pushedAt ?? null,
    updatedAt: repository.updatedAt ?? null,
  }));

  return {
    totalContributions: requiredNumber(calendar.totalContributions, "total contributions"),
    commitCount: requiredNumber(collection.totalCommitContributions, "commit contributions"),
    pullRequestCount: requiredNumber(collection.totalPullRequestContributions, "pull request contributions"),
    issueCount: requiredNumber(collection.totalIssueContributions, "issue contributions"),
    reviewCount: requiredNumber(collection.totalPullRequestReviewContributions, "review contributions"),
    rateLimitRemaining: body.data?.rateLimit?.remaining ?? null,
    days,
    repositories,
  };
}

/** Fetches a bounded contribution summary without logging or persisting the access token. */
export async function summarizeContributionBatch(input: {
  accessToken: string;
  from: string;
  to: string;
}): Promise<GithubContributionSummary> {
  if (!input.accessToken) throw new Error("GitHub access token is required");
  if (!input.from || !input.to) throw new Error("GitHub sync date range is required");

  let response: Response;
  try {
    response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "lastday-sync",
      },
      body: JSON.stringify({
        query: CONTRIBUTION_SUMMARY_QUERY,
        variables: { from: input.from, to: input.to },
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new Error("GitHub API request failed");
  }

  if (!response.ok) throw new Error(`GitHub API request failed with HTTP ${response.status}`);

  let body: GithubGraphqlResponse;
  try {
    body = (await response.json()) as GithubGraphqlResponse;
  } catch {
    throw new Error("GitHub API returned invalid JSON");
  }
  return parseContributionSummary(body);
}
