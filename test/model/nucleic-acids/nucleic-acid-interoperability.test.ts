/**
 * Tests covering the explicit-conversion contract between DNA and RNA. The implicit
 * cross-type constructor polymorphism (`new DNA(rna)` / `new RNA(dna)`) is gone; conversion
 * goes through `transcribeSequence` / `reverseTranscribeSequence` only.
 */

import { DNA, RNA, transcribeSequence, reverseTranscribeSequence } from '../../../src/sequence';

describe('DNA/RNA explicit conversion', () => {
  const DNA_SEQ = 'ATCGATCG';
  const RNA_SEQ = 'AUCGAUCG';

  describe('transcribeSequence (DNA -> RNA)', () => {
    test('replaces T with U and preserves other bases', () => {
      const rna = transcribeSequence(new DNA(DNA_SEQ));
      expect(rna).toBeInstanceOf(RNA);
      expect(rna.sequence).toBe(RNA_SEQ);
    });

    test('preserves length', () => {
      const dna = new DNA('ATCGATCGATCGATCG');
      expect(transcribeSequence(dna).sequence.length).toBe(dna.sequence.length);
    });

    test('handles single nucleotide', () => {
      expect(transcribeSequence(new DNA('A')).sequence).toBe('A');
      expect(transcribeSequence(new DNA('T')).sequence).toBe('U');
      expect(transcribeSequence(new DNA('C')).sequence).toBe('C');
      expect(transcribeSequence(new DNA('G')).sequence).toBe('G');
    });

    test('handles long sequences', () => {
      const long = 'ATCG'.repeat(100);
      expect(transcribeSequence(new DNA(long)).sequence).toBe(long.replaceAll('T', 'U'));
    });
  });

  describe('reverseTranscribeSequence (RNA -> DNA)', () => {
    test('replaces U with T and preserves other bases', () => {
      const dna = reverseTranscribeSequence(new RNA(RNA_SEQ));
      expect(dna).toBeInstanceOf(DNA);
      expect(dna.sequence).toBe(DNA_SEQ);
    });

    test('handles single nucleotide', () => {
      expect(reverseTranscribeSequence(new RNA('A')).sequence).toBe('A');
      expect(reverseTranscribeSequence(new RNA('U')).sequence).toBe('T');
      expect(reverseTranscribeSequence(new RNA('C')).sequence).toBe('C');
      expect(reverseTranscribeSequence(new RNA('G')).sequence).toBe('G');
    });
  });

  describe('round-trip identity', () => {
    test('DNA -> RNA -> DNA returns the original DNA', () => {
      const original = new DNA(DNA_SEQ);
      const round = reverseTranscribeSequence(transcribeSequence(original));
      expect(round.sequence).toBe(original.sequence);
    });

    test('RNA -> DNA -> RNA returns the original RNA', () => {
      const original = new RNA(RNA_SEQ);
      const round = transcribeSequence(reverseTranscribeSequence(original));
      expect(round.sequence).toBe(original.sequence);
    });

    test('multiple round trips maintain sequence integrity', () => {
      const start = 'ATCGATCGATCG';
      const dna1 = new DNA(start);
      const rna1 = transcribeSequence(dna1);
      const dna2 = reverseTranscribeSequence(rna1);
      const rna2 = transcribeSequence(dna2);
      const dna3 = reverseTranscribeSequence(rna2);
      expect(dna3.sequence).toBe(start);
      expect(rna2.sequence).toBe(start.replaceAll('T', 'U'));
    });
  });

  describe('runtime tag is preserved', () => {
    test('transcribed RNA carries the RNA tag', () => {
      expect(transcribeSequence(new DNA(DNA_SEQ)).nucleicAcidType).toBe('RNA');
    });

    test('reverse-transcribed DNA carries the DNA tag', () => {
      expect(reverseTranscribeSequence(new RNA(RNA_SEQ)).nucleicAcidType).toBe('DNA');
    });
  });
});
