import { type GenomicRegion, regionsOverlap } from '../coordinates/index.js';

/**
 * Memory-efficient interval tree implementation for very large gene sets.
 * Used when validating genes with 1000+ exons or genome-wide analysis.
 *
 * @param intervals - Array of genomic intervals to build tree from
 * @returns Optimized interval tree for overlap queries
 */
export function buildOptimizedIntervalTree(intervals: GenomicRegion[]): IntervalTree {
  return new IntervalTree(intervals);
}

/**
 * Optimized interval tree for genome-scale overlap detection.
 * Provides O(log n) query time for overlap detection in large datasets.
 */
export class IntervalTree {
  private readonly root: IntervalNode | null = null;

  /**
   * @param intervals - Array of regions to seed the tree with
   */
  constructor(intervals: GenomicRegion[]) {
    if (intervals.length > 0) {
      const sorted = [...intervals].sort((a, b) => a.start - b.start);
      this.root = this.buildTree(sorted, 0, sorted.length - 1);
    }
  }

  private buildTree(intervals: GenomicRegion[], start: number, end: number): IntervalNode | null {
    if (start > end) {
      return null;
    }
    const mid = Math.floor((start + end) / 2);
    const node = new IntervalNode(intervals[mid]);

    node.left = this.buildTree(intervals, start, mid - 1);
    node.right = this.buildTree(intervals, mid + 1, end);

    node.maxEnd = Math.max(node.interval.end, node.left?.maxEnd ?? 0, node.right?.maxEnd ?? 0);

    return node;
  }

  /**
   * Finds all intervals that overlap with the given region.
   * @param region - Query region to find overlaps for
   * @returns Array of overlapping intervals
   */
  findOverlaps(region: GenomicRegion): GenomicRegion[] {
    const result: GenomicRegion[] = [];
    this.searchOverlaps(this.root, region, result);
    return result;
  }

  private searchOverlaps(
    node: IntervalNode | null,
    query: GenomicRegion,
    result: GenomicRegion[],
  ): void {
    if (!node) {
      return;
    }

    if (regionsOverlap(node.interval, query)) {
      result.push(node.interval);
    }

    if (node.left && node.left.maxEnd >= query.start) {
      this.searchOverlaps(node.left, query, result);
    }

    if (node.right && node.interval.start <= query.end) {
      this.searchOverlaps(node.right, query, result);
    }
  }

  /**
   * Checks if any interval overlaps with the given region.
   * @param region - Query region to check for overlaps
   * @returns true if any overlap exists, false otherwise
   */
  hasOverlap(region: GenomicRegion): boolean {
    return this.checkOverlap(this.root, region);
  }

  private checkOverlap(node: IntervalNode | null, query: GenomicRegion): boolean {
    if (!node) {
      return false;
    }

    if (regionsOverlap(node.interval, query)) {
      return true;
    }

    if (node.left && node.left.maxEnd >= query.start) {
      if (this.checkOverlap(node.left, query)) {
        return true;
      }
    }

    if (node.right && node.interval.start <= query.end) {
      if (this.checkOverlap(node.right, query)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Node in the interval tree for efficient overlap detection.
 * @internal This is an internal implementation detail and should not be used directly.
 */
export class IntervalNode {
  /** Region stored at this node. */
  interval: GenomicRegion;
  /** Maximum `end` coordinate reachable from this node's subtree (used for pruning queries). */
  maxEnd: number;
  /** Left subtree (intervals with smaller `start`). */
  left: IntervalNode | null = null;
  /** Right subtree (intervals with larger `start`). */
  right: IntervalNode | null = null;

  /**
   * @param interval - Region stored at this node
   */
  constructor(interval: GenomicRegion) {
    this.interval = interval;
    this.maxEnd = interval.end;
  }
}
