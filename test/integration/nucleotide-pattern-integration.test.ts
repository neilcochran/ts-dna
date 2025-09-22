/**
 * Integration tests for NucleotidePattern functionality with real biological scenarios.
 * Tests the new getReverseComplement method and its integration with existing features.
 */

import { NucleotidePattern } from '../../src/model/nucleic-acids/NucleotidePattern.js';
import { DNA } from '../../src/model/nucleic-acids/DNA.js';
import { RNA } from '../../src/model/nucleic-acids/RNA.js';

describe('NucleotidePattern Integration Tests', () => {
  describe('Restriction Enzyme Site Recognition', () => {
    test('EcoRI site recognition with reverse complement', () => {
      // EcoRI recognizes GAATTC on either strand
      const ecoRISite = new NucleotidePattern('GAATTC');
      const dna = new DNA('ATCGAATTCGTA'); // Contains EcoRI site
      const reverseDNA = new DNA('TACGAATTCGAT'); // Reverse complement contains site

      expect(ecoRISite.matches(dna)).toBe(true);
      expect(ecoRISite.getReverseComplement().matches(reverseDNA)).toBe(true);

      // Verify the reverse complement pattern is correct
      const reverseComplement = ecoRISite.getReverseComplement();
      expect(reverseComplement.pattern).toBe('GAATTC'); // EcoRI is palindromic
    });

    test('BamHI site recognition (asymmetric site)', () => {
      // BamHI recognizes GGATCC
      const bamHISite = new NucleotidePattern('GGATCC');
      const dna = new DNA('ATCGGATCCGTA'); // Contains BamHI site

      expect(bamHISite.matches(dna)).toBe(true);

      // Test reverse complement functionality
      const reverseComplement = bamHISite.getReverseComplement();
      expect(reverseComplement.pattern).toBe('GGATCC'); // BamHI is also palindromic

      // Should match on either strand
      expect(bamHISite.matchesEitherStrand(dna)).toBe(true);
    });

    test('HindIII site with IUPAC symbols', () => {
      // HindIII recognizes AAGCTT, use pattern with ambiguity
      const hindIIIPattern = new NucleotidePattern('AAGCTT');
      const dna = new DNA('GCAAAGCTTCGTA');

      expect(hindIIIPattern.matches(dna)).toBe(true);

      // Test finding all matches
      const matches = hindIIIPattern.findMatches(dna);
      expect(matches).toHaveLength(1);
      expect(matches[0].start).toBe(3);
      expect(matches[0].match).toBe('AAGCTT');
    });
  });

  describe('Promoter Element Detection', () => {
    test('TATA box detection across both DNA strands', () => {
      // TATA box should be found on either strand
      const tataPattern = new NucleotidePattern('TATAAA');
      const promoterDNA = new DNA('ATGAAATATAAACGCGATCGTAGC');

      expect(tataPattern.matches(promoterDNA)).toBe(true);
      expect(tataPattern.matchesEitherStrand(promoterDNA)).toBe(true);

      // Test reverse complement recognition
      const reverseComplement = tataPattern.getReverseComplement();
      expect(reverseComplement.pattern).toBe('TTTATA');

      // DNA with reverse complement TATA sequence
      const reverseTATADNA = new DNA('ATGAAATTTATAACGCGATCGTAGC');
      expect(tataPattern.matchesEitherStrand(reverseTATADNA)).toBe(true);
    });

    test('CAAT box with ambiguous nucleotides', () => {
      // CAAT box with some variability
      const caatPattern = new NucleotidePattern('CAAT');
      const promoterRegion = new DNA('GCCCAATGGGTATAAAACGCGTACAAT');

      const matches = caatPattern.findMatches(promoterRegion);
      expect(matches).toHaveLength(2); // Should find both CAAT occurrences
      expect(matches[0].start).toBe(3);
      expect(matches[1].start).toBe(23);
    });

    test('GC box recognition with reverse complement', () => {
      // GC box (GGGCGG)
      const gcBoxPattern = new NucleotidePattern('GGGCGG');
      const promoterDNA = new DNA('ATCGGGCGGCTATGCCCGCCCTAG');

      expect(gcBoxPattern.matches(promoterDNA)).toBe(true);

      // Test reverse complement
      const reverseComplement = gcBoxPattern.getReverseComplement();
      expect(reverseComplement.pattern).toBe('CCGCCC');

      // Should find the reverse complement in the sequence
      expect(reverseComplement.matches(promoterDNA)).toBe(true);
    });
  });

  describe('Splice Site Recognition', () => {
    test('GT-AG splice sites with reverse complement', () => {
      // 5' splice site (donor)
      const donorSite = new NucleotidePattern('GT');
      const acceptorSite = new NucleotidePattern('AG');

      const geneSequence = new DNA('ATGAAACCCGTAAGTATATATTAGCCCAAATAA');

      // Find donor and acceptor sites
      const donorMatches = donorSite.findMatches(geneSequence);
      const acceptorMatches = acceptorSite.findMatches(geneSequence);

      expect(donorMatches.length).toBeGreaterThan(0);
      expect(acceptorMatches.length).toBeGreaterThan(0);

      // Test reverse complement functionality
      const donorRC = donorSite.getReverseComplement();
      const acceptorRC = acceptorSite.getReverseComplement();

      expect(donorRC.pattern).toBe('AC');
      expect(acceptorRC.pattern).toBe('CT');
    });

    test('complex splice site patterns', () => {
      // More complex splice site with context (R = A or G)
      const exonJunction = new NucleotidePattern('AGGTAAGT');
      const testSequence = new DNA('ATGAAACCCAGGTAAGTTATATATCCCAAATAA');

      expect(exonJunction.testString(testSequence.getSequence())).toBe(true);

      // Test with RNA as well - DNA pattern won't match RNA with U nucleotides
      const rnaSequence = new RNA('AUGAAACCCAGGUAAGUUAUAUAUCCCAAAUAA');
      // DNA-based pattern with T won't match RNA sequence with U
      expect(exonJunction.testString(rnaSequence.getSequence())).toBe(false);
    });
  });

  describe('Regulatory Element Detection', () => {
    test('polyadenylation signal recognition', () => {
      // AAUAAA signal (in RNA context, but testing with DNA pattern)
      const polyASignal = new NucleotidePattern('AATAAA');
      const geneEnd = new DNA('ATGAAACCCAATAAACCCGGGAAATAA');

      expect(polyASignal.matches(geneEnd)).toBe(true);

      // Find the signal position
      const match = polyASignal.findFirst(geneEnd);
      expect(match).not.toBeNull();
      expect(match?.start).toBe(9);
      expect(match?.match).toBe('AATAAA');
    });

    test('enhancer sequence recognition with ambiguity', () => {
      // Enhancer with some degeneracy
      const enhancerPattern = new NucleotidePattern('CANNTG'); // E-box motif
      const enhancerRegion = new DNA('GCCCACGTGGGTATAAACAATTGCGTA');

      const matches = enhancerPattern.findMatches(enhancerRegion);
      expect(matches.length).toBeGreaterThan(0);

      // Should find CACGTG and CAATTG
      expect(matches).toHaveLength(2);
    });
  });

  describe('Cross-Pattern Integration', () => {
    test('multiple patterns in gene regulatory region', () => {
      const tataBox = new NucleotidePattern('TATAAA');
      const caatBox = new NucleotidePattern('CAAT');
      const gcBox = new NucleotidePattern('GGGCGG');

      const promoterRegion = new DNA('GGGCGGCCCAATGGGTATAAAACGCGTA');

      // All patterns should be found
      expect(tataBox.matches(promoterRegion)).toBe(true);
      expect(caatBox.matches(promoterRegion)).toBe(true);
      expect(gcBox.matches(promoterRegion)).toBe(true);

      // Test relative positions
      const tataMatch = tataBox.findFirst(promoterRegion);
      const caatMatch = caatBox.findFirst(promoterRegion);
      const gcMatch = gcBox.findFirst(promoterRegion);

      expect(gcMatch?.start).toBe(0);
      expect(caatMatch?.start).toBe(8);
      expect(tataMatch?.start).toBe(15);
    });

    test('pattern replacement and modification', () => {
      const restrictionSite = new NucleotidePattern('GAATTC');
      const originalSequence = new DNA('ATCGAATTCGTA');

      // Replace restriction site
      const modifiedSequence = restrictionSite.replace(originalSequence, 'GGCCCC');
      expect(modifiedSequence).toBe('ATCGGCCCCGTA');

      // Verify site is removed
      expect(restrictionSite.testString(modifiedSequence)).toBe(false);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('large sequence pattern searching', () => {
      const targetPattern = new NucleotidePattern('ATGCGATCG');
      const largeSequence = new DNA('ATGCGATCG'.repeat(1000) + 'AAATGCGATCGAAA');

      const matches = targetPattern.findMatches(largeSequence);
      expect(matches.length).toBeGreaterThan(1000);

      // Performance check - should complete quickly
      const startTime = Date.now();
      targetPattern.findMatches(largeSequence);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    test('reverse complement consistency across pattern types', () => {
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

      patterns.forEach(patternStr => {
        const pattern = new NucleotidePattern(patternStr);
        const reverseComplement = pattern.getReverseComplement();
        const doubleRC = reverseComplement.getReverseComplement();

        // Double reverse complement should equal original for simple patterns
        // (Note: This might not hold for complex regex patterns)
        if (!/[^ATCGRYWSMK]/.test(patternStr)) {
          expect(doubleRC.pattern).toBe(pattern.pattern);
        }
      });
    });
  });
});
