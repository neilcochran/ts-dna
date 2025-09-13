/**
 * Represents a region within a genomic sequence using 0-based indexing.
 * Used for representing introns, exons, promoter regions, and other genomic features.
 */
export interface GenomicRegion {
    /** 0-based inclusive start position */
    start: number;

    /** 0-based exclusive end position */
    end: number;

    /** Optional identifier for the region */
    name?: string;
}

/**
 * Validates a GenomicRegion to ensure it has valid coordinates.
 * @param region - The GenomicRegion to validate
 * @returns true if valid, false otherwise
 */
export function isValidGenomicRegion(region: GenomicRegion): boolean {
    return region.start >= 0 &&
           region.end >= 0 &&
           region.start < region.end;
}

/**
 * Checks if two GenomicRegions overlap.
 * @param region1 - First region
 * @param region2 - Second region
 * @returns true if regions overlap, false otherwise
 */
export function regionsOverlap(region1: GenomicRegion, region2: GenomicRegion): boolean {
    return region1.start < region2.end && region2.start < region1.end;
}

/**
 * Validates that a list of GenomicRegions do not overlap.
 * Uses O(n log n) sorting-based algorithm for efficiency.
 * @param regions - Array of GenomicRegions to validate
 * @returns true if no regions overlap, false otherwise
 */
export function validateNonOverlappingRegions(regions: GenomicRegion[]): boolean {
    if (regions.length <= 1) return true;

    // Sort by start position
    const sorted = [...regions].sort((a, b) => a.start - b.start);

    // Check for overlaps in adjacent regions
    for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].end > sorted[i + 1].start) {
            return false;
        }
    }

    return true;
}