import { DNA, parseDNA } from '../../../src/sequence';
import { InvalidSequenceError } from '../../../src/model/errors/InvalidSequenceError';
import { isFailure } from '../../../src/result/Result';

describe('DNA', () => {
  describe('constructor', () => {
    test('creates DNA from a valid sequence', () => {
      const dna = new DNA('ATCG');
      expect(dna.getSequence()).toBe('ATCG');
      expect(dna.nucleicAcidType).toBe('DNA');
    });

    test('normalizes lowercase to uppercase', () => {
      expect(new DNA('atcg').getSequence()).toBe('ATCG');
    });

    test('handles mixed case sequences', () => {
      expect(new DNA('AtCg').getSequence()).toBe('ATCG');
    });

    test('creates DNA with all valid nucleotides', () => {
      expect(new DNA('AATTCCGG').getSequence()).toBe('AATTCCGG');
    });

    test('throws InvalidSequenceError for empty sequence', () => {
      expect(() => new DNA('')).toThrow(InvalidSequenceError);
    });

    test('throws InvalidSequenceError for invalid characters', () => {
      expect(() => new DNA('ATCX')).toThrow(InvalidSequenceError);
      expect(() => new DNA('ATCG123')).toThrow(InvalidSequenceError);
    });

    test('throws InvalidSequenceError for RNA nucleotides in DNA input', () => {
      expect(() => new DNA('AUCG')).toThrow(InvalidSequenceError);
    });

    test('error message names the offending character and tags the alphabet', () => {
      try {
        new DNA('ATCX');
        fail('Should have thrown InvalidSequenceError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidSequenceError);
        if (error instanceof InvalidSequenceError) {
          expect(error.message).toContain('X');
          expect(error.nucleicAcidType).toBe('DNA');
          expect(error.sequence).toBe('ATCX');
        }
      }
    });

    test('handles long sequences', () => {
      const longSequence = 'ATCG'.repeat(1000);
      const dna = new DNA(longSequence);
      expect(dna.getSequence()).toBe(longSequence);
      expect(dna.length()).toBe(4000);
    });

    test('handles single nucleotide', () => {
      expect(new DNA('A').getSequence()).toBe('A');
    });
  });

  describe('parseDNA equivalence', () => {
    test('parseDNA failure aligns with constructor throwing for the same input', () => {
      const result = parseDNA('ATCX');
      expect(isFailure(result)).toBe(true);
      expect(() => new DNA('ATCX')).toThrow(InvalidSequenceError);
    });
  });

  describe('getSequence', () => {
    test('returns the validated upper-case sequence', () => {
      expect(new DNA('atcggatcctagg').getSequence()).toBe('ATCGGATCCTAGG');
    });

    test('returns a stable string across calls', () => {
      const dna = new DNA('ATCG');
      expect(dna.getSequence()).toBe('ATCG');
      expect(dna.getSequence()).toBe('ATCG');
    });
  });

  describe('equality', () => {
    test('two DNAs with the same sequence are equal', () => {
      expect(new DNA('ATCG').equals(new DNA('ATCG'))).toBe(true);
    });

    test('two DNAs with different sequences are not equal', () => {
      expect(new DNA('ATCG').equals(new DNA('GGCC'))).toBe(false);
    });
  });

  describe('edge cases and validation', () => {
    test('rejects whitespace inside sequences', () => {
      expect(() => new DNA(' ATCG ')).toThrow(InvalidSequenceError);
    });

    test('rejects sequences with numbers', () => {
      expect(() => new DNA('ATC123G')).toThrow(InvalidSequenceError);
    });

    test('rejects sequences with special characters', () => {
      expect(() => new DNA('ATC-G')).toThrow(InvalidSequenceError);
      expect(() => new DNA('ATC.G')).toThrow(InvalidSequenceError);
    });

    test('accepts each canonical DNA base individually', () => {
      expect(() => new DNA('A')).not.toThrow();
      expect(() => new DNA('T')).not.toThrow();
      expect(() => new DNA('C')).not.toThrow();
      expect(() => new DNA('G')).not.toThrow();
    });

    test('case insensitivity in validation', () => {
      expect(() => new DNA('atcg')).not.toThrow();
      expect(() => new DNA('atcx')).toThrow(InvalidSequenceError);
      expect(() => new DNA('ATCX')).toThrow(InvalidSequenceError);
    });
  });

  describe('biological sequences', () => {
    test('handles realistic gene sequences', () => {
      const geneSequence = 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAG';
      const dna = new DNA(geneSequence);
      expect(dna.getSequence()).toBe(geneSequence);
      expect(dna.length()).toBe(geneSequence.length);
    });

    test('handles GC-rich sequences', () => {
      expect(new DNA('GCGCGCGCGC').getSequence()).toBe('GCGCGCGCGC');
    });

    test('handles AT-rich sequences', () => {
      expect(new DNA('ATATATATAT').getSequence()).toBe('ATATATATAT');
    });
  });

  describe('search and substring methods', () => {
    const testDNA = new DNA('ATCGATCG');

    describe('length', () => {
      test('returns correct sequence length', () => {
        expect(testDNA.length()).toBe(8);
      });

      test('returns 1 for single nucleotide', () => {
        expect(new DNA('A').length()).toBe(1);
      });
    });

    describe('contains', () => {
      test('finds existing subsequence (string)', () => {
        expect(testDNA.contains('TCG')).toBe(true);
        expect(testDNA.contains('ATCG')).toBe(true);
      });

      test('returns false for missing subsequence', () => {
        expect(testDNA.contains('AAA')).toBe(false);
        expect(testDNA.contains('TTT')).toBe(false);
      });

      test('finds subsequence (DNA argument)', () => {
        expect(testDNA.contains(new DNA('TCG'))).toBe(true);
      });
    });

    describe('startsWith / endsWith', () => {
      test('startsWith handles strings and DNA', () => {
        expect(testDNA.startsWith('ATC')).toBe(true);
        expect(testDNA.startsWith(new DNA('ATC'))).toBe(true);
        expect(testDNA.startsWith('GTC')).toBe(false);
      });

      test('endsWith handles strings and DNA', () => {
        expect(testDNA.endsWith('TCG')).toBe(true);
        expect(testDNA.endsWith(new DNA('TCG'))).toBe(true);
        expect(testDNA.endsWith('ATC')).toBe(false);
      });
    });

    describe('indexOf', () => {
      test('returns first occurrence', () => {
        expect(testDNA.indexOf('TCG')).toBe(1);
        expect(testDNA.indexOf('ATC')).toBe(0);
      });

      test('respects start position', () => {
        expect(testDNA.indexOf('TCG', 2)).toBe(5);
      });

      test('returns -1 when missing', () => {
        expect(testDNA.indexOf('AAA')).toBe(-1);
      });

      test('accepts DNA argument', () => {
        expect(testDNA.indexOf(new DNA('TCG'))).toBe(1);
      });
    });

    describe('getSubsequence', () => {
      test('extracts an inclusive-exclusive range', () => {
        const sub = testDNA.getSubsequence(2, 5);
        expect(sub).toBeInstanceOf(DNA);
        expect(sub.getSequence()).toBe('CGA');
      });

      test('extracts to end of sequence when end is omitted', () => {
        expect(testDNA.getSubsequence(5).getSequence()).toBe('TCG');
      });

      test('extracts entire sequence', () => {
        expect(testDNA.getSubsequence(0).getSequence()).toBe('ATCGATCG');
      });
    });
  });

  describe('complement transformations', () => {
    const testDNA = new DNA('ATCGATCG');

    test('getComplement returns a new DNA carrying the complement', () => {
      const complement = testDNA.getComplement();
      expect(complement).toBeInstanceOf(DNA);
      expect(complement.getSequence()).toBe('TAGCTAGC');
      expect(complement).not.toBe(testDNA);
    });

    test('getReverseComplement returns a new DNA carrying the reverse complement', () => {
      const rc = testDNA.getReverseComplement();
      expect(rc).toBeInstanceOf(DNA);
      expect(rc.getSequence()).toBe('CGATCGAT');
    });

    test('handles single bases', () => {
      expect(new DNA('A').getComplement().getSequence()).toBe('T');
      expect(new DNA('T').getComplement().getSequence()).toBe('A');
      expect(new DNA('C').getComplement().getSequence()).toBe('G');
      expect(new DNA('G').getComplement().getSequence()).toBe('C');
    });

    test('double complement is identity', () => {
      const round = testDNA.getComplement().getComplement();
      expect(round.equals(testDNA)).toBe(true);
    });

    test('palindromic restriction site equals its reverse complement', () => {
      const ecori = new DNA('GAATTC');
      expect(ecori.getReverseComplement().getSequence()).toBe('GAATTC');
    });

    test('chains with substring extraction', () => {
      const result = testDNA.getSubsequence(0, 4).getComplement().getReverseComplement();
      expect(result.getSequence()).toBe('GCTA');
    });

    test('preserves immutability of the original', () => {
      const original = new DNA('ATCG');
      original.getComplement();
      original.getReverseComplement();
      expect(original.getSequence()).toBe('ATCG');
    });
  });
});
