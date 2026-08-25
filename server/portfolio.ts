export type PortfolioProjectionInput = {
  headline: string;
  description: string;
  tags: string[];
  publicSlug: string;
  sourceActivityId?: number;
};

/**
 * Produces the only fields allowed to cross the private-to-public boundary.
 * Repository names, source activity titles, URLs, and internal metadata are never accepted here.
 */
export function createSafePortfolioProjection(input: PortfolioProjectionInput) {
  return {
    headline: input.headline.trim(),
    description: input.description.trim(),
    tags: Array.from(new Set(input.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 5),
    publicSlug: input.publicSlug.trim().toLowerCase(),
    sourceActivityId: input.sourceActivityId,
  };
}
