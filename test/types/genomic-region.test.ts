import {
    GenomicRegion,
    isValidGenomicRegion,
    regionsOverlap,
    validateNonOverlappingRegions
} from '../../src/types/genomic-region';

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
                { start: 20, end: 25 }
            ];
            expect(validateNonOverlappingRegions(regions)).toBe(true);
        });

        test('validates adjacent regions', () => {
            const regions: GenomicRegion[] = [
                { start: 0, end: 5 },
                { start: 5, end: 10 },
                { start: 10, end: 15 }
            ];
            expect(validateNonOverlappingRegions(regions)).toBe(true);
        });

        test('rejects overlapping regions', () => {
            const regions: GenomicRegion[] = [
                { start: 0, end: 10 },
                { start: 5, end: 15 }
            ];
            expect(validateNonOverlappingRegions(regions)).toBe(false);
        });

        test('rejects overlapping regions in unsorted order', () => {
            const regions: GenomicRegion[] = [
                { start: 10, end: 20 },
                { start: 0, end: 15 },  // Overlaps with first when sorted
                { start: 25, end: 30 }
            ];
            expect(validateNonOverlappingRegions(regions)).toBe(false);
        });

        test('validates regions provided in reverse order', () => {
            const regions: GenomicRegion[] = [
                { start: 20, end: 25 },
                { start: 10, end: 15 },
                { start: 0, end: 5 }
            ];
            expect(validateNonOverlappingRegions(regions)).toBe(true);
        });

        test('handles complex non-overlapping arrangement', () => {
            const regions: GenomicRegion[] = [
                { start: 15, end: 20 },
                { start: 0, end: 3 },
                { start: 25, end: 30 },
                { start: 5, end: 10 }
            ];
            expect(validateNonOverlappingRegions(regions)).toBe(true);
        });

        test('detects overlapping in middle of complex arrangement', () => {
            const regions: GenomicRegion[] = [
                { start: 15, end: 20 },
                { start: 0, end: 3 },
                { start: 25, end: 30 },
                { start: 18, end: 22 }, // Overlaps with first region
                { start: 5, end: 10 }
            ];
            expect(validateNonOverlappingRegions(regions)).toBe(false);
        });
    });
});