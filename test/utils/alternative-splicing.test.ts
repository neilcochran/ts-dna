import { Gene } from '../../src/model/nucleic-acids/Gene';
import { PreMRNA } from '../../src/model/nucleic-acids/PreMRNA';
import { MRNA } from '../../src/model/nucleic-acids/MRNA';
import {
  SpliceVariant,
  AlternativeSplicingProfile,
  SplicingOutcome,
  SpliceVariantPatterns,
} from '../../src/types/alternative-splicing';
import {
  spliceRNAWithVariant,
  processAllSplicingVariants,
  validateSpliceVariant,
  processDefaultSpliceVariant,
  findVariantsByPolypeptideLength,
} from '../../src/utils/alternative-splicing';
import { FOUR_EXON_GENE } from '../test-genes';

describe('Alternative Splicing Functions', () => {
  // Use realistic four-exon gene with proper intron sizes
  const testSequence = FOUR_EXON_GENE.dnaSequence;
  const testExons = FOUR_EXON_GENE.exons;

  describe('spliceRNAWithVariant', () => {
    test('processes simple exon skipping variant', () => {
      const gene = new Gene(testSequence, testExons, 'TEST_GENE');
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      const variant: SpliceVariant = {
        name: 'skip-exon2',
        includedExons: [0, 2, 3], // Skip exon 1 (index 1)
        description: 'Skips exon 2',
      };

      const result = spliceRNAWithVariant(preMRNA, variant);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should be: AUGAAA + GGGUUU + UAG = AUGAAAGGGUUUUAG
        expect(result.data.getSequence()).toBe('AUGAAAGGGUUUUAG');
        expect(result.data.nucleicAcidType.toString()).toBe('RNA');
      }
    });

    test('processes full-length variant', () => {
      const gene = new Gene(testSequence, testExons, 'TEST_GENE');
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      const variant: SpliceVariant = {
        name: 'full-length',
        includedExons: [0, 1, 2, 3],
        description: 'All exons included',
      };

      const result = spliceRNAWithVariant(preMRNA, variant);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGGGGGUUUUAG');
      }
    });

    test('fails with invalid exon index', () => {
      const gene = new Gene(testSequence, testExons, 'TEST_GENE');
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      const variant: SpliceVariant = {
        name: 'invalid',
        includedExons: [0, 1, 5], // Index 5 doesn't exist
        description: 'Invalid variant',
      };

      const result = spliceRNAWithVariant(preMRNA, variant);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('invalid exon index 5');
      }
    });

    test('validates reading frame when enabled', () => {
      const gene = new Gene(testSequence, testExons, 'TEST_GENE');
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      // This variant will break reading frame (6 + 6 + 6 = 18, which is divisible by 3)
      // But if we skip exon2 (6bp), we get 6 + 6 = 12bp, still divisible by 3
      const variant: SpliceVariant = {
        name: 'frame-breaking',
        includedExons: [0, 2], // ATGAAA + GGGTTT = 12bp = 4 codons
        description: 'Should maintain frame',
      };

      const result = spliceRNAWithVariant(preMRNA, variant, {
        validateReadingFrames: true,
        validateCodons: false,
        allowSkipLastExon: true,
      });

      expect(result.success).toBe(true);
    });

    test('handles exception during variant processing', () => {
      // Create a mock preMRNA that will cause an error during processing
      // Need to use a valid variant that passes validation but fails during processing
      const mockGene = {
        getExons: () => testExons,
        getVariantSequence: () => {
          throw new Error('Mock variant sequence error');
        },
      } as any;

      const mockPreMRNA = {
        getSourceGene: () => mockGene,
      } as any;

      const variant: SpliceVariant = {
        name: 'error-variant',
        includedExons: [0, 1, 2, 3], // Include all exons to pass validation
        description: 'Causes error during processing',
      };

      const result = spliceRNAWithVariant(mockPreMRNA, variant, {
        allowSkipLastExon: true,
        allowSkipFirstExon: true,
        validateReadingFrames: false, // Disable all validation to reach processing error
        validateCodons: false,
        requireMinimumExons: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to process splice variant');
        expect(result.error).toContain('Mock variant sequence error');
      }
    });
  });

  describe('processAllSplicingVariants', () => {
    test('processes all variants in splicing profile', () => {
      const splicingProfile: AlternativeSplicingProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'full-length',
        variants: [
          SpliceVariantPatterns.fullLength('full-length', 4),
          SpliceVariantPatterns.exonSkipping('skip-exon2', 4, [1]),
          SpliceVariantPatterns.truncation('short', 3), // Include first 3 exons to avoid skipping last
        ],
      };

      const gene = new Gene(testSequence, testExons, 'TEST_GENE', splicingProfile);
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      const result = processAllSplicingVariants(preMRNA, {
        allowSkipLastExon: true, // Allow truncation variants
        validateCodons: false, // Don't validate start/stop codons for test variants
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);

        const fullLength = result.data.find(o => o.getVariantName() === 'full-length');
        const skipExon2 = result.data.find(o => o.getVariantName() === 'skip-exon2');
        const short = result.data.find(o => o.getVariantName() === 'short');

        expect(fullLength).toBeDefined();
        expect(skipExon2).toBeDefined();
        expect(short).toBeDefined();

        if (fullLength && skipExon2 && short) {
          expect(fullLength.getMRNALength()).toBeGreaterThan(skipExon2.getMRNALength());
          expect(fullLength.getMRNALength()).toBeGreaterThan(short.getMRNALength());
          // short has more exons than skipExon2, so it should be longer
          expect(short.getMRNALength()).toBeGreaterThan(skipExon2.getMRNALength());
        }
      }
    });

    test('fails when gene has no splicing profile', () => {
      const gene = new Gene(testSequence, testExons, 'TEST_GENE'); // No splicing profile
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      const result = processAllSplicingVariants(preMRNA);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('does not have an alternative splicing profile');
      }
    });

    test('handles mixed success and failure variants with warning', () => {
      // Create a valid gene first
      const gene = new Gene(testSequence, testExons, 'TEST_GENE');
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      // Mock the processAllSplicingVariants to test the mixed success path
      // We'll override the gene's getSplicingProfile method to return a mock profile
      const mockProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'valid-variant',
        variants: [
          { name: 'valid-variant', includedExons: [0, 1, 2, 3], description: 'Valid variant' },
          { name: 'invalid-variant', includedExons: [0, 1, 99], description: 'Invalid variant' }, // This will cause validation to fail
        ],
      };

      // Override the preMRNA's getSourceGene to return a gene with our mock profile
      const mockGene = {
        ...gene,
        getSplicingProfile: () => mockProfile,
        getExons: () => testExons,
        getVariantSequence: (variant: any) => {
          if (variant.name === 'valid-variant') {
            return testSequence; // Valid sequence
          } else {
            throw new Error('Invalid variant sequence'); // This will cause the error
          }
        },
      } as any;

      const mockPreMRNA = {
        ...preMRNA,
        getSourceGene: () => mockGene,
      } as any;

      // Mock console.warn to test the warning path
      const originalWarn = console.warn;
      const mockWarn = jest.fn();
      console.warn = mockWarn;

      const result = processAllSplicingVariants(mockPreMRNA);

      expect(result.success).toBe(true); // Partial success
      if (result.success) {
        expect(result.data).toHaveLength(1); // Only valid variant processed
        expect(result.data[0].getVariantName()).toBe('valid-variant');
      }

      // Check that warning was called
      expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('Some splice variants failed'));

      // Restore console.warn
      console.warn = originalWarn;
    });

    test('fails when all variants fail', () => {
      // Create a valid gene first
      const gene = new Gene(testSequence, testExons, 'TEST_GENE');
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      // Mock profile with all invalid variants
      const mockProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'invalid1',
        variants: [
          { name: 'invalid1', includedExons: [0, 1], description: 'Invalid variant 1' },
          { name: 'invalid2', includedExons: [0, 1], description: 'Invalid variant 2' },
        ],
      };

      // Override gene to make all variants fail
      const mockGene = {
        ...gene,
        getSplicingProfile: () => mockProfile,
        getExons: () => testExons,
        getVariantSequence: () => {
          throw new Error('All variants fail');
        },
      } as any;

      const mockPreMRNA = {
        ...preMRNA,
        getSourceGene: () => mockGene,
      } as any;

      const result = processAllSplicingVariants(mockPreMRNA);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('All splice variants failed');
      }
    });
  });

  describe('validateSpliceVariant', () => {
    const gene = new Gene(testSequence, testExons, 'TEST_GENE');

    test('validates correct variant', () => {
      const variant: SpliceVariant = {
        name: 'valid',
        includedExons: [0, 1, 2, 3],
        description: 'Valid variant',
      };

      const result = validateSpliceVariant(variant, gene);
      expect(result.success).toBe(true);
    });

    test('fails validation for invalid exon index', () => {
      const variant: SpliceVariant = {
        name: 'invalid',
        includedExons: [0, 1, 10], // Index 10 doesn't exist
        description: 'Invalid variant',
      };

      const result = validateSpliceVariant(variant, gene);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('invalid exon index 10');
      }
    });

    test('validates minimum exon requirement', () => {
      const variant: SpliceVariant = {
        name: 'empty',
        includedExons: [],
        description: 'No exons',
      };

      const result = validateSpliceVariant(variant, gene, {
        requireMinimumExons: true,
        minimumExonCount: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('minimum required is 1');
      }
    });

    test('validates first exon requirement', () => {
      const variant: SpliceVariant = {
        name: 'no-first',
        includedExons: [1, 2, 3], // Missing first exon (index 0)
        description: 'No first exon',
      };

      const result = validateSpliceVariant(variant, gene, {
        allowSkipFirstExon: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('skips the first exon');
      }
    });

    test('validates last exon requirement', () => {
      const variant: SpliceVariant = {
        name: 'no-last',
        includedExons: [0, 1, 2], // Missing last exon (index 3)
        description: 'No last exon',
      };

      const result = validateSpliceVariant(variant, gene, {
        allowSkipLastExon: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('skips the last exon');
      }
    });

    test('validates reading frame', () => {
      // Create a variant that breaks reading frame
      // If we only include first exon (6bp), it's not divisible by 3
      const variant: SpliceVariant = {
        name: 'frame-breaking',
        includedExons: [0], // Only 6bp, which is divisible by 3
        description: 'Breaks reading frame',
      };

      const result = validateSpliceVariant(variant, gene, {
        validateReadingFrames: true,
        allowSkipLastExon: true,
        requireMinimumExons: true,
        minimumExonCount: 1,
        validateCodons: false, // Don't validate start/stop codons
      });

      expect(result.success).toBe(true); // 6bp is divisible by 3
    });

    test('fails reading frame validation with invalid sequence', () => {
      // Create a mock gene that will throw an error when getVariantSequence is called
      const mockGene = {
        getExons: () => testExons,
        getVariantSequence: () => {
          throw new Error('Mock getVariantSequence error');
        },
      } as any;

      const variant: SpliceVariant = {
        name: 'error-variant',
        includedExons: [0, 1],
        description: 'Causes error',
      };

      const result = validateSpliceVariant(variant, mockGene, {
        validateReadingFrames: true,
        allowSkipLastExon: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to validate reading frame');
        expect(result.error).toContain('Mock getVariantSequence error');
      }
    });

    test('fails codon validation with invalid sequence', () => {
      // Create a mock gene that will throw an error when getVariantSequence is called
      // but only when we're in the codon validation section, not reading frame
      let callCount = 0;
      const mockGene = {
        getExons: () => testExons,
        getVariantSequence: () => {
          callCount++;
          if (callCount === 1) {
            // First call is for reading frame validation - return valid sequence
            return 'ATGAAACCC'; // 9bp, divisible by 3
          } else {
            // Second call is for codon validation - throw error
            throw new Error('Mock codon validation error');
          }
        },
      } as any;

      const variant: SpliceVariant = {
        name: 'codon-error-variant',
        includedExons: [0, 1],
        description: 'Causes codon validation error',
      };

      const result = validateSpliceVariant(variant, mockGene, {
        validateReadingFrames: true,
        validateCodons: true,
        allowSkipLastExon: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to validate codons');
        expect(result.error).toContain('Mock codon validation error');
      }
    });

    test('validates start and stop codons correctly', () => {
      const variant: SpliceVariant = {
        name: 'valid-codons',
        includedExons: [0, 1, 2, 3], // Full sequence: ATGAAACCCGGGGGGTTTAG
        description: 'Valid start and stop codons',
      };

      const result = validateSpliceVariant(variant, gene, {
        validateCodons: true,
        allowSkipLastExon: false,
      });

      expect(result.success).toBe(true);
    });

    test('fails when variant does not start with start codon', () => {
      // Create variant that starts from exon 1 (not containing start codon)
      const variant: SpliceVariant = {
        name: 'no-start-codon',
        includedExons: [1, 2, 3], // Skip first exon with start codon
        description: 'Missing start codon',
      };

      const result = validateSpliceVariant(variant, gene, {
        validateCodons: true,
        allowSkipFirstExon: true, // Allow skipping first exon for this test
        allowSkipLastExon: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('does not start with start codon AUG');
      }
    });

    test('fails when variant does not end with stop codon', () => {
      // Use only first 3 exons, which won't have stop codon
      const variant: SpliceVariant = {
        name: 'no-stop-codon',
        includedExons: [0, 1, 2], // Doesn't include last exon with stop codon
        description: 'Missing stop codon',
      };

      const result = validateSpliceVariant(variant, gene, {
        validateCodons: true,
        allowSkipFirstExon: false,
        allowSkipLastExon: true, // Allow skipping last exon for this test
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('does not end with stop codon');
      }
    });
  });

  describe('processDefaultSpliceVariant', () => {
    test('processes default variant successfully', () => {
      const splicingProfile: AlternativeSplicingProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'full-length',
        variants: [
          SpliceVariantPatterns.fullLength('full-length', 4),
          SpliceVariantPatterns.exonSkipping('skip-exon2', 4, [1]),
        ],
      };

      const gene = new Gene(testSequence, testExons, 'TEST_GENE', splicingProfile);
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      const result = processDefaultSpliceVariant(preMRNA);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGGGGGUUUUAG');
      }
    });

    test('fails when no default variant exists', () => {
      const gene = new Gene(testSequence, testExons, 'TEST_GENE'); // No splicing profile
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      const result = processDefaultSpliceVariant(preMRNA);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('does not have a default splice variant');
      }
    });
  });

  describe('findVariantsByPolypeptideLength', () => {
    test('finds variants within polypeptide length range', () => {
      const splicingProfile: AlternativeSplicingProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'full-length',
        variants: [
          SpliceVariantPatterns.fullLength('full-length', 4), // 24bp = 8 amino acids
          SpliceVariantPatterns.exonSkipping('skip-exon2', 4, [1]), // 18bp = 6 amino acids
          SpliceVariantPatterns.exonSkipping('short', 4, [2]), // 18bp = 6 amino acids (skip middle exon)
        ],
      };

      const gene = new Gene(testSequence, testExons, 'TEST_GENE', splicingProfile);
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      // Look for variants producing 5-6 amino acids (excludes full-length with 7)
      const result = findVariantsByPolypeptideLength(preMRNA, 5, 6);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        const variantNames = result.data.map(outcome => outcome.getVariantName()).sort();
        expect(variantNames).toEqual(['short', 'skip-exon2']);
        // Both variants should have amino acid counts between 5-6
        expect(
          result.data.every(
            outcome => outcome.getAminoAcidCount() >= 5 && outcome.getAminoAcidCount() <= 6,
          ),
        ).toBe(true);
      }
    });

    test('returns empty array when no variants match length range', () => {
      const splicingProfile: AlternativeSplicingProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'short',
        variants: [
          SpliceVariantPatterns.minimal('short', [0, 3]), // Only first and last exon = 4 amino acids
        ],
      };

      const gene = new Gene(testSequence, testExons, 'TEST_GENE', splicingProfile);
      const preMRNA = new PreMRNA(testSequence.replace(/T/g, 'U'), gene, 0);

      // Look for variants producing 10-20 amino acids (none match)
      const result = findVariantsByPolypeptideLength(preMRNA, 10, 20, {
        allowSkipLastExon: true,
        validateCodons: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('SplicingOutcome class', () => {
    test('provides correct metadata about splice variant', () => {
      const variant: SpliceVariant = {
        name: 'test-variant',
        includedExons: [0, 2, 3],
        description: 'Test variant for metadata',
      };

      const sequence = 'AUGAAAGGGUUUAAAUAG';
      const codingSequence = 'AUGAAAGGGUUUAAAUAG';
      const polypeptideLength = 6;
      const mRNA = new MRNA(sequence, codingSequence, 0, sequence.length, true, '');

      const outcome = new SplicingOutcome(variant, mRNA, codingSequence, polypeptideLength);

      expect(outcome.getVariantName()).toBe('test-variant');
      expect(outcome.getVariantDescription()).toBe('Test variant for metadata');
      expect(outcome.getIncludedExons()).toEqual([0, 2, 3]);
      expect(outcome.getCodingSequenceLength()).toBe(18);
      expect(outcome.getMRNALength()).toBe(18);
      expect(outcome.getAminoAcidCount()).toBe(6);
      expect(outcome.hasValidReadingFrame()).toBe(true);
    });

    test('detects invalid reading frame', () => {
      const variant: SpliceVariant = {
        name: 'frame-breaking',
        includedExons: [0],
        description: 'Breaks reading frame',
      };

      // 7 nucleotides - not divisible by 3
      const sequence = 'AUGAAAG';
      const codingSequence = 'AUGAAAG';
      const polypeptideLength = 2;
      const mRNA = new MRNA(sequence, codingSequence, 0, sequence.length, true, '');

      const outcome = new SplicingOutcome(variant, mRNA, codingSequence, polypeptideLength);

      expect(outcome.hasValidReadingFrame()).toBe(false);
      expect(outcome.getAminoAcidCount()).toBe(2); // Floor of 7/3
    });
  });

  describe('Gene integration with alternative splicing', () => {
    test('gene validates splicing profile on construction', () => {
      const invalidProfile: AlternativeSplicingProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'nonexistent',
        variants: [{ name: 'valid', includedExons: [0, 1], description: 'Valid variant' }],
      };

      expect(() => {
        new Gene(testSequence, testExons, 'TEST_GENE', invalidProfile);
      }).toThrow("Default variant 'nonexistent' not found");
    });

    test('gene provides splice variant access methods', () => {
      const splicingProfile: AlternativeSplicingProfile = {
        geneId: 'TEST_GENE',
        defaultVariant: 'full-length',
        variants: [
          SpliceVariantPatterns.fullLength('full-length', 4),
          SpliceVariantPatterns.exonSkipping('skip-exon2', 4, [1]),
        ],
      };

      const gene = new Gene(testSequence, testExons, 'TEST_GENE', splicingProfile);

      expect(gene.getSplicingProfile()).toBeDefined();
      expect(gene.getSplicingVariants()).toHaveLength(2);
      expect(gene.getDefaultSplicingVariant()?.name).toBe('full-length');
      expect(gene.getSplicingVariantByName('skip-exon2')).toBeDefined();
      expect(gene.getSplicingVariantByName('nonexistent')).toBeUndefined();
    });

    test('gene generates correct variant sequences', () => {
      const gene = new Gene(testSequence, testExons, 'TEST_GENE');
      const variant: SpliceVariant = {
        name: 'test',
        includedExons: [0, 2, 3],
        description: 'Test variant',
      };

      const variantSequence = gene.getVariantSequence(variant);
      expect(variantSequence).toBe('ATGAAAGGGTTTTAG'); // exon1 + exon3 + exon4
    });
  });
});
