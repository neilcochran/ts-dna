import { PreMRNA } from '../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import { MRNA } from '../../src/model/nucleic-acids/MRNA';
import {
    processRNA,
    RNAProcessingOptions,
    DEFAULT_RNA_PROCESSING_OPTIONS,
    convertProcessedRNAToMRNA
} from '../../src/utils/mrna-processing';
import { GenomicRegion } from '../../src/types/genomic-region';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('mrna-processing', () => {
    describe('processRNA', () => {
        test('processes simple two-exon gene to mature mRNA', () => {
            // Create gene with realistic structure: 5'UTR + coding + 3'UTR + polyadenylation signal
            // Fixed splice sites: GT...AG for proper splicing
            const geneSequence = 'GGGCCCATGAAAGTACGCCCAAGAGAGGGTAGATAAAAATAAA';
            const exons: GenomicRegion[] = [
                { start: 0, end: 12, name: 'exon1' },    // GGGCCCATGAAA (5'UTR + start of coding)
                { start: 27, end: 42, name: 'exon2' }    // GGTAGATAAAAATAA (rest of coding + 3'UTR + polyA signal)
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('GGGCCCAUGAAAGUACGCCCAAGAGAGGGUAGAUAAAAAUAAA', gene, 0);

            const result = processRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const mRNA = result.data;
                expect(mRNA).toBeInstanceOf(MRNA);
                expect(mRNA.hasFivePrimeCap()).toBe(true);
                expect(mRNA.getPolyATailLength()).toBe(200); // default poly-A tail length
                expect(mRNA.getCodingSequence()).toContain('AUG'); // should have start codon
                expect(mRNA.isFullyProcessed()).toBe(true);
            }
        });

        test('processes single exon gene', () => {
            const geneSequence = 'ATGAAACCCGGGTAA';
            const exons: GenomicRegion[] = [
                { start: 0, end: 15, name: 'exon1' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACCCGGGUAA', gene, 0);

            const result = processRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const mRNA = result.data;
                expect(mRNA.getCodingSequence()).toBe('AUGAAACCCGGGUAA'); // AUG to UAA
                expect(mRNA.hasFivePrimeCap()).toBe(true);
                expect(mRNA.getPolyATailLength()).toBe(200); // Should get default poly-A tail
            }
        });

        test('respects custom processing options', () => {
            const geneSequence = 'ATGAAACCCGGGTAA';
            const exons: GenomicRegion[] = [
                { start: 0, end: 15, name: 'exon1' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACCCGGGUAA', gene, 0);

            const options: RNAProcessingOptions = {
                addFivePrimeCap: false,
                addPolyATail: false,
                polyATailLength: 50
            };

            const result = processRNA(preMRNA, options);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const mRNA = result.data;
                expect(mRNA.hasFivePrimeCap()).toBe(false);
                expect(mRNA.getPolyATailLength()).toBe(0); // no poly-A tail added
                expect(mRNA.isFullyProcessed()).toBe(false); // missing cap and poly-A
            }
        });

        test('processes gene with polyadenylation signal', () => {
            // Include realistic polyadenylation signal (AATAAA in DNA, AAUAAA in RNA)
            const geneSequence = 'ATGAAACCCGGGTAAAATAAACCCC';
            const exons: GenomicRegion[] = [
                { start: 0, end: 24, name: 'exon1' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACCCGGGUAAAAUAAACCCC', gene, 0);

            const result = processRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const mRNA = result.data;
                // Should find polyadenylation signal and add poly-A tail
                expect(mRNA.getPolyATailLength()).toBe(200);
                expect(mRNA.hasFivePrimeCap()).toBe(true);
            }
        });

        test('fails when no start codon found', () => {
            const geneSequence = 'AAACCCGGGTAA'; // no ATG start codon
            const exons: GenomicRegion[] = [
                { start: 0, end: 12, name: 'exon1' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AAACCCGGGUAA', gene, 0);

            const result = processRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('No start codon');
            }
        });

        test('fails when no stop codon found', () => {
            const geneSequence = 'ATGAAACCCGGGAAA'; // no stop codon
            const exons: GenomicRegion[] = [
                { start: 0, end: 15, name: 'exon1' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACCCGGGAAA', gene, 0);

            const result = processRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('No in-frame stop codon');
            }
        });

        test('fails when splicing fails', () => {
            // Create gene with invalid splice sites
            const geneSequence = 'ATGAAACACGCCCAAATTCGGG';  // AC...AA instead of GT...AG
            const exons: GenomicRegion[] = [
                { start: 0, end: 6, name: 'exon1' },
                { start: 17, end: 22, name: 'exon2' }
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('AUGAAACACGCCCAAAUUCGGG', gene, 0);

            const result = processRNA(preMRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Splicing failed');
            }
        });
    });

    describe('DEFAULT_RNA_PROCESSING_OPTIONS', () => {
        test('has expected default values', () => {
            expect(DEFAULT_RNA_PROCESSING_OPTIONS.addFivePrimeCap).toBe(true);
            expect(DEFAULT_RNA_PROCESSING_OPTIONS.addPolyATail).toBe(true);
            expect(DEFAULT_RNA_PROCESSING_OPTIONS.polyATailLength).toBe(200);
            expect(DEFAULT_RNA_PROCESSING_OPTIONS.validateCodons).toBe(true);
            expect(DEFAULT_RNA_PROCESSING_OPTIONS.minimumCodingLength).toBe(true);
        });
    });

    describe('convertProcessedRNAToMRNA', () => {
        test('converts ProcessedRNA-like object to MRNA', () => {
            // Mock ProcessedRNA object structure
            const processedRNA = {
                getSequence: () => 'AUGAAACCCGGGUAA',
                polyATail: 'AAAAAAAAAA',
                hasFivePrimeCap: true,
                rnaSubType: 'M_RNA'
            };

            const result = convertProcessedRNAToMRNA(processedRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const mRNA = result.data;
                expect(mRNA).toBeInstanceOf(MRNA);
                expect(mRNA.getCodingSequence()).toBe('AUGAAACCCGGGUAA');
                expect(mRNA.hasFivePrimeCap()).toBe(true);
                expect(mRNA.getPolyATailLength()).toBe(10);
            }
        });

        test('handles ProcessedRNA without poly-A tail', () => {
            const processedRNA = {
                getSequence: () => 'AUGAAACCCGGGUAA',
                polyATail: '',
                hasFivePrimeCap: false
            };

            const result = convertProcessedRNAToMRNA(processedRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const mRNA = result.data;
                expect(mRNA.hasFivePrimeCap()).toBe(false);
                expect(mRNA.getPolyATailLength()).toBe(0);
            }
        });

        test('fails when no coding sequence found in ProcessedRNA', () => {
            const processedRNA = {
                getSequence: () => 'GGGCCCAAAUUU',  // no start codon
                polyATail: '',
                hasFivePrimeCap: false
            };

            const result = convertProcessedRNAToMRNA(processedRNA);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('No start codon');
            }
        });
    });

    describe('integration with complex gene structures', () => {
        test('processes multi-exon gene with realistic structure', () => {
            // Complex gene: 5'UTR + coding exons + 3'UTR with polyadenylation
            // Fixed splice sites: GT...AG for proper splicing
            const geneSequence = 'GGGCCCATGGTAAGTTTAGAGAGGGGTCGTCAGTAATAAAAA';
            const exons: GenomicRegion[] = [
                { start: 0, end: 9, name: 'exon1' },     // 5'UTR + start of coding
                { start: 19, end: 25, name: 'exon2' },   // middle coding
                { start: 33, end: 42, name: 'exon3' }    // end coding + 3'UTR + polyA signal
            ];

            const gene = new Gene(geneSequence, exons);
            const preMRNA = new PreMRNA('GGGCCCAUGGUAAGUUUAGAGAGGGGUCGUCAGUAAUAAAAA', gene, 0);

            const result = processRNA(preMRNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const mRNA = result.data;

                // Verify proper processing
                expect(mRNA.hasFivePrimeCap()).toBe(true);
                expect(mRNA.getPolyATailLength()).toBe(200);
                expect(mRNA.isFullyProcessed()).toBe(true);

                // Verify UTRs are properly identified
                expect(mRNA.getFivePrimeUTR()).toBe('GGGCCC');
                expect(mRNA.getCodingSequence()).toContain('AUG');
                expect(mRNA.getThreePrimeUTR().length).toBeGreaterThan(0);
            }
        });
    });
});