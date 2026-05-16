import {
  DEFAULT_POLY_A_TAIL_LENGTH,
  MIN_POLY_A_DETECTION_LENGTH,
  MAX_POLY_A_TAIL_LENGTH,
  POLYA_SIGNALS,
  DEFAULT_POLYA_SIGNAL_STRENGTH,
  MIN_INTRON_LENGTH_FOR_SPLICING,
  MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH,
  USE_ELEMENT_MAX_BOOST,
  DSE_ELEMENT_MAX_BOOST,
  MIN_POLYA_SITE_STRENGTH,
  POLYA_SIGNAL_OFFSET,
  CANONICAL_POLYA_SIGNAL_DNA,
  DNA_DONOR_SPLICE_CONSENSUS,
  DNA_ACCEPTOR_SPLICE_CONSENSUS,
} from '../../src/processing';
import { MIN_INTRON_SIZE } from '../../src/gene';

/**
 * Validates RNA-processing biological constants against known scientific literature.
 *
 * References:
 * - Weill et al. (2012) Genome Research, "Translational control by changes in poly(A) tail length"
 * - Beaudoing et al. (2000) Genome Research, "Patterns of variant polyadenylation signal usage"
 * - Tian et al. (2005) Nucleic Acids Research, "A large-scale analysis of mRNA polyadenylation"
 * - Sheth et al. (2006) Science, "Comprehensive splice-site analysis using comparative genomics"
 * - Chen et al. (1995) EMBO Journal, "Sequence requirements for intronic polyadenylation elements"
 */
describe('Processing biological constants', () => {
  describe('Poly-A tail behaviour', () => {
    test('DEFAULT_POLY_A_TAIL_LENGTH matches mammalian mRNA', () => {
      expect(DEFAULT_POLY_A_TAIL_LENGTH).toBe(200);
      expect(DEFAULT_POLY_A_TAIL_LENGTH).toBeGreaterThanOrEqual(150);
      expect(DEFAULT_POLY_A_TAIL_LENGTH).toBeLessThanOrEqual(300);
    });

    test('MIN_POLY_A_DETECTION_LENGTH distinguishes from random A-runs', () => {
      expect(MIN_POLY_A_DETECTION_LENGTH).toBe(10);
    });

    test('MAX_POLY_A_TAIL_LENGTH is bounded', () => {
      expect(MAX_POLY_A_TAIL_LENGTH).toBe(1000);
      expect(MAX_POLY_A_TAIL_LENGTH).toBeGreaterThan(DEFAULT_POLY_A_TAIL_LENGTH);
    });

    test('MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH is reasonable', () => {
      expect(MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH).toBe(20);
      expect(MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH).toBeGreaterThanOrEqual(15);
      expect(MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH).toBeGreaterThan(MIN_POLY_A_DETECTION_LENGTH);
    });
  });

  describe('Polyadenylation signal strengths', () => {
    test('AAUAAA is the strongest canonical signal', () => {
      expect(POLYA_SIGNALS.AAUAAA).toBe(100);
      Object.entries(POLYA_SIGNALS).forEach(([signal, strength]) => {
        if (signal !== 'AAUAAA') {
          expect(strength).toBeLessThan(POLYA_SIGNALS.AAUAAA);
        }
      });
    });

    test('AUUAAA is the strongest variant', () => {
      expect(POLYA_SIGNALS.AUUAAA).toBe(80);
      const otherSignals = Object.entries(POLYA_SIGNALS).filter(
        ([signal]) => signal !== 'AAUAAA' && signal !== 'AUUAAA',
      );
      otherSignals.forEach(([, strength]) => {
        expect(strength).toBeLessThan(POLYA_SIGNALS.AUUAAA);
      });
    });

    test('signal strengths are biologically ordered', () => {
      expect(POLYA_SIGNALS.AAUAAA).toBeGreaterThan(POLYA_SIGNALS.AUUAAA);
      expect(POLYA_SIGNALS.AUUAAA).toBeGreaterThan(POLYA_SIGNALS.AGUAAA);
      expect(POLYA_SIGNALS.AGUAAA).toBeGreaterThan(POLYA_SIGNALS.AAUAUA);
    });

    test('DEFAULT_POLYA_SIGNAL_STRENGTH is reasonable for unknown signals', () => {
      expect(DEFAULT_POLYA_SIGNAL_STRENGTH).toBe(8);
      expect(DEFAULT_POLYA_SIGNAL_STRENGTH).toBeLessThan(Math.min(...Object.values(POLYA_SIGNALS)));
    });

    test('MIN_POLYA_SITE_STRENGTH filters weak sites', () => {
      expect(MIN_POLYA_SITE_STRENGTH).toBe(25);
      expect(MIN_POLYA_SITE_STRENGTH).toBeGreaterThan(DEFAULT_POLYA_SIGNAL_STRENGTH);
    });

    test('CANONICAL_POLYA_SIGNAL_DNA transcribes to AAUAAA', () => {
      expect(CANONICAL_POLYA_SIGNAL_DNA).toBe('AATAAA');
      expect(CANONICAL_POLYA_SIGNAL_DNA.replace(/T/g, 'U')).toBe('AAUAAA');
    });

    test('POLYA_SIGNAL_OFFSET is the typical cleavage offset', () => {
      expect(POLYA_SIGNAL_OFFSET).toBe(6);
      expect(POLYA_SIGNAL_OFFSET).toBeGreaterThan(0);
    });
  });

  describe('Splice site consensus', () => {
    test('donor consensus is GT', () => {
      expect(DNA_DONOR_SPLICE_CONSENSUS).toBe('GT');
    });

    test('acceptor consensus is AG', () => {
      expect(DNA_ACCEPTOR_SPLICE_CONSENSUS).toBe('AG');
    });

    test('consensuses are dinucleotides', () => {
      expect(DNA_DONOR_SPLICE_CONSENSUS).toHaveLength(2);
      expect(DNA_ACCEPTOR_SPLICE_CONSENSUS).toHaveLength(2);
    });

    test('combined GT-AG consensus reflects U2 spliceosome', () => {
      expect(DNA_DONOR_SPLICE_CONSENSUS + DNA_ACCEPTOR_SPLICE_CONSENSUS).toBe('GTAG');
    });

    test('MIN_INTRON_LENGTH_FOR_SPLICING permits GT-AG recognition', () => {
      expect(MIN_INTRON_LENGTH_FOR_SPLICING).toBe(4);
      expect(MIN_INTRON_LENGTH_FOR_SPLICING).toBeLessThanOrEqual(MIN_INTRON_SIZE);
    });
  });

  describe('Regulatory-element boosts', () => {
    test('USE / DSE boosts are reasonable multipliers', () => {
      expect(USE_ELEMENT_MAX_BOOST).toBe(30);
      expect(DSE_ELEMENT_MAX_BOOST).toBe(20);
      expect(USE_ELEMENT_MAX_BOOST).toBeGreaterThan(DSE_ELEMENT_MAX_BOOST);
    });
  });
});
