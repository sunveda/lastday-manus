"""A bounded, stdlib-only GitHub contribution summarizer for LastDayNight sync batches.

The process receives JSON over stdin and writes one JSON response to stdout. It never
prints access tokens, repository names, or other sensitive data to logs.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass


@dataclass
class ContributionSummary:
    totalContributions: int
    commitCount: int
    pullRequestCount: int
    issueCount: int
    reviewCount: int
    rateLimitRemaining: int | None
    days: list[dict[str, object]]
    repositories: list[dict[str, object]]


QUERY = """
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
}
"""


def request_summary(access_token: str, date_from: str, date_to: str) -> ContributionSummary:
    payload = json.dumps({"query": QUERY, "variables": {"from": date_from, "to": date_to}}).encode()
    request = urllib.request.Request(
        "https://api.github.com/graphql",
        data=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/vnd.github+json",
            "User-Agent": "lastday-sync",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            body = json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"GitHub API request failed with HTTP {error.code}") from error

    if body.get("errors"):
        raise RuntimeError("GitHub GraphQL returned an error")

    collection = body["data"]["viewer"]["contributionsCollection"]
    calendar = collection["contributionCalendar"]
    days = [
        {"date": day["date"], "count": day["contributionCount"]}
        for week in calendar["weeks"]
        for day in week["contributionDays"]
    ]
    repositories = [
        {
            "id": repository["id"],
            "name": repository["name"],
            "fullName": repository["nameWithOwner"],
            "ownerLogin": repository["owner"]["login"],
            "visibility": repository["visibility"].lower(),
            "isPrivate": repository["isPrivate"],
            "isArchived": repository["isArchived"],
            "primaryLanguage": repository["primaryLanguage"]["name"] if repository["primaryLanguage"] else None,
            "defaultBranch": repository["defaultBranchRef"]["name"] if repository["defaultBranchRef"] else None,
            "pushedAt": repository["pushedAt"],
            "updatedAt": repository["updatedAt"],
        }
        for repository in body["data"]["viewer"]["repositories"]["nodes"]
    ]
    return ContributionSummary(
        totalContributions=calendar["totalContributions"],
        commitCount=collection["totalCommitContributions"],
        pullRequestCount=collection["totalPullRequestContributions"],
        issueCount=collection["totalIssueContributions"],
        reviewCount=collection["totalPullRequestReviewContributions"],
        rateLimitRemaining=body["data"].get("rateLimit", {}).get("remaining"),
        days=days,
        repositories=repositories,
    )


def main() -> None:
    input_payload = json.load(sys.stdin)
    for key in ("accessToken", "from", "to"):
        if not input_payload.get(key):
            raise ValueError(f"Missing required input: {key}")
    summary = request_summary(input_payload["accessToken"], input_payload["from"], input_payload["to"])
    sys.stdout.write(json.dumps(asdict(summary)))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # Deliberately omit sensitive request data from error output.
        sys.stderr.write(f"LastDayNight ingestion error: {error}\n")
        raise SystemExit(1)
