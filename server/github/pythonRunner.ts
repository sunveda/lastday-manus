import { spawn } from "node:child_process";
import path from "node:path";

export type PythonContributionSummary = {
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

/** Runs a bounded Python process for one GitHub import batch. It never logs tokens. */
export async function summarizeContributionBatch(input: {
  accessToken: string;
  from: string;
  to: string;
}): Promise<PythonContributionSummary> {
  const scriptPath = path.join(process.cwd(), "python", "lastday_ingestion.py");
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", code => {
      if (code !== 0) return reject(new Error(`Python ingestion failed: ${stderr || "unknown error"}`));
      try {
        resolve(JSON.parse(stdout) as PythonContributionSummary);
      } catch {
        reject(new Error("Python ingestion returned invalid JSON"));
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}
