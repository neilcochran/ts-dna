import {
  // Codon and genetic code constants
  CODON_LENGTH,
  MIN_CODON_LENGTH,

  // Gene structure constraints
  MIN_EXON_SIZE,
  MAX_EXON_SIZE,
  MIN_INTRON_SIZE,
  MAX_INTRON_SIZE,
  DEFAULT_MAX_INTRON_SEARCH,

  // RNA processing constants
  DEFAULT_POLY_A_TAIL_LENGTH,
  MIN_POLY_A_DETECTION_LENGTH,

  // Polyadenylation signals
  POLYA_SIGNALS,
  DEFAULT_POLYA_SIGNAL_STRENGTH,
  MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH,

  // Splice site sequences
  DONOR_SPLICE_CONSENSUS,
  ACCEPTOR_SPLICE_CONSENSUS,
  MIN_INTRON_LENGTH_FOR_SPLICING,

  // Promoter element positioning
  TATA_BOX_TYPICAL_POSITION,
  DPE_TYPICAL_POSITION,
  MAX_PROMOTER_SEARCH_DISTANCE,

  // Quality scoring constants
  BASE_POLYA_SCORE,
  HIGH_U_CONTENT_THRESHOLD,
  MODERATE_U_CONTENT_THRESHOLD,
  USE_ELEMENT_MAX_BOOST,
  DSE_ELEMENT_MAX_BOOST,
  MIN_POLYA_SITE_STRENGTH,
} from '../../src/constants/biological-constants';

/**
 * Tests that validate biological constants against known scientific literature.
 * These tests ensure our constants accurately reflect biological reality.
 *
 * References:
 * - Alberts et al. "Molecular Biology of the Cell" 6th edition
 * - Lodish et al. "Molecular Cell Biology" 8th edition
 * - NCBI Gene database statistics
 * - Various research papers cited in individual tests
 */
describe('Biological Constants Validation', () => {
  describe('Codon and Genetic Code Constants', () => {
    test('CODON_LENGTH should be 3 nucleotides', () => {
      // The genetic code is universally based on triplet codons
      // Reference: Crick et al. (1961) Nature, "General nature of the genetic code for proteins"
      expect(CODON_LENGTH).toBe(3);
      expect(MIN_CODON_LENGTH).toBe(3);
    });
  });

  describe('Gene Structure Constraints', () => {
    test('MIN_EXON_SIZE should allow single codon exons', () => {
      // Minimum meaningful coding exon is 1 codon (3 base pairs)
      // Reference: Sakharkar et al. (2004) In Silico Biology, "Distributions of exons and introns in the human genome"
      expect(MIN_EXON_SIZE).toBe(3);
    });

    test('MAX_EXON_SIZE should be realistic for human genes', () => {
      // Largest known human exon is ~17kb in the CFTR gene, but 50kb is a reasonable upper limit
      // Reference: Venter et al. (2001) Science, "The sequence of the human genome"
      expect(MAX_EXON_SIZE).toBe(50000);
      expect(MAX_EXON_SIZE).toBeGreaterThan(17000); // Larger than known largest exon
    });

    test('MIN_INTRON_SIZE should allow splicing machinery recognition', () => {
      // Minimum intron size for efficient splicing is ~20-25 bp
      // Reference: Talerico & Berget (1994) Mol Cell Biol, "Intron definition in splicing of small Drosophila introns"
      expect(MIN_INTRON_SIZE).toBe(20);
      expect(MIN_INTRON_SIZE).toBeGreaterThanOrEqual(20);
    });

    test('MAX_INTRON_SIZE should be reasonable for memory constraints', () => {
      // Some human introns exceed 1Mb (e.g., DMD gene has 2.2Mb intron)
      // But 1Mb is reasonable for typical processing
      // Reference: Tennyson et al. (1995) Genomics, "The human dystrophin gene requires 16 hours to be transcribed"
      expect(MAX_INTRON_SIZE).toBe(1000000);
    });

    test('DEFAULT_MAX_INTRON_SEARCH should be practical for splice site detection', () => {
      // 10kb covers ~90% of human introns while keeping search efficient
      // Reference: Sakharkar et al. (2004) In Silico Biology
      expect(DEFAULT_MAX_INTRON_SEARCH).toBe(10000);
      expect(DEFAULT_MAX_INTRON_SEARCH).toBeLessThan(MAX_INTRON_SIZE);
    });

    test('MIN_INTRON_LENGTH_FOR_SPLICING should match splice site requirements', () => {
      // Need at least 4 bp for GT...AG recognition
      expect(MIN_INTRON_LENGTH_FOR_SPLICING).toBe(4);
      expect(MIN_INTRON_LENGTH_FOR_SPLICING).toBeLessThanOrEqual(MIN_INTRON_SIZE);
    });
  });

  describe('RNA Processing Constants', () => {
    test('DEFAULT_POLY_A_TAIL_LENGTH should match mammalian mRNA', () => {
      // Mammalian mRNA poly-A tails are typically 200-250 adenines
      // Reference: Weill et al. (2012) Genome Research, "Translational control by changes in poly(A) tail length"
      expect(DEFAULT_POLY_A_TAIL_LENGTH).toBe(200);
      expect(DEFAULT_POLY_A_TAIL_LENGTH).toBeGreaterThanOrEqual(150);
      expect(DEFAULT_POLY_A_TAIL_LENGTH).toBeLessThanOrEqual(300);
    });

    test('MIN_POLY_A_DETECTION_LENGTH should distinguish from random A-runs', () => {
      // Need at least 10 consecutive A's to confidently identify poly-A tail
      expect(MIN_POLY_A_DETECTION_LENGTH).toBe(10);
    });

    test('MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH should be reasonable', () => {
      // Need enough sequence to find signal and context elements
      expect(MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH).toBe(20);
      expect(MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Polyadenylation Signal Strengths', () => {
    test('AAUAAA should be the strongest canonical signal', () => {
      // AAUAAA is the canonical polyadenylation signal, found in ~60% of sites
      // Reference: Beaudoing et al. (2000) Genome Research, "Patterns of variant polyadenylation signal usage"
      expect(POLYA_SIGNALS.AAUAAA).toBe(100);

      // Should be stronger than any variant
      Object.entries(POLYA_SIGNALS).forEach(([signal, strength]) => {
        if (signal !== 'AAUAAA') {
          expect(strength).toBeLessThan(POLYA_SIGNALS.AAUAAA);
        }
      });
    });

    test('AUUAAA should be the strongest variant', () => {
      // AUUAAA is the most common variant, ~15% of sites, ~80% efficiency of AAUAAA
      // Reference: Tian et al. (2005) Nucleic Acids Research, "A large-scale analysis of mRNA polyadenylation"
      expect(POLYA_SIGNALS.AUUAAA).toBe(80);

      // Should be stronger than other variants (except AAUAAA)
      const otherSignals = Object.entries(POLYA_SIGNALS).filter(
        ([signal]) => signal !== 'AAUAAA' && signal !== 'AUUAAA',
      );
      otherSignals.forEach(([_signal, strength]) => {
        expect(strength).toBeLessThan(POLYA_SIGNALS.AUUAAA);
      });
    });

    test('signal strengths should be biologically ordered', () => {
      // Based on experimental efficiency data from literature
      expect(POLYA_SIGNALS.AAUAAA).toBeGreaterThan(POLYA_SIGNALS.AUUAAA);
      expect(POLYA_SIGNALS.AUUAAA).toBeGreaterThan(POLYA_SIGNALS.AGUAAA);
      expect(POLYA_SIGNALS.AGUAAA).toBeGreaterThan(POLYA_SIGNALS.AAUAUA);
    });

    test('DEFAULT_POLYA_SIGNAL_STRENGTH should be reasonable for unknown signals', () => {
      // Unknown signals should have low but non-zero strength
      expect(DEFAULT_POLYA_SIGNAL_STRENGTH).toBe(8);
      expect(DEFAULT_POLYA_SIGNAL_STRENGTH).toBeLessThan(Math.min(...Object.values(POLYA_SIGNALS)));
    });

    test('MIN_POLYA_SITE_STRENGTH should filter weak sites', () => {
      // Should be set to exclude sites with poor signal combinations
      expect(MIN_POLYA_SITE_STRENGTH).toBe(25);
      expect(MIN_POLYA_SITE_STRENGTH).toBeGreaterThan(DEFAULT_POLYA_SIGNAL_STRENGTH);
    });
  });

  describe('Splice Site Consensus Sequences', () => {
    test('donor splice consensus should be GT', () => {
      // GT dinucleotide at 5' splice site is found in >99% of human introns
      // Reference: Sheth et al. (2006) Science, "Comprehensive splice-site analysis using comparative genomics"
      expect(DONOR_SPLICE_CONSENSUS).toBe('GT');
    });

    test('acceptor splice consensus should be AG', () => {
      // AG dinucleotide at 3' splice site is found in >99% of human introns
      expect(ACCEPTOR_SPLICE_CONSENSUS).toBe('AG');
    });

    test('splice consensuses should be dinucleotides', () => {
      // Both splice sites are dinucleotide sequences
      expect(DONOR_SPLICE_CONSENSUS).toHaveLength(2);
      expect(ACCEPTOR_SPLICE_CONSENSUS).toHaveLength(2);
    });
  });

  describe('Promoter Element Positioning', () => {
    test('TATA_BOX_TYPICAL_POSITION should match known positioning', () => {
      // TATA box typically located 25-30bp upstream of TSS
      // Reference: Sandelin et al. (2007) Nature Reviews Genetics, "Mammalian RNA polymerase II core promoters"
      expect(TATA_BOX_TYPICAL_POSITION).toBe(-25);
      expect(TATA_BOX_TYPICAL_POSITION).toBeGreaterThanOrEqual(-35);
      expect(TATA_BOX_TYPICAL_POSITION).toBeLessThanOrEqual(-20);
    });

    test('DPE_TYPICAL_POSITION should match known positioning', () => {
      // DPE (Downstream Promoter Element) typically at +28-32 relative to TSS
      // Reference: Burke & Kadonaga (1997) Genes & Development, "The downstream core promoter element"
      expect(DPE_TYPICAL_POSITION).toBe(30);
      expect(DPE_TYPICAL_POSITION).toBeGreaterThanOrEqual(25);
      expect(DPE_TYPICAL_POSITION).toBeLessThanOrEqual(35);
    });

    test('MAX_PROMOTER_SEARCH_DISTANCE should cover core and proximal elements', () => {
      // Should cover TATA box (-30), CAAT box (-80), and other proximal elements
      // Reference: Maston et al. (2006) Annual Review of Genomics and Human Genetics
      expect(MAX_PROMOTER_SEARCH_DISTANCE).toBe(200);
      expect(MAX_PROMOTER_SEARCH_DISTANCE).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Quality Scoring Constants', () => {
    test('scoring thresholds should be between 0 and 1', () => {
      // Quality scores are normalized between 0 and 1
      expect(BASE_POLYA_SCORE).toBe(0.3);

      expect(HIGH_U_CONTENT_THRESHOLD).toBeGreaterThan(0.5);
      expect(HIGH_U_CONTENT_THRESHOLD).toBeLessThan(1);
      expect(MODERATE_U_CONTENT_THRESHOLD).toBeGreaterThan(0.5);
      expect(MODERATE_U_CONTENT_THRESHOLD).toBeLessThan(HIGH_U_CONTENT_THRESHOLD);
    });

    test('boost values should be reasonable multipliers', () => {
      // USE and DSE elements provide additive boosts based on experimental data
      // Reference: Chen et al. (1995) EMBO Journal, "Sequence requirements for intronic polyadenylation elements"
      expect(USE_ELEMENT_MAX_BOOST).toBe(30);
      expect(DSE_ELEMENT_MAX_BOOST).toBe(20);

      expect(USE_ELEMENT_MAX_BOOST).toBeGreaterThan(DSE_ELEMENT_MAX_BOOST);
    });
  });

  describe('Cross-Constant Relationships', () => {
    test('minimum sizes should be smaller than maximum sizes', () => {
      expect(MIN_EXON_SIZE).toBeLessThan(MAX_EXON_SIZE);
      expect(MIN_INTRON_SIZE).toBeLessThan(MAX_INTRON_SIZE);
      expect(MIN_INTRON_LENGTH_FOR_SPLICING).toBeLessThanOrEqual(MIN_INTRON_SIZE);
    });

    test('search distances should be practical', () => {
      expect(DEFAULT_MAX_INTRON_SEARCH).toBeLessThan(MAX_INTRON_SIZE);
      expect(MAX_PROMOTER_SEARCH_DISTANCE).toBeGreaterThan(Math.abs(TATA_BOX_TYPICAL_POSITION));
    });

    test('polyadenylation constants should be consistent', () => {
      expect(MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH).toBeGreaterThan(MIN_POLY_A_DETECTION_LENGTH);
      expect(MIN_POLYA_SITE_STRENGTH).toBeGreaterThan(DEFAULT_POLYA_SIGNAL_STRENGTH);
    });
  });

  describe('Biological Reality Checks', () => {
    test('constants should reflect universal genetic code', () => {
      // The genetic code is universal across all life forms
      expect(CODON_LENGTH).toBe(3); // Triplet nature is fundamental
    });

    test('constants should be suitable for human genomics', () => {
      // Our constraints should handle the range found in human genes
      expect(MAX_EXON_SIZE).toBeGreaterThan(10000); // Covers large exons
      expect(MIN_EXON_SIZE).toEqual(CODON_LENGTH); // Minimum coding unit
      expect(DEFAULT_POLY_A_TAIL_LENGTH).toBeGreaterThan(100); // Mammalian standard
    });

    test('splice site consensus should reflect spliceosome specificity', () => {
      // GT-AG is the U2-type spliceosome consensus (>99% of introns)
      expect(DONOR_SPLICE_CONSENSUS + ACCEPTOR_SPLICE_CONSENSUS).toBe('GTAG');
    });

    test('polyadenylation signals should reflect CPSF recognition', () => {
      // AAUAAA is recognized by Cleavage and Polyadenylation Specificity Factor
      expect(POLYA_SIGNALS).toHaveProperty('AAUAAA');
      expect(POLYA_SIGNALS.AAUAAA).toBeGreaterThan(POLYA_SIGNALS.AUUAAA);
    });
  });
});
