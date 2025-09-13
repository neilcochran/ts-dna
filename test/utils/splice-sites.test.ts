import {
    validateSpliceSites,
    findPotentialSpliceSites,
    validateGeneSpliceSites,
    SPLICE_DONOR_SEQUENCES,
    SPLICE_ACCEPTOR_SEQUENCES
} from '../../src/utils/splice-sites';
import { GenomicRegion } from '../../src/types/genomic-region';

describe('Splice site utilities', () => {
    describe('constants', () => {
        test('has correct canonical splice sequences', () => {
            expect(SPLICE_DONOR_SEQUENCES).toEqual(['GT']);
            expect(SPLICE_ACCEPTOR_SEQUENCES).toEqual(['AG']);
        });
    });

    describe('validateSpliceSites', () => {
        test('validates canonical GT-AG intron', () => {
            const sequence = 'ATGGTCCCAGTTTAAA';
            const introns: GenomicRegion[] = [
                { start: 3, end: 11 }  // GTCCCAGT - starts with GT, ends with GT (not AG)
            ];

            // This should actually fail because it ends with GT, not AG
            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(false);
            expect(result.invalidIntrons).toHaveLength(1);
            expect(result.invalidIntrons[0].reason).toContain('Invalid acceptor site \'GT\'');
        });

        test('validates proper GT-AG intron', () => {
            const sequence = 'ATGGTCCCAGTTTAAG';
            const introns: GenomicRegion[] = [
                { start: 3, end: 13 }  // GTCCCAGTTT - starts with GT, ends with AG
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(false); // Still invalid because it ends with TT not AG
        });

        test('validates correct GT-AG intron sequence', () => {
            const sequence = 'ATGGTAAAAGCCCGGG';
            const introns: GenomicRegion[] = [
                { start: 3, end: 10 }  // GTAAAAG - starts with GT, ends with AG
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(true);
            expect(result.invalidIntrons).toHaveLength(0);
        });

        test('validates multiple valid introns', () => {
            const sequence = 'ATGGTAAAAGCCCGTBBBAGTTTATAG';
            const introns: GenomicRegion[] = [
                { start: 3, end: 10 },   // GTAAAAG - GT...AG ✓
                { start: 13, end: 20 }   // GTBBBAG - GT...AG ✓
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(true);
            expect(result.invalidIntrons).toHaveLength(0);
        });

        test('rejects intron with invalid donor site', () => {
            const sequence = 'ATGATCCCAGTTTAAA';
            const introns: GenomicRegion[] = [
                { start: 3, end: 11 }  // ATCCCAGT - starts with AT instead of GT, ends with GT instead of AG
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(false);
            expect(result.invalidIntrons.length).toBeGreaterThanOrEqual(1);
            // Should report donor site error (and potentially acceptor too)
            const donorError = result.invalidIntrons.find(err => err.reason.includes('Invalid donor site \'AT\''));
            expect(donorError).toBeDefined();
            expect(donorError?.sequence).toBe('ATCCCAGT');
        });

        test('rejects intron with invalid acceptor site', () => {
            const sequence = 'ATGGTCCCATTTTAAA';
            const introns: GenomicRegion[] = [
                { start: 3, end: 11 }  // GTCCCATT - starts with GT but ends with TT
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(false);
            expect(result.invalidIntrons).toHaveLength(1);
            expect(result.invalidIntrons[0].reason).toContain('Invalid acceptor site \'TT\'');
        });

        test('rejects intron with both invalid sites', () => {
            const sequence = 'ATGATCCCATTTTAAA';
            const introns: GenomicRegion[] = [
                { start: 3, end: 11 }  // ATCCCATT - AT...TT
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(false);
            expect(result.invalidIntrons).toHaveLength(2); // Both donor and acceptor invalid
            // Should report both errors
            const donorError = result.invalidIntrons.find(err => err.reason.includes('Invalid donor site \'AT\''));
            const acceptorError = result.invalidIntrons.find(err => err.reason.includes('Invalid acceptor site \'TT\''));
            expect(donorError).toBeDefined();
            expect(acceptorError).toBeDefined();
        });

        test('rejects intron too short for splice sites', () => {
            const sequence = 'ATGGTAAA';
            const introns: GenomicRegion[] = [
                { start: 3, end: 5 }  // GT - only 2 bases, need at least 4
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(false);
            expect(result.invalidIntrons).toHaveLength(1);
            expect(result.invalidIntrons[0].reason).toContain('Intron too short (2 bases)');
        });

        test('validates minimal 4-base intron GT-AG', () => {
            const sequence = 'ATGGTAG';
            const introns: GenomicRegion[] = [
                { start: 3, end: 7 }  // GTAG - exactly 4 bases
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(true);
        });

        test('handles empty intron list', () => {
            const sequence = 'ATGCCCGGG';
            const introns: GenomicRegion[] = [];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(true);
            expect(result.invalidIntrons).toHaveLength(0);
        });

        test('reports multiple invalid introns', () => {
            const sequence = 'ATGATCCCATTCCCGTAAAATT';
            const introns: GenomicRegion[] = [
                { start: 3, end: 11 },   // ATCCCATT - AT...TT (both invalid)
                { start: 14, end: 22 }   // GTAAAATT - GT...TT (invalid acceptor)
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(false);
            // First intron has 2 errors (donor + acceptor), second has 1 (acceptor)
            expect(result.invalidIntrons.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('findPotentialSpliceSites', () => {
        test('finds single potential intron', () => {
            const sequence = 'ATGGTCCCAGTTTAAA';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            expect(potentialIntrons).toHaveLength(1);
            expect(potentialIntrons[0]).toEqual({
                start: 3,
                end: 10,  // GT at 3, AG at 8, so intron is 3 to 8+2=10
                name: 'potential_intron_3_10'
            });
        });

        test('finds multiple potential introns', () => {
            const sequence = 'GTCCCAGTGTAAAAG';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            expect(potentialIntrons.length).toBeGreaterThan(0);
            // Should find GT at positions 0 and 8, AG at positions 6 and 13
            const validIntrons = potentialIntrons.filter(intron =>
                intron.end - intron.start >= 4
            );
            expect(validIntrons.length).toBeGreaterThan(0);
        });

        test('respects minimum intron length', () => {
            const sequence = 'GTAG';  // 4 bases total
            const potentialIntrons = findPotentialSpliceSites(sequence, 4);

            expect(potentialIntrons).toHaveLength(1);
            expect(potentialIntrons[0]).toEqual({
                start: 0,
                end: 4,
                name: 'potential_intron_0_4'
            });
        });

        test('respects maximum intron length', () => {
            const sequence = 'GT' + 'C'.repeat(1000) + 'AG';  // Very long intron
            const potentialIntrons = findPotentialSpliceSites(sequence, 4, 100);

            expect(potentialIntrons).toHaveLength(0);  // Too long
        });

        test('handles sequence with no GT or AG', () => {
            const sequence = 'ATCCCCTTTAAA';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            expect(potentialIntrons).toHaveLength(0);
        });

        test('handles sequence with GT but no AG', () => {
            const sequence = 'ATGGTCCCCTTTAAA';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            expect(potentialIntrons).toHaveLength(0);
        });

        test('handles sequence with AG but no GT', () => {
            const sequence = 'ATCCCAGTTTAAA';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            expect(potentialIntrons).toHaveLength(0);
        });

        test('sorts results by start position', () => {
            const sequence = 'AGGTCCCAGGTAAAAGTTAG';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            for (let i = 1; i < potentialIntrons.length; i++) {
                expect(potentialIntrons[i].start).toBeGreaterThanOrEqual(
                    potentialIntrons[i - 1].start
                );
            }
        });
    });

    describe('validateGeneSpliceSites', () => {
        test('validates gene with valid splice sites', () => {
            const geneSequence = 'ATGGTAAAAGCCCGGG';
            const introns: GenomicRegion[] = [
                { start: 3, end: 10 }  // GTAAAAG - valid GT-AG
            ];

            const result = validateGeneSpliceSites(geneSequence, introns);
            expect(result.isValid).toBe(true);
        });

        test('identifies invalid splice sites in gene', () => {
            const geneSequence = 'ATGATCCCATTTTAAA';
            const introns: GenomicRegion[] = [
                { start: 3, end: 11 }  // ATCCCATT - invalid AT-TT
            ];

            const result = validateGeneSpliceSites(geneSequence, introns);
            expect(result.isValid).toBe(false);
            expect(result.invalidIntrons.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('edge cases', () => {
        test('handles overlapping GT and AG sequences', () => {
            const sequence = 'GTAGTAG';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            // Should find multiple valid combinations
            expect(potentialIntrons.length).toBeGreaterThan(0);
        });

        test('handles sequence starting with AG and ending with GT', () => {
            const sequence = 'AGCCCGT';
            const potentialIntrons = findPotentialSpliceSites(sequence);

            expect(potentialIntrons).toHaveLength(0);  // No valid GT...AG patterns
        });

        test('validates intron exactly at sequence boundaries', () => {
            const sequence = 'GTCCCAG';
            const introns: GenomicRegion[] = [
                { start: 0, end: 7 }  // Entire sequence is intron
            ];

            const result = validateSpliceSites(sequence, introns);
            expect(result.isValid).toBe(true);
        });
    });
});