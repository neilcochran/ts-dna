import { buildOptimizedIntervalTree, IntervalTree } from '../../src/types/genomic-region';
import type { GenomicRegion } from '../../src/coordinates';

describe('GenomicRegion interval-tree utilities', () => {
  describe('IntervalTree', () => {
    test('constructs tree from intervals', () => {
      const intervals: GenomicRegion[] = [
        { start: 0, end: 10 },
        { start: 20, end: 30 },
        { start: 40, end: 50 },
      ];
      const tree = new IntervalTree(intervals);
      expect(tree).toBeInstanceOf(IntervalTree);
    });

    test('finds overlapping intervals', () => {
      const intervals: GenomicRegion[] = [
        { start: 0, end: 10, name: 'interval1' },
        { start: 15, end: 25, name: 'interval2' },
        { start: 30, end: 40, name: 'interval3' },
        { start: 20, end: 35, name: 'interval4' },
      ];
      const tree = new IntervalTree(intervals);

      const query = { start: 18, end: 32 };
      const overlaps = tree.findOverlaps(query);

      expect(overlaps).toHaveLength(3);
      expect(overlaps.map(i => i.name)).toContain('interval2');
      expect(overlaps.map(i => i.name)).toContain('interval3');
      expect(overlaps.map(i => i.name)).toContain('interval4');
    });

    test('detects overlap existence efficiently', () => {
      const intervals: GenomicRegion[] = [];
      for (let i = 0; i < 1000; i++) {
        intervals.push({ start: i * 10, end: i * 10 + 5 });
      }
      const tree = new IntervalTree(intervals);

      const query = { start: 5005, end: 5015 };
      const hasOverlap = tree.hasOverlap(query);
      expect(hasOverlap).toBe(true);
    });

    test('returns no overlaps when none exist', () => {
      const intervals: GenomicRegion[] = [
        { start: 0, end: 10 },
        { start: 20, end: 30 },
      ];
      const tree = new IntervalTree(intervals);

      const query = { start: 12, end: 18 };
      const overlaps = tree.findOverlaps(query);
      expect(overlaps).toHaveLength(0);
    });

    test('handles empty tree gracefully', () => {
      const tree = new IntervalTree([]);
      const query = { start: 0, end: 10 };

      const overlaps = tree.findOverlaps(query);
      expect(overlaps).toHaveLength(0);

      const hasOverlap = tree.hasOverlap(query);
      expect(hasOverlap).toBe(false);
    });

    test('performs efficiently with large datasets', () => {
      const intervals: GenomicRegion[] = [];
      for (let i = 0; i < 10000; i++) {
        intervals.push({
          start: Math.random() * 1000000,
          end: Math.random() * 1000000 + 1000,
        });
      }

      const startTime = performance.now();
      const tree = new IntervalTree(intervals);
      const constructionTime = performance.now();

      const query = { start: 500000, end: 510000 };
      tree.findOverlaps(query);
      const queryTime = performance.now();

      expect(constructionTime - startTime).toBeLessThan(1000);
      expect(queryTime - constructionTime).toBeLessThan(100);
    });
  });

  describe('buildOptimizedIntervalTree', () => {
    test('creates interval tree from genomic regions', () => {
      const intervals: GenomicRegion[] = [
        { start: 0, end: 100 },
        { start: 200, end: 300 },
        { start: 400, end: 500 },
      ];

      const tree = buildOptimizedIntervalTree(intervals);
      expect(tree).toBeInstanceOf(IntervalTree);

      const query = { start: 50, end: 150 };
      const overlaps = tree.findOverlaps(query);
      expect(overlaps).toHaveLength(1);
      expect(overlaps[0].start).toBe(0);
      expect(overlaps[0].end).toBe(100);
    });

    test('handles empty input', () => {
      const tree = buildOptimizedIntervalTree([]);
      expect(tree).toBeInstanceOf(IntervalTree);

      const overlaps = tree.findOverlaps({ start: 0, end: 10 });
      expect(overlaps).toHaveLength(0);
    });
  });
});
