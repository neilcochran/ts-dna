import {
  GenomicRegion,
  isValidGenomicRegion,
  regionsOverlap,
  validateNonOverlappingRegions,
  validateExons,
  buildOptimizedIntervalTree,
  IntervalTree,
} from '../../src/types/genomic-region';
import { MIN_INTRON_SIZE } from '../../src/constants/biological-constants';

describe('GenomicRegion utilities', () => {
  describe('isValidGenomicRegion', () => {
    test('validates correct region', () => {
      const region: GenomicRegion = { start: 0, end: 10 };
      expect(isValidGenomicRegion(region)).toBe(true);
    });

    test('validates region with name', () => {
      const region: GenomicRegion = { start: 5, end: 15, name: 'exon1' };
      expect(isValidGenomicRegion(region)).toBe(true);
    });

    test('rejects region where start equals end', () => {
      const region: GenomicRegion = { start: 5, end: 5 };
      expect(isValidGenomicRegion(region)).toBe(false);
    });

    test('rejects region where start > end', () => {
      const region: GenomicRegion = { start: 10, end: 5 };
      expect(isValidGenomicRegion(region)).toBe(false);
    });

    test('rejects region with negative start', () => {
      const region: GenomicRegion = { start: -1, end: 10 };
      expect(isValidGenomicRegion(region)).toBe(false);
    });

    test('rejects region with negative end', () => {
      const region: GenomicRegion = { start: 0, end: -5 };
      expect(isValidGenomicRegion(region)).toBe(false);
    });

    test('validates zero-start region', () => {
      const region: GenomicRegion = { start: 0, end: 1 };
      expect(isValidGenomicRegion(region)).toBe(true);
    });
  });

  describe('regionsOverlap', () => {
    test('detects overlapping regions', () => {
      const region1: GenomicRegion = { start: 0, end: 10 };
      const region2: GenomicRegion = { start: 5, end: 15 };
      expect(regionsOverlap(region1, region2)).toBe(true);
    });

    test('detects overlapping regions (reverse order)', () => {
      const region1: GenomicRegion = { start: 5, end: 15 };
      const region2: GenomicRegion = { start: 0, end: 10 };
      expect(regionsOverlap(region1, region2)).toBe(true);
    });

    test('detects adjacent non-overlapping regions', () => {
      const region1: GenomicRegion = { start: 0, end: 10 };
      const region2: GenomicRegion = { start: 10, end: 20 };
      expect(regionsOverlap(region1, region2)).toBe(false);
    });

    test('detects separated regions', () => {
      const region1: GenomicRegion = { start: 0, end: 5 };
      const region2: GenomicRegion = { start: 10, end: 15 };
      expect(regionsOverlap(region1, region2)).toBe(false);
    });

    test('detects fully contained region', () => {
      const region1: GenomicRegion = { start: 0, end: 20 };
      const region2: GenomicRegion = { start: 5, end: 15 };
      expect(regionsOverlap(region1, region2)).toBe(true);
    });

    test('detects identical regions', () => {
      const region1: GenomicRegion = { start: 5, end: 15 };
      const region2: GenomicRegion = { start: 5, end: 15 };
      expect(regionsOverlap(region1, region2)).toBe(true);
    });

    test('detects single-base overlap', () => {
      const region1: GenomicRegion = { start: 0, end: 6 };
      const region2: GenomicRegion = { start: 5, end: 10 };
      expect(regionsOverlap(region1, region2)).toBe(true);
    });
  });

  describe('validateNonOverlappingRegions', () => {
    test('validates empty array', () => {
      expect(validateNonOverlappingRegions([])).toBe(true);
    });

    test('validates single region', () => {
      const regions: GenomicRegion[] = [{ start: 0, end: 10 }];
      expect(validateNonOverlappingRegions(regions)).toBe(true);
    });

    test('validates non-overlapping regions', () => {
      const regions: GenomicRegion[] = [
        { start: 0, end: 5 },
        { start: 10, end: 15 },
        { start: 20, end: 25 },
      ];
      expect(validateNonOverlappingRegions(regions)).toBe(true);
    });

    test('validates adjacent regions', () => {
      const regions: GenomicRegion[] = [
        { start: 0, end: 5 },
        { start: 5, end: 10 },
        { start: 10, end: 15 },
      ];
      expect(validateNonOverlappingRegions(regions)).toBe(true);
    });

    test('rejects overlapping regions', () => {
      const regions: GenomicRegion[] = [
        { start: 0, end: 10 },
        { start: 5, end: 15 },
      ];
      expect(validateNonOverlappingRegions(regions)).toBe(false);
    });

    test('rejects overlapping regions in unsorted order', () => {
      const regions: GenomicRegion[] = [
        { start: 10, end: 20 },
        { start: 0, end: 15 }, // Overlaps with first when sorted
        { start: 25, end: 30 },
      ];
      expect(validateNonOverlappingRegions(regions)).toBe(false);
    });

    test('validates regions provided in reverse order', () => {
      const regions: GenomicRegion[] = [
        { start: 20, end: 25 },
        { start: 10, end: 15 },
        { start: 0, end: 5 },
      ];
      expect(validateNonOverlappingRegions(regions)).toBe(true);
    });

    test('handles complex non-overlapping arrangement', () => {
      const regions: GenomicRegion[] = [
        { start: 15, end: 20 },
        { start: 0, end: 3 },
        { start: 25, end: 30 },
        { start: 5, end: 10 },
      ];
      expect(validateNonOverlappingRegions(regions)).toBe(true);
    });

    test('detects overlapping in middle of complex arrangement', () => {
      const regions: GenomicRegion[] = [
        { start: 15, end: 20 },
        { start: 0, end: 3 },
        { start: 25, end: 30 },
        { start: 18, end: 22 }, // Overlaps with first region
        { start: 5, end: 10 },
      ];
      expect(validateNonOverlappingRegions(regions)).toBe(false);
    });
  });

  describe('validateExons', () => {
    test('validates single exon successfully', () => {
      const exons: GenomicRegion[] = [{ start: 0, end: 100, name: 'exon1' }];
      const result = validateExons(exons, 200);
      expect(result.success).toBe(true);
    });

    test('validates multiple non-overlapping exons', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 50, name: 'exon1' },
        { start: 100, end: 150, name: 'exon2' },
        { start: 200, end: 250, name: 'exon3' },
      ];
      const result = validateExons(exons, 300);
      expect(result.success).toBe(true);
    });

    test('rejects genes with no exons', () => {
      const result = validateExons([], 100);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Gene must have at least one exon');
      }
    });

    test('detects overlapping exons with detailed error reporting', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 50, name: 'exon1' },
        { start: 40, end: 90, name: 'exon2' }, // Overlaps with exon1
        { start: 100, end: 150, name: 'exon3' },
      ];
      const result = validateExons(exons, 200);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Exon overlap detected');
        expect(result.error).toContain('position 40');
      }
    });

    test('rejects exons extending beyond sequence length', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 50 },
        { start: 100, end: 250 }, // Extends beyond sequence length of 200
      ];
      const result = validateExons(exons, 200);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('extends beyond sequence length');
      }
    });

    test('enforces minimum exon size constraint', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 2 }, // Only 2 bp, below minimum of 3
        { start: 50, end: 100 },
      ];
      const result = validateExons(exons, 150);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('too small');
        expect(result.error).toContain('minimum 3 bp required');
      }
    });

    test('enforces maximum exon size constraint', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 60000 }, // Exceeds maximum of 50000 bp
      ];
      const result = validateExons(exons, 70000);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('unrealistically large');
        expect(result.error).toContain('maximum 50000 bp');
      }
    });

    test('enforces minimum intron size constraint', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 50 },
        { start: 65, end: 100 }, // Only 15 bp intron, below minimum of ${MIN_INTRON_SIZE}
      ];
      const result = validateExons(exons, 150);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Intron between exons is too small');
        expect(result.error).toContain('minimum ' + MIN_INTRON_SIZE + ' bp required');
      }
    });

    test('enforces maximum intron size constraint', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 50 },
        { start: 1050100, end: 1050150 }, // Massive intron exceeding 1MB limit
      ];
      const result = validateExons(exons, 1050200);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('unrealistically large');
        expect(result.error).toContain('maximum 1000000 bp');
      }
    });

    test('handles large numbers of exons efficiently', () => {
      // Test with many exons to verify O(n log n) performance
      const exons: GenomicRegion[] = [];
      for (let i = 0; i < 1000; i++) {
        exons.push({
          start: i * 100,
          end: i * 100 + 50,
          name: `exon${i}`,
        });
      }

      const startTime = performance.now();
      const result = validateExons(exons, 100000);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      // Should complete quickly even with 1000 exons
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
    });

    test('provides detailed error for invalid coordinates', () => {
      const exons: GenomicRegion[] = [
        { start: -5, end: 50 }, // Invalid negative start
      ];
      const result = validateExons(exons, 100);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('invalid coordinates');
      }
    });

    test('handles adjacent exons correctly', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 50 },
        { start: 70, end: 120 }, // ${MIN_INTRON_SIZE} bp intron, exactly at minimum
        { start: 140, end: 190 },
      ];
      const result = validateExons(exons, 200);
      expect(result.success).toBe(true);
    });
  });

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

      // Construction should be reasonable even with 10k intervals
      expect(constructionTime - startTime).toBeLessThan(1000); // Less than 1 second
      // Query should be very fast
      expect(queryTime - constructionTime).toBeLessThan(10); // Less than 10ms
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
