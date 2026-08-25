import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getGithubAccountForSync: vi.fn(),
  startGithubSync: vi.fn(),
  persistContributionCalendar: vi.fn(),
  failGithubSync: vi.fn(),
}));

vi.mock("../db", () => dbMocks);

import { runGithubContributionSync } from "./sync";

describe("runGithubContributionSync", () => {
  it("refuses to synchronize an account after its credentials were disconnected", async () => {
    dbMocks.getGithubAccountForSync.mockResolvedValue({
      id: 9,
      syncStatus: "needs_reauth",
      accessTokenCiphertext: null,
      disconnectedAt: new Date(),
    });

    await expect(runGithubContributionSync(9)).rejects.toThrow("GitHub account is disconnected");
    expect(dbMocks.startGithubSync).not.toHaveBeenCalled();
  });
});
