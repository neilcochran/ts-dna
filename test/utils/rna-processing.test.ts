import { RNA } from '../../src/model/nucleic-acids/RNA';
import { PreMRNA } from '../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import {
    spliceRNA,
    validateReadingFrame,
    analyzeSplicingQuality
} from '../../src/utils/rna-processing';
import { GenomicRegion } from '../../src/types/genomic-region';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('rna-processing', () => {
    describe('spliceRNA', () => {
        test('splices simple two-exon gene correctly', () => {
            // Gene: exon1-intron-exon2
            const geneSequence = 'ATGAAAGTATGCCCAAATTCGGG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },   // ATGAAA
                { start: 17, end: 23, name: 'exon2' }  // TCGGG
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAAGUAUGCCCAAAUUCGGG', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAAUUCGGG');
            }
        });

        test('splices three-exon gene correctly', () => {
            // Gene: exon1-intron1-exon2-intron2-exon3
            const geneSequence = 'ATGAAAGTACGCCCAAATTCGTCCCCGGGTTT';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },   // ATGAAA
                { start: 18, end: 24, name: 'exon2' }, // TTCGTC
                { start: 30, end: 33, name: 'exon3' }  // TTT
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAAGUACGCCCAAAUUCGUCCCCGGGUUU', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAAUUCGUCUUU');
            }
        });

        test('handles single exon gene (no splicing needed)', () => {
            const geneSequence = 'ATGAAACCCGGGTTT';
            const exons: GenomicRegion[] = [
                { start: 0, end: 15, name: 'exon1' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACCCGGGUUU', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAACCCGGGUUU');
            }
        });

        test('fails when no exons present', () => {
            const geneSequence = 'ATGAAACCCGGGTTT';
            const gene = new Gene(geneSequence, []);
            const preMRNA = new PreMRNA('AUGAAACCCGGGUUU', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('no exons found');
            }
        });

        test('fails with invalid splice sites', () => {
            // Invalid splice sites (should be GT...AG)
            const geneSequence = 'ATGAAACACGCCCAAATTCGGG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },
                { start: 17, end: 23, name: 'exon2' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACACGCCCAAAUUCGGG', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('splice site validation failed');
            }
        });

        test('fails when exon region is out of bounds', () => {
            const geneSequence = 'ATGAAAGTATGCCCAAATTCGGG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },
                { start: 25, end: 30, name: 'exon2' } // Out of bounds
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAAGUAUGCCCAAAUUCGGG', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('outside sequence bounds');
            }
        });
    });

    describe('validateReadingFrame', () => {
        test('validates correct reading frame', () => {
            const rna = new RNA('AUGAAACCCGGGUUU'); // 15 nucleotides = 5 codons
            const result = validateReadingFrame(rna);

            expect(isSuccess(result)).toBe(true);
        });

        test('fails with incorrect reading frame length', () => {
            const rna = new RNA('AUGAAACCCGGGUUA'); // 16 nucleotides (not divisible by 3)
            const result = validateReadingFrame(rna);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('not divisible by 3');
            }
        });

        test('validates start codon when position specified', () => {
            const rna = new RNA('UUUAUGAAACCCGGG');
            const result = validateReadingFrame(rna, 3);

            expect(isSuccess(result)).toBe(true);
        });

        test('fails with wrong start codon', () => {
            const rna = new RNA('AAGAAACCCGGGUUU');
            const result = validateReadingFrame(rna, 0);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Expected start codon AUG');
            }
        });

        test('validates reading frame from custom start position', () => {
            const rna = new RNA('UUUUUUGGGCCCAAA'); // 12 nucleotides from position 3
            const result = validateReadingFrame(rna, 3);

            expect(isSuccess(result)).toBe(true);
        });
    });

    describe('analyzeSplicingQuality', () => {
        test('analyzes basic splicing quality metrics', () => {
            const rna = new RNA('AUGAAACCCGGGUAA');
            const metrics = analyzeSplicingQuality(rna);

            expect(metrics.exonCount).toBe(1);
            expect(metrics.totalExonLength).toBe(15);
            expect(metrics.averageExonLength).toBe(15);
            expect(metrics.hasValidReadingFrame).toBe(true);
            expect(metrics.hasStartCodon).toBe(true);
            expect(metrics.hasStopCodon).toBe(true); // UAA is stop codon
            expect(metrics.frameshiftRisk).toBe(false);
        });

        test('detects missing start codon', () => {
            const rna = new RNA('AAGAAACCCGGGUAA');
            const metrics = analyzeSplicingQuality(rna);

            expect(metrics.hasStartCodon).toBe(false);
            expect(metrics.frameshiftRisk).toBe(true);
        });

        test('detects missing stop codon', () => {
            const rna = new RNA('AUGAAACCCGGGAAA');
            const metrics = analyzeSplicingQuality(rna);

            expect(metrics.hasStopCodon).toBe(false);
        });

        test('detects reading frame problems', () => {
            const rna = new RNA('AUGAAACCCGGGUU'); // 14 nucleotides (not divisible by 3)
            const metrics = analyzeSplicingQuality(rna);

            expect(metrics.hasValidReadingFrame).toBe(false);
            expect(metrics.frameshiftRisk).toBe(true);
        });

        test('analyzes quality with custom coding start', () => {
            const rna = new RNA('UUUAUGAAACCCGGGUAA');
            const metrics = analyzeSplicingQuality(rna, 3);

            expect(metrics.hasStartCodon).toBe(true);
            expect(metrics.hasValidReadingFrame).toBe(true);
            expect(metrics.frameshiftRisk).toBe(false);
        });

        test('detects all three stop codons', () => {
            // Test UAA
            const rna1 = new RNA('AUGAAACCCGGGUAA');
            expect(analyzeSplicingQuality(rna1).hasStopCodon).toBe(true);

            // Test UAG
            const rna2 = new RNA('AUGAAACCCGGGUAG');
            expect(analyzeSplicingQuality(rna2).hasStopCodon).toBe(true);

            // Test UGA
            const rna3 = new RNA('AUGAAACCCGGGUGA');
            expect(analyzeSplicingQuality(rna3).hasStopCodon).toBe(true);
        });
    });
});