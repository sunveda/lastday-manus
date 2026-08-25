import { describe, expect, it } from "vitest";
import { createSafePortfolioProjection } from "./portfolio";

describe("portfolio privacy projection", () => {
  it("only exposes owner-authored, sanitized fields", () => {
    const projection = createSafePortfolioProjection({
      headline: "Payments systems work",
      description: "Designed resilient internal workflows with measurable operational improvements.",
      tags: ["Architecture", "Privacy", "Architecture"],
      publicSlug: "payments-systems-work",
      sourceActivityId: 42,
    });

    expect(projection).toEqual({
      headline: "Payments systems work",
      description: "Designed resilient internal workflows with measurable operational improvements.",
      tags: ["architecture", "privacy"],
      publicSlug: "payments-systems-work",
      sourceActivityId: 42,
    });
    expect(projection).not.toHaveProperty("repositoryName");
    expect(projection).not.toHaveProperty("sourceTitle");
  });
});
