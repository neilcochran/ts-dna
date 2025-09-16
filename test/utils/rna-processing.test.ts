import { RNA } from '../../src/model/nucleic-acids/RNA';
import { PreMRNA } from '../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import {
    spliceRNA,
    validateReadingFrame
} from '../../src/utils/rna-processing';
import { GenomicRegion } from '../../src/types/genomic-region';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('rna-processing', () => {
    describe('spliceRNA', () => {
        test('splices simple two-exon gene correctly', () => {
            // Gene: exon1-intron-exon2
            const geneSequence = 'ATGAAAGTATGCCCAAGTTCGGG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },   // ATGAAA
                { start: 17, end: 23, name: 'exon2' }  // TCGGG
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAAGUAUGCCCAAGUUCGGG', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAAUUCGGG');
            }
        });

        test('splices three-exon gene correctly', () => {
            // Gene: exon1-intron1-exon2-intron2-exon3
            // Sequence: ATGAAA GT...AG TTCGTC GT...AG TT
            const geneSequence = 'ATGAAAGTTTTTAGTTCGTCGTAAGTT';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },   // ATGAAA
                { start: 14, end: 20, name: 'exon2' }, // TTCGTC
                { start: 25, end: 27, name: 'exon3' }  // TT
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAAGUUUUUAGUUCGUCGUAAGUU', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAAUUCGUCUU');
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

            // Gene creation should fail when no exons provided
            const geneResult = Gene.createGene(geneSequence, []);
            expect(isFailure(geneResult)).toBe(true);
            if (isFailure(geneResult)) {
                expect(geneResult.error).toContain('must have at least one exon');
            }
        });

        test('fails with invalid splice sites', () => {
            // Invalid splice sites (should be GT...AG)
            const geneSequence = 'ATGAAACACGCCCAAATTCGGG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },
                { start: 17, end: 22, name: 'exon2' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACACGCCCAAAUUCGGG', gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Splice site validation failed');
            }
        });

        test('fails when exon region is out of bounds', () => {
            const geneSequence = 'ATGAAAGTATGCCCAAATTCGGG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },
                { start: 25, end: 30, name: 'exon2' } // Out of bounds
            ];

            // This should fail at gene creation, not splicing
            const geneResult = Gene.createGene(geneSequence, exons);
            expect(isFailure(geneResult)).toBe(true);
            if (isFailure(geneResult)) {
                expect(geneResult.error).toContain('extends beyond sequence length');
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
            const rna = new RNA('AUGAAACCCGGGUUAA'); // 16 nucleotides (not divisible by 3)
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

});