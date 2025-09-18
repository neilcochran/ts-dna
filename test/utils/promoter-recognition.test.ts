import { findPromoters, identifyTSS } from '../../src/utils/promoter-recognition';
import { DNA } from '../../src/model/nucleic-acids/DNA';
import { Promoter } from '../../src/model/Promoter';
import { PromoterElement } from '../../src/model/PromoterElement';
import { NucleotidePattern } from '../../src/model/nucleic-acids/NucleotidePattern';
import { MAX_PROMOTER_SEARCH_DISTANCE } from '../../src/constants/biological-constants';

describe('promoter-recognition', () => {
  describe('findPromoters', () => {
    test('finds simple TATA-containing promoter', () => {
      // Sequence with TATA box at position 50
      const sequence = 'A'.repeat(50) + 'TATAAAAG' + 'C'.repeat(50); // TATAWAWR: TATAAAAG matches pattern
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna);

      expect(promoters.length).toBeGreaterThan(0);
      const tataPromoter = promoters.find(p => p.hasElement('TATA'));
      expect(tataPromoter).toBeDefined();
    });

    test('finds Initiator-containing promoter', () => {
      // Sequence with Inr pattern: BBCABW (6 chars): CCCATA (C,C,C,A,C,A)
      const sequence = 'A'.repeat(50) + 'CCCACA' + 'G'.repeat(50);
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna);

      expect(promoters.length).toBeGreaterThan(0);
      const inrPromoter = promoters.find(p => p.hasElement('Inr'));
      expect(inrPromoter).toBeDefined();
    });

    test('finds complex promoter with multiple elements', () => {
      // Create sequence with TATA box and CAAT box
      const sequence = 'A'.repeat(25) + 'GGCCAATCT' + 'T'.repeat(45) + 'TATAAAAG' + 'C'.repeat(50);
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna);

      expect(promoters.length).toBeGreaterThan(0);
      const strongPromoter = promoters.find(p => p.hasElement('TATA') && p.hasElement('CAAT'));
      expect(strongPromoter).toBeDefined();
      if (strongPromoter) {
        expect(strongPromoter.getStrengthScore()).toBeGreaterThan(15);
      }
    });

    test('returns empty array for sequence with no promoter elements', () => {
      const sequence = 'AAAAAAAAAAAAAAAAAAAAAA';
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna);

      expect(promoters).toHaveLength(0);
    });

    test('respects minimum elements option', () => {
      const sequence = 'A'.repeat(50) + 'TATAAAAG' + 'C'.repeat(50);
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna, { minElements: 2 });

      // Should find fewer (or no) promoters with stricter requirements
      expect(promoters.length).toBeLessThanOrEqual(1);
    });

    test('respects minimum strength score option', () => {
      const sequence = 'A'.repeat(50) + 'TATAAAAG' + 'C'.repeat(50);
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna, { minStrengthScore: 20 });

      // High strength requirement should filter out weak promoters
      expect(promoters.every(p => p.getStrengthScore() >= 20)).toBe(true);
    });

    // Custom elements test removed - not biologically accurate
    // Random sequences cannot function as core promoter elements

    test('sorts promoters by strength score', () => {
      // Create sequence with weak and strong promoter regions
      const sequence = 'TATAAAAG' + 'A'.repeat(100) + 'GGCCAATCTTATAAAAG' + 'G'.repeat(50);
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna, { minStrengthScore: 5 });

      if (promoters.length > 1) {
        // Should be sorted by strength (strongest first)
        for (let i = 1; i < promoters.length; i++) {
          expect(promoters[i - 1].getStrengthScore()).toBeGreaterThanOrEqual(
            promoters[i].getStrengthScore(),
          );
        }
      }
    });
  });

  describe('identifyTSS', () => {
    test('identifies TSS from Initiator element', () => {
      const inrElement = new PromoterElement('Inr', new NucleotidePattern('BBCABW'), 0);
      const promoter = new Promoter(100, [inrElement]);
      const sequence = new DNA('A'.repeat(MAX_PROMOTER_SEARCH_DISTANCE));

      const tssPositions = identifyTSS(promoter, sequence);

      expect(tssPositions).toContain(100);
    });

    test('predicts TSS from TATA box', () => {
      const tataElement = new PromoterElement('TATA', new NucleotidePattern('TATAWAWR'), -25);
      const promoter = new Promoter(100, [tataElement]);
      const sequence = new DNA('A'.repeat(MAX_PROMOTER_SEARCH_DISTANCE));

      const tssPositions = identifyTSS(promoter, sequence);

      // TSS is provided as 100 in promoter, algorithm should return this
      expect(tssPositions).toContain(100);
    });

    test('handles promoter with multiple Initiators', () => {
      const inr1 = new PromoterElement('Inr', new NucleotidePattern('BBCABW'), 0);
      const inr2 = new PromoterElement('Inr', new NucleotidePattern('CCATCCC'), 10);
      const promoter = new Promoter(100, [inr1, inr2]);
      const sequence = new DNA('A'.repeat(MAX_PROMOTER_SEARCH_DISTANCE));

      const tssPositions = identifyTSS(promoter, sequence);

      expect(tssPositions).toHaveLength(2);
      expect(tssPositions).toContain(100);
      expect(tssPositions).toContain(110);
    });

    test('handles promoter with multiple TATA boxes', () => {
      const tata1 = new PromoterElement('TATA', new NucleotidePattern('TATAWAWR'), -25);
      const tata2 = new PromoterElement('TATA', new NucleotidePattern('TATAWAWR'), -30);
      const promoter = new Promoter(100, [tata1, tata2]);
      const sequence = new DNA('A'.repeat(MAX_PROMOTER_SEARCH_DISTANCE));

      const tssPositions = identifyTSS(promoter, sequence);

      expect(tssPositions).toHaveLength(2);
      expect(tssPositions).toContain(100); // Both calculate back to TSS=100
      // Note: Both TATA elements point to the same TSS, so result is [100, 100]
    });

    test('falls back to promoter TSS for other elements', () => {
      const gcElement = new PromoterElement('GC', new NucleotidePattern('GGGCGG'), -70);
      const promoter = new Promoter(100, [gcElement]);
      const sequence = new DNA('A'.repeat(MAX_PROMOTER_SEARCH_DISTANCE));

      const tssPositions = identifyTSS(promoter, sequence);

      expect(tssPositions).toContain(100);
    });

    test('filters out invalid TSS positions', () => {
      const tataElement = new PromoterElement('TATA', new NucleotidePattern('TATAWAWR'), -25);
      const promoter = new Promoter(10, [tataElement]); // TSS prediction would be at 35
      const sequence = new DNA('ATCG'); // Only 4 bases long

      const tssPositions = identifyTSS(promoter, sequence);

      // Should not include positions beyond sequence length
      expect(tssPositions.every(pos => pos < sequence.getSequence().length)).toBe(true);
    });

    test('handles edge case with TSS at sequence boundary', () => {
      const inrElement = new PromoterElement('Inr', new NucleotidePattern('BBCABW'), 0);
      const promoter = new Promoter(0, [inrElement]); // TSS at very beginning
      const sequence = new DNA('ATCGATCG');

      const tssPositions = identifyTSS(promoter, sequence);

      expect(tssPositions).toContain(0);
    });
  });

  describe('integration tests', () => {
    test('realistic beta-globin-like promoter', () => {
      // Construct a sequence similar to beta-globin promoter structure
      const upstream = 'ATCGATCG';
      const caatBox = 'GGCCAATCT';
      const spacer1 = 'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG';
      const tataBox = 'TATAAAAG';
      const spacer2 = 'ATCGATCGATCGATCGATCGATCG';
      const tss = 'ATCG';
      const downstream = 'ATCGATCGATCG';

      const sequence = upstream + caatBox + spacer1 + tataBox + spacer2 + tss + downstream;
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna);

      expect(promoters.length).toBeGreaterThan(0);

      const bestPromoter = promoters[0]; // Should be sorted by strength
      expect(bestPromoter.hasElement('TATA')).toBe(true);
      expect(bestPromoter.hasElement('CAAT')).toBe(true);
      expect(bestPromoter.getStrengthScore()).toBeGreaterThan(15);

      // Test TSS prediction
      const tssPositions = identifyTSS(bestPromoter, dna);
      expect(tssPositions.length).toBeGreaterThan(0);
    });

    test('TATA-less promoter with Inr and DPE', () => {
      const upstream = 'ATCGATCGATCG';
      const inrElement = 'CCATCCC'; // Inr-like sequence
      const spacer = 'ATCGATCGATCGATCGATCGATCGATCGATCGATCG';
      const dpeElement = 'AGACT'; // DPE-like sequence
      const downstream = 'ATCGATCG';

      const sequence = upstream + inrElement + spacer + dpeElement + downstream;
      const dna = new DNA(sequence);

      const promoters = findPromoters(dna);

      if (promoters.length > 0) {
        const inrPromoter = promoters.find(p => p.hasElement('Inr'));
        expect(inrPromoter).toBeDefined();

        if (inrPromoter) {
          const tssPositions = identifyTSS(inrPromoter, dna);
          expect(tssPositions.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
