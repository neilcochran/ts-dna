/**
 * Integration tests for NucleotidePattern functionality with real biological scenarios.
 * Exercises pattern matching, reverse complement, and either-strand matching against
 * representative DNA inputs.
 */

import { NucleotidePattern } from '../../src/pattern';
import { DNA, RNA } from '../../src/sequence';

describe('NucleotidePattern Integration Tests', () => {
  describe('Restriction Enzyme Site Recognition', () => {
    test('EcoRI site recognition with reverse complement', () => {
      const ecoRISite = new NucleotidePattern('GAATTC');
      const dna = new DNA('ATCGAATTCGTA');
      const reverseDNA = new DNA('TACGAATTCGAT');

      expect(ecoRISite.matches(dna)).toBe(true);
      expect(ecoRISite.reverseComplement().matches(reverseDNA)).toBe(true);

      expect(ecoRISite.reverseComplement().pattern).toBe('GAATTC');
    });

    test('BamHI site recognition (palindromic site)', () => {
      const bamHISite = new NucleotidePattern('GGATCC');
      const dna = new DNA('ATCGGATCCGTA');

      expect(bamHISite.matches(dna)).toBe(true);

      const reverseComplement = bamHISite.reverseComplement();
      expect(reverseComplement.pattern).toBe('GGATCC');

      expect(bamHISite.matchesEitherStrand(dna)).toBe(true);
    });

    test('HindIII site location reporting', () => {
      const hindIIIPattern = new NucleotidePattern('AAGCTT');
      const dna = new DNA('GCAAAGCTTCGTA');

      expect(hindIIIPattern.matches(dna)).toBe(true);

      const matches = hindIIIPattern.findAll(dna);
      expect(matches).toHaveLength(1);
      expect(matches[0].start).toBe(3);
      expect(matches[0].matched).toBe('AAGCTT');
    });
  });

  describe('Promoter Element Detection', () => {
    test('TATA box detection across both DNA strands', () => {
      const tataPattern = new NucleotidePattern('TATAAA');
      const promoterDNA = new DNA('ATGAAATATAAACGCGATCGTAGC');

      expect(tataPattern.matches(promoterDNA)).toBe(true);
      expect(tataPattern.matchesEitherStrand(promoterDNA)).toBe(true);

      const reverseComplement = tataPattern.reverseComplement();
      expect(reverseComplement.pattern).toBe('TTTATA');

      const reverseTATADNA = new DNA('ATGAAATTTATAACGCGATCGTAGC');
      expect(tataPattern.matchesEitherStrand(reverseTATADNA)).toBe(true);
    });

    test('CAAT box finds multiple occurrences', () => {
      const caatPattern = new NucleotidePattern('CAAT');
      const promoterRegion = new DNA('GCCCAATGGGTATAAAACGCGTACAAT');

      const matches = caatPattern.findAll(promoterRegion);
      expect(matches).toHaveLength(2);
      expect(matches[0].start).toBe(3);
      expect(matches[1].start).toBe(23);
    });

    test('GC box recognition with reverse complement', () => {
      const gcBoxPattern = new NucleotidePattern('GGGCGG');
      const promoterDNA = new DNA('ATCGGGCGGCTATGCCCGCCCTAG');

      expect(gcBoxPattern.matches(promoterDNA)).toBe(true);

      const reverseComplement = gcBoxPattern.reverseComplement();
      expect(reverseComplement.pattern).toBe('CCGCCC');
      expect(reverseComplement.matches(promoterDNA)).toBe(true);
    });
  });

  describe('Splice Site Recognition', () => {
    test('GT / AG splice sites with reverse complement', () => {
      const donorSite = new NucleotidePattern('GT');
      const acceptorSite = new NucleotidePattern('AG');

      const geneSequence = new DNA('ATGAAACCCGTAAGTATATATTAGCCCAAATAA');

      expect(donorSite.findAll(geneSequence).length).toBeGreaterThan(0);
      expect(acceptorSite.findAll(geneSequence).length).toBeGreaterThan(0);

      expect(donorSite.reverseComplement().pattern).toBe('AC');
      expect(acceptorSite.reverseComplement().pattern).toBe('CT');
    });

    test('exon junction pattern matches DNA but not RNA (literal T vs U)', () => {
      const exonJunction = new NucleotidePattern('AGGTAAGT');
      const dnaSequence = new DNA('ATGAAACCCAGGTAAGTTATATATCCCAAATAA');
      expect(exonJunction.matches(dnaSequence)).toBe(true);

      const rnaSequence = new RNA('AUGAAACCCAGGUAAGUUAUAUAUCCCAAAUAA');
      expect(exonJunction.matches(rnaSequence)).toBe(false);
    });
  });

  describe('Regulatory Element Detection', () => {
    test('canonical poly-A DNA signal', () => {
      const polyASignal = new NucleotidePattern('AATAAA');
      const geneEnd = new DNA('ATGAAACCCAATAAACCCGGGAAATAA');

      expect(polyASignal.matches(geneEnd)).toBe(true);

      const match = polyASignal.findFirst(geneEnd);
      expect(match).toBeDefined();
      expect(match?.start).toBe(9);
      expect(match?.matched).toBe('AATAAA');
    });

    test('E-box with degenerate center', () => {
      const enhancerPattern = new NucleotidePattern('CANNTG');
      const enhancerRegion = new DNA('GCCCACGTGGGTATAAACAATTGCGTA');

      const matches = enhancerPattern.findAll(enhancerRegion);
      expect(matches).toHaveLength(2);
    });
  });

  describe('Cross-Pattern Integration', () => {
    test('multiple patterns in gene regulatory region', () => {
      const tataBox = new NucleotidePattern('TATAAA');
      const caatBox = new NucleotidePattern('CAAT');
      const gcBox = new NucleotidePattern('GGGCGG');

      const promoterRegion = new DNA('GGGCGGCCCAATGGGTATAAAACGCGTA');

      expect(tataBox.matches(promoterRegion)).toBe(true);
      expect(caatBox.matches(promoterRegion)).toBe(true);
      expect(gcBox.matches(promoterRegion)).toBe(true);

      expect(gcBox.findFirst(promoterRegion)?.start).toBe(0);
      expect(caatBox.findFirst(promoterRegion)?.start).toBe(8);
      expect(tataBox.findFirst(promoterRegion)?.start).toBe(15);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('large sequence pattern searching', () => {
      const targetPattern = new NucleotidePattern('ATGCGATCG');
      const largeSequence = new DNA('ATGCGATCG'.repeat(1000) + 'AAATGCGATCGAAA');

      const matches = targetPattern.findAll(largeSequence);
      expect(matches.length).toBeGreaterThan(1000);

      const startTime = Date.now();
      targetPattern.findAll(largeSequence);
      expect(Date.now() - startTime).toBeLessThan(100);
    });

    test('reverse-complement is involutive for IUPAC-only patterns', () => {
      const patterns = [
        'A',
        'T',
        'C',
        'G',
        'AT',
        'GC',
        'TA',
        'CG',
        'ATCG',
        'GCTA',
        'TATGCGTA',
        'R',
        'Y',
        'W',
        'S',
        'M',
        'K',
        'RY',
        'WS',
        'MK',
        'NNNN',
      ];

      for (const patternStr of patterns) {
        const pattern = new NucleotidePattern(patternStr);
        const doubleRC = pattern.reverseComplement().reverseComplement();
        expect(doubleRC.pattern).toBe(pattern.pattern);
      }
    });
  });
});
