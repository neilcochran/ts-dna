import { DNA } from '../../../src/model/nucleic-acids/DNA';
import { InvalidSequenceError } from '../../../src/model/errors/InvalidSequenceError';
import { NucleicAcidType } from '../../../src/enums/nucleic-acid-type';
import { isSuccess, isFailure } from '../../../src/types/validation-result';

describe('DNA Class', () => {
  describe('constructor', () => {
    test('creates DNA from valid sequence', () => {
      const dna = new DNA('ATCG');
      expect(dna.getSequence()).toBe('ATCG');
      expect(dna.nucleicAcidType).toBe(NucleicAcidType.DNA);
    });

    test('normalizes lowercase to uppercase', () => {
      const dna = new DNA('atcg');
      expect(dna.getSequence()).toBe('ATCG');
    });

    test('handles mixed case sequences', () => {
      const dna = new DNA('AtCg');
      expect(dna.getSequence()).toBe('ATCG');
    });

    test('creates DNA with all valid nucleotides', () => {
      const dna = new DNA('AATTCCGG');
      expect(dna.getSequence()).toBe('AATTCCGG');
    });

    test('throws error for empty sequence', () => {
      expect(() => {
        new DNA('');
      }).toThrow(InvalidSequenceError);
    });

    test('throws error for invalid characters', () => {
      expect(() => {
        new DNA('ATCX');
      }).toThrow(InvalidSequenceError);

      expect(() => {
        new DNA('ATCG123');
      }).toThrow(InvalidSequenceError);
    });

    test('throws error for RNA nucleotides in DNA', () => {
      expect(() => {
        new DNA('AUCG'); // U is not valid in DNA
      }).toThrow(InvalidSequenceError);
    });

    test('error contains sequence and type information', () => {
      try {
        new DNA('ATCX');
        fail('Should have thrown InvalidSequenceError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidSequenceError);
        expect((error as InvalidSequenceError).message).toContain('X'); // Contains the invalid character
        expect((error as InvalidSequenceError).nucleicAcidType).toBe(NucleicAcidType.DNA);
      }
    });

    test('handles long sequences', () => {
      const longSequence = 'ATCG'.repeat(1000);
      const dna = new DNA(longSequence);
      expect(dna.getSequence()).toBe(longSequence);
      expect(dna.getSequence()).toHaveLength(4000);
    });

    test('handles single nucleotide', () => {
      const dna = new DNA('A');
      expect(dna.getSequence()).toBe('A');
    });
  });

  describe('static create method', () => {
    test('returns success for valid sequence', () => {
      const result = DNA.create('ATCG');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('ATCG');
        expect(result.data).toBeInstanceOf(DNA);
      }
    });

    test('returns failure for invalid sequence', () => {
      const result = DNA.create('ATCX');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('invalid');
      }
    });

    test('returns failure for empty sequence', () => {
      const result = DNA.create('');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBeDefined();
      }
    });

    test('normalizes case in create method', () => {
      const result = DNA.create('atcg');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('ATCG');
      }
    });

    test('create method handles RNA nucleotides correctly', () => {
      const result = DNA.create('AUCG');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('getSequence method', () => {
    test('returns original sequence', () => {
      const sequence = 'ATCGGATCCTAGG';
      const dna = new DNA(sequence);
      expect(dna.getSequence()).toBe(sequence);
    });

    test('sequence is immutable', () => {
      const dna = new DNA('ATCG');
      const sequence = dna.getSequence();

      // Modifying returned string doesn't affect DNA
      const modifiedSequence = sequence + 'AAAA';
      expect(dna.getSequence()).toBe('ATCG');
      expect(dna.getSequence()).not.toBe(modifiedSequence);
    });
  });

  describe('inheritance from NucleicAcid', () => {
    test('has correct nucleic acid type', () => {
      const dna = new DNA('ATCG');
      expect(dna.nucleicAcidType).toBe(NucleicAcidType.DNA);
    });

    test('implements equals method', () => {
      const dna1 = new DNA('ATCG');
      const dna2 = new DNA('ATCG');
      const dna3 = new DNA('GGCC');

      expect(dna1.equals(dna2)).toBe(true);
      expect(dna1.equals(dna3)).toBe(false);
    });

    test('implements getComplementSequence method', () => {
      const dna = new DNA('ATCG');
      const complement = dna.getComplementSequence();

      expect(complement).toBeDefined();
      expect(complement).toContain('T'); // A -> T
      expect(complement).toContain('A'); // T -> A
      expect(complement).toContain('G'); // C -> G
      expect(complement).toContain('C'); // G -> C
    });
  });

  describe('edge cases and validation', () => {
    test('handles whitespace correctly', () => {
      expect(() => {
        new DNA(' ATCG ');
      }).toThrow(InvalidSequenceError);
    });

    test('rejects sequences with numbers', () => {
      expect(() => {
        new DNA('ATC123G');
      }).toThrow(InvalidSequenceError);
    });

    test('rejects sequences with special characters', () => {
      expect(() => {
        new DNA('ATC-G');
      }).toThrow(InvalidSequenceError);

      expect(() => {
        new DNA('ATC.G');
      }).toThrow(InvalidSequenceError);
    });

    test('validates all four DNA nucleotides individually', () => {
      expect(() => new DNA('A')).not.toThrow();
      expect(() => new DNA('T')).not.toThrow();
      expect(() => new DNA('C')).not.toThrow();
      expect(() => new DNA('G')).not.toThrow();
    });

    test('case sensitivity in error detection', () => {
      // Lowercase should be normalized, not rejected
      expect(() => new DNA('atcg')).not.toThrow();

      // But invalid characters should still be rejected regardless of case
      expect(() => new DNA('atcx')).toThrow(InvalidSequenceError);
      expect(() => new DNA('ATCX')).toThrow(InvalidSequenceError);
    });
  });

  describe('biological sequences', () => {
    test('handles realistic gene sequences', () => {
      // Partial human beta-globin gene sequence
      const geneSequence = 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAG';
      const dna = new DNA(geneSequence);

      expect(dna.getSequence()).toBe(geneSequence);
      expect(dna.getSequence()).toHaveLength(geneSequence.length);
    });

    test('handles repetitive sequences', () => {
      const repetitive = 'ATATATAT';
      const dna = new DNA(repetitive);
      expect(dna.getSequence()).toBe(repetitive);
    });

    test('handles GC-rich sequences', () => {
      const gcRich = 'GCGCGCGCGC';
      const dna = new DNA(gcRich);
      expect(dna.getSequence()).toBe(gcRich);
    });

    test('handles AT-rich sequences', () => {
      const atRich = 'ATATATATAT';
      const dna = new DNA(atRich);
      expect(dna.getSequence()).toBe(atRich);
    });
  });
});
