import { PreMRNA } from '../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import { MRNA } from '../../src/model/nucleic-acids/MRNA';
import {
  processRNA,
  RNAProcessingOptions,
  DEFAULT_RNA_PROCESSING_OPTIONS,
  convertProcessedRNAToMRNA,
} from '../../src/utils/mrna-processing';
import { DEFAULT_POLY_A_TAIL_LENGTH } from '../../src/constants/biological-constants';
import { GenomicRegion } from '../../src/types/genomic-region';
import { isSuccess, isFailure } from '../../src/types/validation-result';
import { SIMPLE_TWO_EXON_GENE, SINGLE_EXON_GENE, INVALID_SPLICE_GENE } from '../test-genes';

describe('mrna-processing', () => {
  describe('processRNA', () => {
    test('processes simple two-exon gene to mature mRNA', () => {
      const gene = new Gene(SIMPLE_TWO_EXON_GENE.dnaSequence, SIMPLE_TWO_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, gene, 0);

      const result = processRNA(preMRNA);

      if (isFailure(result)) {
        console.log('processRNA failed with error:', result.error);
      }
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        expect(mRNA).toBeInstanceOf(MRNA);
        expect(mRNA.hasFivePrimeCap()).toBe(true);
        expect(mRNA.getPolyATailLength()).toBe(DEFAULT_POLY_A_TAIL_LENGTH); // default poly-A tail length
        expect(mRNA.getCodingSequence()).toContain('AUG'); // should have start codon
        expect(mRNA.isFullyProcessed()).toBe(true);
      }
    });

    test('processes single exon gene', () => {
      const gene = new Gene(SINGLE_EXON_GENE.dnaSequence, SINGLE_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SINGLE_EXON_GENE.rnaSequence, gene, 0);

      const result = processRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        expect(mRNA.getCodingSequence()).toBe('AUGAAACCCGGGUAG'); // AUG to UAG (updated for stop codon)
        expect(mRNA.hasFivePrimeCap()).toBe(true);
        expect(mRNA.getPolyATailLength()).toBe(DEFAULT_POLY_A_TAIL_LENGTH); // Should get default poly-A tail
      }
    });

    test('respects custom processing options', () => {
      const geneSequence = 'ATGAAACCCGGGTAA';
      const exons: GenomicRegion[] = [{ start: 0, end: 15, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const preMRNA = new PreMRNA('AUGAAACCCGGGUAA', gene, 0);

      const options: RNAProcessingOptions = {
        addFivePrimeCap: false,
        addPolyATail: false,
        polyATailLength: 50,
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
      const exons: GenomicRegion[] = [{ start: 0, end: 24, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const preMRNA = new PreMRNA('AUGAAACCCGGGUAAAAUAAACCCC', gene, 0);

      const result = processRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        // Should find polyadenylation signal and add poly-A tail
        expect(mRNA.getPolyATailLength()).toBe(DEFAULT_POLY_A_TAIL_LENGTH);
        expect(mRNA.hasFivePrimeCap()).toBe(true);
      }
    });

    test('fails when no start codon found', () => {
      const geneSequence = 'AAACCCGGGTAA'; // no ATG start codon
      const exons: GenomicRegion[] = [{ start: 0, end: 12, name: 'exon1' }];

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
      const exons: GenomicRegion[] = [{ start: 0, end: 15, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const preMRNA = new PreMRNA('AUGAAACCCGGGAAA', gene, 0);

      const result = processRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('No in-frame stop codon');
      }
    });

    test('fails when splicing fails', () => {
      // Use gene with invalid splice sites but proper intron size
      const gene = new Gene(INVALID_SPLICE_GENE.dnaSequence, INVALID_SPLICE_GENE.exons);
      const preMRNA = new PreMRNA(INVALID_SPLICE_GENE.rnaSequence, gene, 0);

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
      expect(DEFAULT_RNA_PROCESSING_OPTIONS.polyATailLength).toBe(DEFAULT_POLY_A_TAIL_LENGTH);
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
        rnaSubType: 'M_RNA',
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
        hasFivePrimeCap: false,
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
        getSequence: () => 'GGGCCCAAAUUU', // no start codon
        polyATail: '',
        hasFivePrimeCap: false,
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
      // Use our realistic two-exon gene (simpler and more reliable)
      const gene = new Gene(SIMPLE_TWO_EXON_GENE.dnaSequence, SIMPLE_TWO_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, gene, 0);

      const result = processRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;

        // Verify proper processing
        expect(mRNA.hasFivePrimeCap()).toBe(true);
        expect(mRNA.getPolyATailLength()).toBe(DEFAULT_POLY_A_TAIL_LENGTH);
        expect(mRNA.isFullyProcessed()).toBe(true);

        // Verify UTRs are properly identified
        expect(mRNA.getFivePrimeUTR()).toBe(''); // No 5' UTR in SIMPLE_TWO_EXON_GENE
        expect(mRNA.getCodingSequence()).toContain('AUG');
        expect(mRNA.getCodingSequence()).toContain('UAG'); // Contains stop codon
        expect(mRNA.getThreePrimeUTR()).toBe('GG'); // 3' UTR after stop codon
      }
    });
  });
});
