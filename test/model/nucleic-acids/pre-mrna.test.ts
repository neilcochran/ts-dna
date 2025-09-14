import { PreMRNA } from '../../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../../src/model/nucleic-acids/Gene';
import { DNA } from '../../../src/model/nucleic-acids/DNA';
import { RNASubType } from '../../../src/enums/rna-sub-type';

describe('PreMRNA', () => {
    let testGene: Gene;
    let testDNA: DNA;

    beforeEach(() => {
        // Create a test gene with exons and introns
        // Sequence: ATGAAACCCAAATTTGGG (18 bp)
        // Exons: 0-6 (ATGAAA), 12-18 (TTTGGG)
        // Intron: 6-12 (CCCAAA)
        testDNA = new DNA('ATGAAACCCAAATTTGGG');
        testGene = new Gene(testDNA.getSequence(), [
            { start: 0, end: 6, name: 'exon1' },   // ATGAAA
            { start: 12, end: 18, name: 'exon2' }  // TTTGGG
        ]);
    });

    describe('constructor', () => {
        test('creates PreMRNA with basic information', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);

            expect(preMRNA.getSequence()).toBe('AUGAAACCCAAAUUUGGG');
            expect(preMRNA.rnaSubType).toBe(RNASubType.PRE_M_RNA);
            expect(preMRNA.getSourceGene()).toBe(testGene);
            expect(preMRNA.getTranscriptionStartSite()).toBe(0);
            expect(preMRNA.getPolyadenylationSite()).toBeUndefined();
        });

        test('creates PreMRNA with polyadenylation site', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0, 18);

            expect(preMRNA.getPolyadenylationSite()).toBe(18);
        });

        test('creates PreMRNA with different TSS', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 5);

            expect(preMRNA.getTranscriptionStartSite()).toBe(5);
        });
    });

    describe('getExonRegions', () => {
        test('returns exon regions in transcript coordinates', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);
            const exonRegions = preMRNA.getExonRegions();

            expect(exonRegions).toHaveLength(2);
            expect(exonRegions[0]).toEqual({ start: 0, end: 6, name: 'exon1' });
            expect(exonRegions[1]).toEqual({ start: 12, end: 18, name: 'exon2' });
        });

        test('adjusts coordinates when TSS is not at position 0', () => {
            // TSS at position 3, so exons shift left by 3
            const preMRNA = new PreMRNA('AAACCCAAAUUUGGG', testGene, 3);
            const exonRegions = preMRNA.getExonRegions();

            expect(exonRegions).toHaveLength(2);
            expect(exonRegions[0]).toEqual({ start: -3, end: 3, name: 'exon1' });
            expect(exonRegions[1]).toEqual({ start: 9, end: 15, name: 'exon2' });
        });

        test('filters out exons outside transcript bounds', () => {
            // TSS after first exon
            const preMRNA = new PreMRNA('CCCAAAUUUGGG', testGene, 6);
            const exonRegions = preMRNA.getExonRegions();

            expect(exonRegions).toHaveLength(1);
            expect(exonRegions[0]).toEqual({ start: 6, end: 12, name: 'exon2' });
        });
    });

    describe('getIntronRegions', () => {
        test('returns intron regions in transcript coordinates', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);
            const intronRegions = preMRNA.getIntronRegions();

            expect(intronRegions).toHaveLength(1);
            expect(intronRegions[0]).toEqual({ start: 6, end: 12, name: undefined });
        });

        test('adjusts intron coordinates for different TSS', () => {
            const preMRNA = new PreMRNA('AAACCCAAAUUUGGG', testGene, 3);
            const intronRegions = preMRNA.getIntronRegions();

            expect(intronRegions).toHaveLength(1);
            expect(intronRegions[0]).toEqual({ start: 3, end: 9, name: undefined });
        });
    });

    describe('getCodingSequence', () => {
        test('returns joined exon sequences', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);
            const codingSeq = preMRNA.getCodingSequence();

            expect(codingSeq).toBe('AUGAAAUUUGGG'); // AUGAAA + UUUGGG
        });

        test('handles partial exons correctly', () => {
            // Transcript starts within first exon
            const preMRNA = new PreMRNA('AAACCCAAAUUUGGG', testGene, 3);
            const codingSeq = preMRNA.getCodingSequence();

            // First exon becomes AAA (positions -3 to 3, but only 0-3 is in transcript)
            // Second exon is UUUGGG (positions 9-15)
            expect(codingSeq).toBe('AAAUUUGGG');
        });
    });

    describe('hasIntrons', () => {
        test('returns true when introns are present', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);
            expect(preMRNA.hasIntrons()).toBe(true);
        });

        test('returns false for single exon gene', () => {
            const singleExonGene = new Gene('ATGAAATTTGGG', [
                { start: 0, end: 12 }
            ]);
            const preMRNA = new PreMRNA('AUGAAAUUUGGG', singleExonGene, 0);
            expect(preMRNA.hasIntrons()).toBe(false);
        });
    });

    describe('getTotalIntronLength', () => {
        test('calculates total intron length', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);
            expect(preMRNA.getTotalIntronLength()).toBe(6); // CCCAAA
        });

        test('returns 0 for intronless gene', () => {
            const singleExonGene = new Gene('ATGAAATTTGGG', [
                { start: 0, end: 12 }
            ]);
            const preMRNA = new PreMRNA('AUGAAAUUUGGG', singleExonGene, 0);
            expect(preMRNA.getTotalIntronLength()).toBe(0);
        });
    });

    describe('getTotalExonLength', () => {
        test('calculates total exon length', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);
            expect(preMRNA.getTotalExonLength()).toBe(12); // 6 + 6
        });

        test('handles partial exons', () => {
            const preMRNA = new PreMRNA('AAACCCAAAUUUGGG', testGene, 3);
            const exonLength = preMRNA.getTotalExonLength();
            expect(exonLength).toBe(9); // 3 (partial first exon) + 6 (full second exon)
        });
    });

    describe('toString', () => {
        test('returns descriptive string representation', () => {
            const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', testGene, 0);
            const str = preMRNA.toString();

            expect(str).toBe('PreMRNA(18nt, 2 exons, 1 introns)');
        });

        test('handles different counts correctly', () => {
            const singleExonGene = new Gene('ATGAAATTTGGG', [
                { start: 0, end: 12 }
            ]);
            const preMRNA = new PreMRNA('AUGAAAUUUGGG', singleExonGene, 0);
            const str = preMRNA.toString();

            expect(str).toBe('PreMRNA(12nt, 1 exons, 0 introns)');
        });
    });

    describe('edge cases', () => {
        test('handles single exon gene (no introns)', () => {
            const singleExonGene = new Gene('ATGAAATTTGGG', [
                { start: 0, end: 12 }
            ]);
            const preMRNA = new PreMRNA('AUGAAAUUUGGG', singleExonGene, 0);

            expect(preMRNA.getExonRegions()).toHaveLength(1);
            expect(preMRNA.getIntronRegions()).toHaveLength(0);
            expect(preMRNA.getCodingSequence()).toBe('AUGAAAUUUGGG');
            expect(preMRNA.hasIntrons()).toBe(false);
        });

        test('handles TSS beyond gene end', () => {
            const preMRNA = new PreMRNA('UUU', testGene, 100);
            const exonRegions = preMRNA.getExonRegions();

            // All exons should be filtered out as they're before TSS
            expect(exonRegions).toHaveLength(0);
        });

        test('handles very long sequences', () => {
            const longSequence = 'A'.repeat(10000);
            const longGene = new Gene(longSequence, [
                { start: 0, end: 1000 },
                { start: 5000, end: 6000 }
            ]);
            const preMRNA = new PreMRNA(longSequence.replace(/T/g, 'U'), longGene, 0);

            expect(preMRNA.getTotalExonLength()).toBe(2000);
            expect(preMRNA.getTotalIntronLength()).toBe(4000);
            expect(preMRNA.hasIntrons()).toBe(true);
        });
    });
});