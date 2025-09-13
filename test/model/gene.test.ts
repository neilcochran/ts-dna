import { Gene } from '../../src/model/nucleic-acids/Gene';
import { GenomicRegion } from '../../src/types/genomic-region';
import { InvalidSequenceError } from '../../src/model/errors/InvalidSequenceError';

describe('Gene', () => {
    describe('constructor', () => {
        test('creates valid gene with single exon', () => {
            const sequence = 'ATGCCCGGG';
            const exons: GenomicRegion[] = [{ start: 0, end: 9 }];
            const gene = new Gene(sequence, exons);

            expect(gene.getSequence()).toBe(sequence);
            expect(gene.getExons()).toHaveLength(1);
            expect(gene.getIntrons()).toHaveLength(0);
            expect(gene.getMatureSequence()).toBe(sequence);
        });

        test('creates valid gene with multiple exons', () => {
            const sequence = 'ATGGTCCCAGTTTAAA';
            const exons: GenomicRegion[] = [
                { start: 0, end: 3, name: 'exon1' },
                { start: 11, end: 16, name: 'exon2' }
            ];
            const gene = new Gene(sequence, exons);

            expect(gene.getExons()).toHaveLength(2);
            expect(gene.getIntrons()).toHaveLength(1);
            expect(gene.getIntrons()[0]).toEqual({
                start: 3,
                end: 11,
                name: 'intron1'
            });
        });

        test('creates valid gene with GT-AG splice sites', () => {
            const sequence = 'ATGGTCCCAGTTTAAA';  // ATG|GTCCCAG|TTTAAA
            const exons: GenomicRegion[] = [
                { start: 0, end: 3 },    // ATG
                { start: 11, end: 16 }   // TTTAAA
            ];
            const gene = new Gene(sequence, exons);

            expect(gene.getIntronSequence(0)).toBe('GTCCCAGT');  // GT...AG intron
        });

        test('throws error with no exons', () => {
            const sequence = 'ATGCCCGGG';
            const exons: GenomicRegion[] = [];

            expect(() => {
                new Gene(sequence, exons);
            }).toThrow(InvalidSequenceError);
        });

        test('throws error with overlapping exons', () => {
            const sequence = 'ATGCCCGGGAAATTT';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6 },
                { start: 3, end: 9 }  // Overlaps with first exon
            ];

            expect(() => {
                new Gene(sequence, exons);
            }).toThrow(InvalidSequenceError);
        });

        test('throws error with exon extending beyond sequence', () => {
            const sequence = 'ATGCCCGGG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 15 }  // Extends beyond 9-base sequence
            ];

            expect(() => {
                new Gene(sequence, exons);
            }).toThrow(InvalidSequenceError);
        });

        test('throws error with invalid exon coordinates', () => {
            const sequence = 'ATGCCCGGG';
            const exons: GenomicRegion[] = [
                { start: 5, end: 3 }  // start > end
            ];

            expect(() => {
                new Gene(sequence, exons);
            }).toThrow(InvalidSequenceError);
        });

        test('throws error with negative exon coordinates', () => {
            const sequence = 'ATGCCCGGG';
            const exons: GenomicRegion[] = [
                { start: -1, end: 3 }  // Negative start
            ];

            expect(() => {
                new Gene(sequence, exons);
            }).toThrow(InvalidSequenceError);
        });
    });

    describe('createGene static method', () => {
        test('returns success for valid gene', () => {
            const sequence = 'ATGCCCGGG';
            const exons: GenomicRegion[] = [{ start: 0, end: 9 }];
            const result = Gene.createGene(sequence, exons);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.getSequence()).toBe(sequence);
            }
        });

        test('returns failure for invalid exons', () => {
            const sequence = 'ATGCCCGGG';
            const exons: GenomicRegion[] = [];
            const result = Gene.createGene(sequence, exons);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('must have at least one exon');
            }
        });

        test('returns failure for invalid DNA sequence', () => {
            const sequence = 'ATXCCCGGG';  // Invalid character X
            const exons: GenomicRegion[] = [{ start: 0, end: 9 }];
            const result = Gene.createGene(sequence, exons);

            expect(result.success).toBe(false);
        });
    });

    describe('exon methods', () => {
        const sequence = 'ATGGTCCCAGTTTAAA';
        const exons: GenomicRegion[] = [
            { start: 0, end: 3, name: 'exon1' },
            { start: 11, end: 16, name: 'exon2' }
        ];
        let gene: Gene;

        beforeEach(() => {
            gene = new Gene(sequence, exons);
        });

        test('getExons returns immutable exon array', () => {
            const exonArray = gene.getExons();
            expect(exonArray).toHaveLength(2);
            expect(exonArray[0]).toEqual({ start: 0, end: 3, name: 'exon1' });
            expect(exonArray[1]).toEqual({ start: 11, end: 16, name: 'exon2' });

            // Verify immutability - attempting to modify should throw
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (exonArray as any).push({ start: 20, end: 25 });
            }).toThrow();
        });

        test('getExonSequence returns correct sequence', () => {
            expect(gene.getExonSequence(0)).toBe('ATG');
            expect(gene.getExonSequence(1)).toBe('TTAAA');  // 11-16 in ATGGTCCCAGTTTAAA
        });

        test('getExonSequence throws error for invalid index', () => {
            expect(() => gene.getExonSequence(-1)).toThrow('Exon index -1 out of bounds');
            expect(() => gene.getExonSequence(2)).toThrow('Exon index 2 out of bounds');
        });

        test('getMatureSequence concatenates exons', () => {
            expect(gene.getMatureSequence()).toBe('ATGTTAAA');  // ATG + TTAAA
        });
    });

    describe('intron methods', () => {
        const sequence = 'ATGGTCCCAGTTTAAACCCGGGAAATAG';
        const exons: GenomicRegion[] = [
            { start: 0, end: 3, name: 'exon1' },     // ATG
            { start: 11, end: 16, name: 'exon2' },   // TTTAA
            { start: 22, end: 28, name: 'exon3' }    // AATAG
        ];
        let gene: Gene;

        beforeEach(() => {
            gene = new Gene(sequence, exons);
        });

        test('getIntrons returns calculated introns', () => {
            const introns = gene.getIntrons();
            expect(introns).toHaveLength(2);
            expect(introns[0]).toEqual({ start: 3, end: 11, name: 'intron1' });
            expect(introns[1]).toEqual({ start: 16, end: 22, name: 'intron2' });
        });

        test('getIntronSequence returns correct sequence', () => {
            expect(gene.getIntronSequence(0)).toBe('GTCCCAGT');  // 3-11
            expect(gene.getIntronSequence(1)).toBe('CCCGGG');    // 16-22
        });

        test('getIntronSequence throws error for invalid index', () => {
            expect(() => gene.getIntronSequence(-1)).toThrow('Intron index -1 out of bounds');
            expect(() => gene.getIntronSequence(2)).toThrow('Intron index 2 out of bounds');
        });
    });

    describe('complex gene structures', () => {
        test('handles multiple non-adjacent exons correctly', () => {
            const sequence = 'ATGGTAAAGCCCAGTTTAAACCCGGGAAATAG';
            const exons: GenomicRegion[] = [
                { start: 0, end: 3 },    // ATG
                { start: 7, end: 12 },   // GCCCAG
                { start: 17, end: 22 },  // ACCCGG
                { start: 25, end: 32 }   // AATAG
            ];
            const gene = new Gene(sequence, exons);

            expect(gene.getExons()).toHaveLength(4);
            expect(gene.getIntrons()).toHaveLength(3);
            expect(gene.getMatureSequence()).toBe('ATGAGCCCAAACCGAAATAG');

            // Verify intron boundaries
            expect(gene.getIntrons()[0]).toEqual({ start: 3, end: 7, name: 'intron1' });
            expect(gene.getIntrons()[1]).toEqual({ start: 12, end: 17, name: 'intron2' });
            expect(gene.getIntrons()[2]).toEqual({ start: 22, end: 25, name: 'intron3' });
        });

        test('handles adjacent exons (no intron between them)', () => {
            const sequence = 'ATGCCCGGGAAATTT';
            const exons: GenomicRegion[] = [
                { start: 0, end: 6 },    // ATGCCC
                { start: 6, end: 9 },    // GGG (adjacent to first)
                { start: 12, end: 15 }   // TTT
            ];
            const gene = new Gene(sequence, exons);

            expect(gene.getExons()).toHaveLength(3);
            expect(gene.getIntrons()).toHaveLength(1);  // Only one gap
            expect(gene.getIntrons()[0]).toEqual({ start: 9, end: 12, name: 'intron1' });
            expect(gene.getMatureSequence()).toBe('ATGCCCGGGTTT');
        });
    });

    describe('edge cases', () => {
        test('single exon gene has no introns', () => {
            const sequence = 'ATGCCCGGGTTTAAATAG';
            const exons: GenomicRegion[] = [{ start: 0, end: 18 }];
            const gene = new Gene(sequence, exons);

            expect(gene.getExons()).toHaveLength(1);
            expect(gene.getIntrons()).toHaveLength(0);
            expect(gene.getMatureSequence()).toBe(sequence);
        });

        test('exons can be provided in any order', () => {
            const sequence = 'ATGGTCCCAGTTTAAA';
            const exons: GenomicRegion[] = [
                { start: 11, end: 16, name: 'exon2' },   // Second exon first
                { start: 0, end: 3, name: 'exon1' }      // First exon second
            ];
            const gene = new Gene(sequence, exons);

            expect(gene.getIntrons()[0]).toEqual({ start: 3, end: 11, name: 'intron1' });
            expect(gene.getMatureSequence()).toBe('ATGTTAAA');
        });

        test('minimal exon sizes', () => {
            const sequence = 'AGTCCCAGT';
            const exons: GenomicRegion[] = [
                { start: 0, end: 1 },    // Single nucleotide exon
                { start: 8, end: 9 }     // Single nucleotide exon
            ];
            const gene = new Gene(sequence, exons);

            expect(gene.getExonSequence(0)).toBe('A');
            expect(gene.getExonSequence(1)).toBe('T');
            expect(gene.getMatureSequence()).toBe('AT');
            expect(gene.getIntronSequence(0)).toBe('GTCCCAG');
        });
    });
});