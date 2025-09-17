import { RNA } from '../../src/model/nucleic-acids/RNA';
import { PreMRNA } from '../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import {
    spliceRNA,
    validateReadingFrame
} from '../../src/utils/rna-processing';
import { GenomicRegion } from '../../src/types/genomic-region';
import { isSuccess, isFailure } from '../../src/types/validation-result';
import { SIMPLE_TWO_EXON_GENE, THREE_EXON_GENE, SINGLE_EXON_GENE, INVALID_SPLICE_GENE } from '../test-genes';

describe('rna-processing', () => {
    describe('spliceRNA', () => {
        test('splices simple two-exon gene correctly', () => {
            const gene = new Gene(SIMPLE_TWO_EXON_GENE.dnaSequence, SIMPLE_TWO_EXON_GENE.exons);
            const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe(SIMPLE_TWO_EXON_GENE.splicedRNA);
            }
        });

        test('splices three-exon gene correctly', () => {
            const gene = new Gene(THREE_EXON_GENE.dnaSequence, THREE_EXON_GENE.exons);
            const preMRNA = new PreMRNA(THREE_EXON_GENE.rnaSequence, gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe(THREE_EXON_GENE.splicedRNA);
            }
        });

        test('handles single exon gene (no splicing needed)', () => {
            const gene = new Gene(SINGLE_EXON_GENE.dnaSequence, SINGLE_EXON_GENE.exons);
            const preMRNA = new PreMRNA(SINGLE_EXON_GENE.rnaSequence, gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe(SINGLE_EXON_GENE.splicedRNA);
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
            const gene = new Gene(INVALID_SPLICE_GENE.dnaSequence, INVALID_SPLICE_GENE.exons);
            const preMRNA = new PreMRNA(INVALID_SPLICE_GENE.rnaSequence, gene, 0);

            const result = spliceRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Splice site validation failed');
            }
        });

        test('fails when exon region is out of bounds', () => {
            const geneSequence = 'ATGAAAGTATGCCCAAATTCGGG'; // 23bp total
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },
                { start: 25, end: 30, name: 'exon2' } // Out of bounds - starts at 25 but sequence only 23bp
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