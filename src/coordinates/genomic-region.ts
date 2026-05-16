/**
 * Generic, coordinate-system-agnostic genomic region type and helpers.
 *
 * The biological constraints that depend on a particular coordinate space (exon size limits,
 * intron length, splice-site validation) live in the domain modules that own them. This file
 * only carries the pure-shape pieces: the parameterized region interface and helpers that
 * work uniformly across coordinate spaces.
 */

/**
 * A region within a sequence, expressed in 0-based half-open coordinates `[start, end)`.
 *
 * Parameterized by the coordinate space `C` so the type system can prevent accidentally
 * mixing gene-relative and transcript-relative regions. Existing callers that do not yet
 * care about coordinate spaces can use `GenomicRegion` (defaults to plain `number`);
 * brand-aware callers use e.g. `GenomicRegion<GeneCoord>` or `GenomicRegion<TranscriptCoord>`.
 *
 * @typeParam C - The numeric type used for `start` and `end`. Constrained to `number` so brands
 * (which intersect with `number`) and plain numbers both fit; defaults to `number`.
 */
export interface GenomicRegion<C extends number = number> {
  /** 0-based inclusive start position. */
  start: C;

  /** 0-based exclusive end position. */
  end: C;

  /** Optional identifier for the region. */
  name?: string;
}

/**
 * Validates a {@link GenomicRegion} for basic positional sanity: non-negative coordinates and
 * `start < end`.
 *
 * Biological constraints (minimum sizes, splice-site shape, etc.) are enforced separately by
 * the domain modules that own them.
 *
 * @param region - The region to validate
 * @returns `true` if `start >= 0`, `end >= 0`, and `start < end`; otherwise `false`
 * @typeParam C - The coordinate-space brand (inferred)
 */
export function isValidGenomicRegion<C extends number>(region: GenomicRegion<C>): boolean {
  return region.start >= 0 && region.end >= 0 && region.start < region.end;
}

/**
 * Tests whether two regions in the same coordinate space overlap.
 *
 * Regions touch but do not overlap when one's `end` equals the other's `start` (since the
 * convention is half-open).
 *
 * @param region1 - First region
 * @param region2 - Second region (must share `region1`'s coordinate space)
 * @returns `true` if the regions overlap
 * @typeParam C - The coordinate-space brand (inferred)
 */
export function regionsOverlap<C extends number>(
  region1: GenomicRegion<C>,
  region2: GenomicRegion<C>,
): boolean {
  return region1.start < region2.end && region2.start < region1.end;
}

/**
 * Tests whether a list of regions are pairwise non-overlapping.
 *
 * Sorts a copy of the list by `start` and then scans adjacent pairs. Touching boundaries
 * (`prev.end === next.start`) are allowed.
 *
 * @param regions - The regions to check
 * @returns `true` if no two regions overlap
 * @typeParam C - The coordinate-space brand (inferred)
 */
export function validateNonOverlappingRegions<C extends number>(
  regions: GenomicRegion<C>[],
): boolean {
  if (regions.length <= 1) {
    return true;
  }

  const sorted = [...regions].sort((a, b) => a.start - b.start);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].end > sorted[i + 1].start) {
      return false;
    }
  }

  return true;
}
