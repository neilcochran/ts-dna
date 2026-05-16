import { RNA, parseRNA } from '../../../src/sequence';
import { InvalidSequenceError } from '../../../src/model/errors/InvalidSequenceError';
import { isFailure } from '../../../src/result/Result';

describe('RNA', () => {
  describe('constructor', () => {
    test('creates RNA from a valid sequence', () => {
      const rna = new RNA('AUCG');
      expect(rna.getSequence()).toBe('AUCG');
      expect(rna.nucleicAcidType).toBe('RNA');
    });

    test('normalizes lowercase to uppercase', () => {
      expect(new RNA('aucg').getSequence()).toBe('AUCG');
    });

    test('handles mixed case sequences', () => {
      expect(new RNA('AuCg').getSequence()).toBe('AUCG');
    });

    test('creates RNA with all valid nucleotides', () => {
      expect(new RNA('AAUUCCGG').getSequence()).toBe('AAUUCCGG');
    });

    test('throws InvalidSequenceError for empty sequence', () => {
      expect(() => new RNA('')).toThrow(InvalidSequenceError);
    });

    test('throws InvalidSequenceError for invalid characters', () => {
      expect(() => new RNA('AUCX')).toThrow(InvalidSequenceError);
      expect(() => new RNA('AUCG123')).toThrow(InvalidSequenceError);
    });

    test('throws InvalidSequenceError for DNA nucleotides in RNA input', () => {
      expect(() => new RNA('ATCG')).toThrow(InvalidSequenceError);
    });

    test('error message names the offending character and tags the alphabet', () => {
      try {
        new RNA('AUCX');
        fail('Should have thrown InvalidSequenceError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidSequenceError);
        if (error instanceof InvalidSequenceError) {
          expect(error.message).toContain('X');
          expect(error.nucleicAcidType).toBe('RNA');
          expect(error.sequence).toBe('AUCX');
        }
      }
    });

    test('handles long sequences', () => {
      const longSequence = 'AUCG'.repeat(1000);
      const rna = new RNA(longSequence);
      expect(rna.getSequence()).toBe(longSequence);
      expect(rna.length()).toBe(4000);
    });

    test('handles single nucleotide', () => {
      expect(new RNA('A').getSequence()).toBe('A');
    });
  });

  describe('parseRNA equivalence', () => {
    test('parseRNA failure aligns with constructor throwing for the same input', () => {
      const result = parseRNA('AUCX');
      expect(isFailure(result)).toBe(true);
      expect(() => new RNA('AUCX')).toThrow(InvalidSequenceError);
    });
  });

  describe('equality', () => {
    test('two RNAs with the same sequence are equal', () => {
      expect(new RNA('AUCG').equals(new RNA('AUCG'))).toBe(true);
    });

    test('two RNAs with different sequences are not equal', () => {
      expect(new RNA('AUCG').equals(new RNA('GGCC'))).toBe(false);
    });
  });

  describe('search and substring methods', () => {
    const testRNA = new RNA('AUCGAUCG');

    test('length returns correct length', () => {
      expect(testRNA.length()).toBe(8);
    });

    test('contains finds existing subsequence', () => {
      expect(testRNA.contains('UCG')).toBe(true);
      expect(testRNA.contains(new RNA('UCG'))).toBe(true);
      expect(testRNA.contains('AAA')).toBe(false);
    });

    test('startsWith and endsWith handle strings and RNA', () => {
      expect(testRNA.startsWith('AUC')).toBe(true);
      expect(testRNA.startsWith(new RNA('AUC'))).toBe(true);
      expect(testRNA.endsWith('UCG')).toBe(true);
      expect(testRNA.endsWith(new RNA('UCG'))).toBe(true);
    });

    test('indexOf returns positions', () => {
      expect(testRNA.indexOf('UCG')).toBe(1);
      expect(testRNA.indexOf('UCG', 2)).toBe(5);
      expect(testRNA.indexOf('AAA')).toBe(-1);
    });

    test('getSubsequence extracts inclusive-exclusive range', () => {
      const sub = testRNA.getSubsequence(2, 5);
      expect(sub).toBeInstanceOf(RNA);
      expect(sub.getSequence()).toBe('CGA');
    });
  });

  describe('complement transformations', () => {
    const testRNA = new RNA('AUCGAUCG');

    test('getComplement returns a new RNA carrying the complement', () => {
      const complement = testRNA.getComplement();
      expect(complement).toBeInstanceOf(RNA);
      expect(complement.getSequence()).toBe('UAGCUAGC');
    });

    test('getReverseComplement returns a new RNA carrying the reverse complement', () => {
      const rc = testRNA.getReverseComplement();
      expect(rc).toBeInstanceOf(RNA);
      expect(rc.getSequence()).toBe('CGAUCGAU');
    });

    test('handles single bases', () => {
      expect(new RNA('A').getComplement().getSequence()).toBe('U');
      expect(new RNA('U').getComplement().getSequence()).toBe('A');
      expect(new RNA('C').getComplement().getSequence()).toBe('G');
      expect(new RNA('G').getComplement().getSequence()).toBe('C');
    });

    test('double complement is identity', () => {
      const round = testRNA.getComplement().getComplement();
      expect(round.equals(testRNA)).toBe(true);
    });
  });
});
