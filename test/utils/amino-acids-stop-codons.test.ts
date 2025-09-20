/**
 * Tests for stop codon handling in amino acid translation
 */

import { RNA } from '../../src/model/nucleic-acids/RNA.js';
import { MRNA } from '../../src/model/nucleic-acids/MRNA.js';
import { Polypeptide } from '../../src/model/Polypeptide.js';
import { RNAtoAminoAcids } from '../../src/utils/amino-acids.js';
import { STOP_CODONS } from '../../src/utils/nucleic-acids.js';

describe('Stop Codon Handling', () => {
  describe('RNAtoAminoAcids', () => {
    test('should stop translation at UAG stop codon', () => {
      const rna = new RNA('AUGAAACCCUAG'); // Met-Lys-Pro-STOP
      const aminoAcids = RNAtoAminoAcids(rna);

      expect(aminoAcids).toHaveLength(3); // Only 3 amino acids, stops at UAG
      expect(aminoAcids[0].slc).toBe('M'); // Met
      expect(aminoAcids[1].slc).toBe('K'); // Lys
      expect(aminoAcids[2].slc).toBe('P'); // Pro
    });

    test('should stop translation at UAA stop codon', () => {
      const rna = new RNA('AUGAAACCCUAA'); // Met-Lys-Pro-STOP
      const aminoAcids = RNAtoAminoAcids(rna);

      expect(aminoAcids).toHaveLength(3); // Only 3 amino acids, stops at UAA
      expect(aminoAcids[0].slc).toBe('M'); // Met
      expect(aminoAcids[1].slc).toBe('K'); // Lys
      expect(aminoAcids[2].slc).toBe('P'); // Pro
    });

    test('should stop translation at UGA stop codon', () => {
      const rna = new RNA('AUGAAACCCUGA'); // Met-Lys-Pro-STOP
      const aminoAcids = RNAtoAminoAcids(rna);

      expect(aminoAcids).toHaveLength(3); // Only 3 amino acids, stops at UGA
      expect(aminoAcids[0].slc).toBe('M'); // Met
      expect(aminoAcids[1].slc).toBe('K'); // Lys
      expect(aminoAcids[2].slc).toBe('P'); // Pro
    });

    test('should stop at first stop codon encountered', () => {
      const rna = new RNA('AUGAAAUAGCCCUAA'); // Met-Lys-STOP-Pro-STOP
      const aminoAcids = RNAtoAminoAcids(rna);

      expect(aminoAcids).toHaveLength(2); // Only 2 amino acids, stops at first UAG
      expect(aminoAcids[0].slc).toBe('M'); // Met
      expect(aminoAcids[1].slc).toBe('K'); // Lys
    });

    test('should translate full sequence if no stop codon present', () => {
      const rna = new RNA('AUGAAACCCGGG'); // Met-Lys-Pro-Gly
      const aminoAcids = RNAtoAminoAcids(rna);

      expect(aminoAcids).toHaveLength(4); // All 4 amino acids
      expect(aminoAcids[0].slc).toBe('M'); // Met
      expect(aminoAcids[1].slc).toBe('K'); // Lys
      expect(aminoAcids[2].slc).toBe('P'); // Pro
      expect(aminoAcids[3].slc).toBe('G'); // Gly
    });

    test('should return empty array if first codon is stop codon', () => {
      const rna = new RNA('UAGAAACCCGGG'); // STOP-Lys-Pro-Gly
      const aminoAcids = RNAtoAminoAcids(rna);

      expect(aminoAcids).toHaveLength(0); // No amino acids, immediate stop
    });
  });

  describe('Polypeptide with stop codons', () => {
    test('should create polypeptide from mRNA with stop codon', () => {
      const fullSequence = 'AUGAAACCCGGGUAG';
      const codingSequence = 'AUGAAACCCGGGUAG';
      const mRNA = new MRNA(fullSequence, codingSequence, 0, 15, true, '');

      const polypeptide = new Polypeptide(mRNA);

      expect(polypeptide.aminoAcidSequence).toHaveLength(4); // Met-Lys-Pro-Gly, stops at UAG
      expect(polypeptide.aminoAcidSequence[0].slc).toBe('M'); // Met
      expect(polypeptide.aminoAcidSequence[1].slc).toBe('K'); // Lys
      expect(polypeptide.aminoAcidSequence[2].slc).toBe('P'); // Pro
      expect(polypeptide.aminoAcidSequence[3].slc).toBe('G'); // Gly
    });

    test('should handle mRNA with stop codon and poly-A tail', () => {
      const fullSequence = 'AUGAAACCCUAGAAAAAAAAAA';
      const codingSequence = 'AUGAAACCCUAG';
      const polyATail = 'AAAAAAAAAA';
      const mRNA = new MRNA(fullSequence, codingSequence, 0, 12, true, polyATail);

      const polypeptide = new Polypeptide(mRNA);

      expect(polypeptide.aminoAcidSequence).toHaveLength(3); // Met-Lys-Pro, stops at UAG
      expect(polypeptide.aminoAcidSequence[0].slc).toBe('M'); // Met
      expect(polypeptide.aminoAcidSequence[1].slc).toBe('K'); // Lys
      expect(polypeptide.aminoAcidSequence[2].slc).toBe('P'); // Pro
    });
  });

  describe('Stop codon constants', () => {
    test('should have correct stop codons defined', () => {
      expect(STOP_CODONS).toContain('UAG');
      expect(STOP_CODONS).toContain('UAA');
      expect(STOP_CODONS).toContain('UGA');
      expect(STOP_CODONS).toHaveLength(3);
    });
  });
});
