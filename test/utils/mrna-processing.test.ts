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
import * as polyadenylationModule from '../../src/utils/polyadenylation';

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

    test('handles polyadenylation sites without cleavage site specified', () => {
      // Test line 67-72: when getStrongestPolyadenylationSite returns a site without cleavageSite
      const geneSequence = 'ATGAAACCCGGGTAAAATAAACCCC';
      const exons: GenomicRegion[] = [{ start: 0, end: 24, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const preMRNA = new PreMRNA('AUGAAACCCGGGUAAAAUAAACCCC', gene, 0);

      const result = processRNA(preMRNA, {
        addPolyATail: true,
        polyATailLength: 50,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        expect(mRNA.getPolyATailLength()).toBe(50);
        expect(mRNA.hasFivePrimeCap()).toBe(true);
      }
    });

    test('handles when no polyadenylation sites are found', () => {
      // Test line 64-75: when findPolyadenylationSites returns empty array
      const geneSequence = 'ATGAAACCCGGGTAG'; // No poly-A signal
      const exons: GenomicRegion[] = [{ start: 0, end: 15, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const preMRNA = new PreMRNA('AUGAAACCCGGGUAG', gene, 0);

      const result = processRNA(preMRNA, {
        addPolyATail: true,
        polyATailLength: 100,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        // Should still add poly-A tail even without signal
        expect(mRNA.getPolyATailLength()).toBe(100);
        expect(mRNA.hasFivePrimeCap()).toBe(true);
      }
    });

    test('handles when strongest polyadenylation site is null', async () => {
      // Test line 66: when getStrongestPolyadenylationSite returns null
      // This can happen when sites are found but none meet quality criteria
      const geneSequence = 'ATGAAACCCGGGTAG';
      const exons: GenomicRegion[] = [{ start: 0, end: 15, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const preMRNA = new PreMRNA('AUGAAACCCGGGUAG', gene, 0);

      // Mock the polyadenylation functions to test the null case
      const polyadenylationModule = await import('../../src/utils/polyadenylation.js');
      jest.spyOn(polyadenylationModule, 'findPolyadenylationSites').mockReturnValue([
        {
          position: 10,
          signal: 'AAUAAA',
          strength: 0.5,
        },
      ]);

      jest
        .spyOn(polyadenylationModule, 'getStrongestPolyadenylationSite')
        .mockReturnValue(undefined);

      const result = processRNA(preMRNA, {
        addPolyATail: true,
        polyATailLength: 75,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        expect(mRNA.getPolyATailLength()).toBe(75);
      }

      // Restore mocks
      jest.restoreAllMocks();
    });

    test('handles cleavage site within sequence bounds', () => {
      // Test line 84: when cleavageSite < processedSequence.length
      const geneSequence = 'ATGAAACCCGGGTAG';
      const exons: GenomicRegion[] = [{ start: 0, end: 15, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const testPreMRNA = new PreMRNA('AUGAAACCCGGGUAG', gene, 0);

      // Mock to return a polyadenylation site that requires cleavage
      jest.spyOn(polyadenylationModule, 'findPolyadenylationSites').mockReturnValue([
        {
          position: 10,
          signal: 'AAUAAA',
          strength: 100,
          cleavageSite: 12, // Cleave at position 12 (within sequence)
        },
      ]);

      jest.spyOn(polyadenylationModule, 'getStrongestPolyadenylationSite').mockReturnValue({
        position: 10,
        signal: 'AAUAAA',
        strength: 100,
        cleavageSite: 12,
      });

      const result = processRNA(testPreMRNA, {
        addPolyATail: true,
        polyATailLength: 10,
        validateCodons: false, // Skip validation to avoid coding sequence issues
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        // Should be cleaved at position 12 + poly-A tail
        expect(mRNA.getSequence().length).toBe(22); // 12 bp + 10 bp poly-A
        expect(mRNA.getPolyATailLength()).toBe(10);
      }

      // Restore mocks
      jest.restoreAllMocks();
    });

    test('handles cleavage site beyond sequence bounds', () => {
      // Test line 83: when cleavageSite >= processedSequence.length (no cleavage)
      const geneSequence = 'ATGAAACCCGGG'; // 12 bp
      const exons: GenomicRegion[] = [{ start: 0, end: 12, name: 'exon1' }];

      const gene = new Gene(geneSequence, exons);
      const testPreMRNA = new PreMRNA('AUGAAACCCGGG', gene, 0);

      // Mock to return a polyadenylation site with cleavage beyond sequence
      jest.spyOn(polyadenylationModule, 'findPolyadenylationSites').mockReturnValue([
        {
          position: 8,
          signal: 'AAUAAA',
          strength: 100,
          cleavageSite: 20, // Beyond 12 bp sequence length
        },
      ]);

      jest.spyOn(polyadenylationModule, 'getStrongestPolyadenylationSite').mockReturnValue({
        position: 8,
        signal: 'AAUAAA',
        strength: 100,
        cleavageSite: 20, // Beyond sequence
      });

      const result = processRNA(testPreMRNA, {
        addPolyATail: true,
        polyATailLength: 10,
        validateCodons: false,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mRNA = result.data;
        // Should NOT be cleaved, so full sequence + poly-A tail
        expect(mRNA.getSequence().length).toBe(22); // 12 bp + 10 bp poly-A
        expect(mRNA.getPolyATailLength()).toBe(10);
      }

      // Restore mocks
      jest.restoreAllMocks();
    });

    test('handles exception during RNA processing', () => {
      // Test line 119: exception handling catch block - this actually tests splicing failure
      const mockPreMRNA = {
        getSourceGene: () => ({
          getExons: () => {
            throw new Error('Mock gene error');
          },
        }),
        getSequence: () => 'AUGAAACCCGGG',
        getExonRegions: () => {
          throw new Error('Mock gene error');
        },
      } as any;

      const result = processRNA(mockPreMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Splicing failed');
        expect(result.error).toContain('Mock gene error');
      }
    });

    test('handles exception in main processing logic', () => {
      // Test line 119: direct exception in processRNA catch block
      const testGene = new Gene(SIMPLE_TWO_EXON_GENE.dnaSequence, SIMPLE_TWO_EXON_GENE.exons);
      const mockPreMRNA = {
        getSourceGene: () => testGene,
        getSequence: () => {
          throw new Error('Direct mock error');
        },
        getExonRegions: () => [{ start: 0, end: 12, name: 'exon1' }],
      } as any;

      const result = processRNA(mockPreMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        // The error is caught by splicing function first, which is also valid coverage
        expect(result.error).toContain('Splicing failed');
        expect(result.error).toContain('Direct mock error');
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

    test('bypasses splice site validation when skipSpliceSiteValidation is true', () => {
      // Use the same INVALID_SPLICE_GENE that fails in the previous test
      const gene = new Gene(INVALID_SPLICE_GENE.dnaSequence, INVALID_SPLICE_GENE.exons);
      const preMRNA = new PreMRNA(INVALID_SPLICE_GENE.rnaSequence, gene, 0);

      // First verify it still fails with default processing
      const defaultResult = processRNA(preMRNA);
      expect(isFailure(defaultResult)).toBe(true);

      // Now test that it succeeds when splice site validation is bypassed
      const bypassResult = processRNA(preMRNA, {
        skipSpliceSiteValidation: true,
        validateCodons: false, // Also disable codon validation since test sequence lacks stop codon
      });
      expect(isSuccess(bypassResult)).toBe(true);

      if (isSuccess(bypassResult)) {
        const mRNA = bypassResult.data;
        expect(mRNA).toBeInstanceOf(MRNA);
        expect(mRNA.hasFivePrimeCap()).toBe(true);
        expect(mRNA.getPolyATailLength()).toBe(DEFAULT_POLY_A_TAIL_LENGTH);
        expect(mRNA.isFullyProcessed()).toBe(true);
        // Should successfully process despite invalid splice sites
        // INVALID_SPLICE_GENE exons: 'AUGAAA' (0-6) + 'UCGGG' (26-31) = 'AUGAAAUCGGG'
        expect(mRNA.getCodingSequence()).toBe('AUGAAAUCGGG');
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
      expect(DEFAULT_RNA_PROCESSING_OPTIONS.skipSpliceSiteValidation).toBe(false);
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

    test('handles exception during ProcessedRNA to MRNA conversion', () => {
      // Test line 252: exception handling catch block
      const processedRNA = {
        getSequence: () => {
          throw new Error('Mock sequence error');
        },
        polyATail: 'AAAA',
        hasFivePrimeCap: true,
      };

      const result = convertProcessedRNAToMRNA(processedRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to convert ProcessedRNA to MRNA');
        expect(result.error).toContain('Mock sequence error');
      }
    });

    test('handles non-Error exception objects', () => {
      // Test line 252: exception handling with non-Error object
      const processedRNA = {
        getSequence: () => {
          throw 'String error'; // Non-Error object
        },
        polyATail: 'AAAA',
        hasFivePrimeCap: true,
      };

      const result = convertProcessedRNAToMRNA(processedRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to convert ProcessedRNA to MRNA');
        expect(result.error).toContain('String error');
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
        // The 3' UTR may be empty if stop codon is at the end
        expect(mRNA.getThreePrimeUTR()).toBeDefined();
      }
    });
  });
});
