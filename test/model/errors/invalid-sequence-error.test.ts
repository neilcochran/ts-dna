import { InvalidSequenceError } from '../../../src/model/errors/InvalidSequenceError';
import { NucleicAcidType } from '../../../src/enums/nucleic-acid-type';

describe('InvalidSequenceError', () => {
  describe('constructor', () => {
    test('creates error with message, sequence, and nucleic acid type', () => {
      const message = 'Invalid nucleotide X found';
      const sequence = 'ATCXG';
      const type = NucleicAcidType.DNA;

      const error = new InvalidSequenceError(message, sequence, type);

      expect(error.message).toBe(message);
      expect(error.sequence).toBe(sequence);
      expect(error.nucleicAcidType).toBe(type);
    });

    test('extends Error class', () => {
      const error = new InvalidSequenceError('test', 'ATCX', NucleicAcidType.DNA);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InvalidSequenceError);
    });

    test('sets error name correctly', () => {
      const error = new InvalidSequenceError('test', 'ATCX', NucleicAcidType.DNA);

      expect(error.name).toBe('Error'); // Default from Error class
    });

    test('preserves stack trace', () => {
      const error = new InvalidSequenceError('test', 'ATCX', NucleicAcidType.DNA);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('invalid-sequence-error');
    });
  });

  describe('properties', () => {
    test('sequence property is readonly', () => {
      const error = new InvalidSequenceError('test', 'ATCX', NucleicAcidType.DNA);

      expect(error.sequence).toBe('ATCX');
      // TypeScript prevents modification at compile time
    });

    test('nucleicAcidType property is readonly', () => {
      const error = new InvalidSequenceError('test', 'ATCX', NucleicAcidType.RNA);

      expect(error.nucleicAcidType).toBe(NucleicAcidType.RNA);
      // TypeScript prevents modification at compile time
    });

    test('preserves original message', () => {
      const message = 'Complex error message with details';
      const error = new InvalidSequenceError(message, 'ATCX', NucleicAcidType.DNA);

      expect(error.message).toBe(message);
    });
  });

  describe('DNA sequence errors', () => {
    test('handles invalid DNA nucleotides', () => {
      const error = new InvalidSequenceError(
        'Invalid nucleotide U found in DNA sequence',
        'AUCG',
        NucleicAcidType.DNA,
      );

      expect(error.sequence).toBe('AUCG');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.DNA);
      expect(error.message).toContain('Invalid nucleotide U');
    });

    test('handles empty DNA sequence', () => {
      const error = new InvalidSequenceError(
        'DNA sequence cannot be empty',
        '',
        NucleicAcidType.DNA,
      );

      expect(error.sequence).toBe('');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.DNA);
    });

    test('handles special characters in DNA', () => {
      const error = new InvalidSequenceError(
        'Invalid character - found in DNA sequence',
        'ATC-G',
        NucleicAcidType.DNA,
      );

      expect(error.sequence).toBe('ATC-G');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.DNA);
    });

    test('handles numbers in DNA sequence', () => {
      const error = new InvalidSequenceError(
        'Invalid character 1 found in DNA sequence',
        'ATC1G',
        NucleicAcidType.DNA,
      );

      expect(error.sequence).toBe('ATC1G');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.DNA);
    });
  });

  describe('RNA sequence errors', () => {
    test('handles invalid RNA nucleotides', () => {
      const error = new InvalidSequenceError(
        'Invalid nucleotide T found in RNA sequence',
        'ATCG',
        NucleicAcidType.RNA,
      );

      expect(error.sequence).toBe('ATCG');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.RNA);
      expect(error.message).toContain('Invalid nucleotide T');
    });

    test('handles empty RNA sequence', () => {
      const error = new InvalidSequenceError(
        'RNA sequence cannot be empty',
        '',
        NucleicAcidType.RNA,
      );

      expect(error.sequence).toBe('');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.RNA);
    });

    test('handles special characters in RNA', () => {
      const error = new InvalidSequenceError(
        'Invalid character . found in RNA sequence',
        'AUC.G',
        NucleicAcidType.RNA,
      );

      expect(error.sequence).toBe('AUC.G');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.RNA);
    });

    test('handles whitespace in RNA sequence', () => {
      const error = new InvalidSequenceError(
        'Invalid character   found in RNA sequence',
        'AUC G',
        NucleicAcidType.RNA,
      );

      expect(error.sequence).toBe('AUC G');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.RNA);
    });
  });

  describe('edge cases', () => {
    test('handles very long sequences', () => {
      const longSequence = 'A'.repeat(1000) + 'X' + 'T'.repeat(1000);
      const error = new InvalidSequenceError(
        'Invalid nucleotide found',
        longSequence,
        NucleicAcidType.DNA,
      );

      expect(error.sequence).toBe(longSequence);
      expect(error.sequence).toHaveLength(2001);
    });

    test('handles single invalid character', () => {
      const error = new InvalidSequenceError('Invalid nucleotide', 'X', NucleicAcidType.DNA);

      expect(error.sequence).toBe('X');
      expect(error.sequence).toHaveLength(1);
    });

    test('handles unicode characters', () => {
      const error = new InvalidSequenceError(
        'Invalid unicode character found',
        'ATC🧬G',
        NucleicAcidType.DNA,
      );

      expect(error.sequence).toBe('ATC🧬G');
      expect(error.nucleicAcidType).toBe(NucleicAcidType.DNA);
    });

    test('handles mixed case errors', () => {
      const error = new InvalidSequenceError(
        'Mixed case with invalid character',
        'AtCxG',
        NucleicAcidType.DNA,
      );

      expect(error.sequence).toBe('AtCxG');
    });
  });

  describe('error message handling', () => {
    test('handles empty error message', () => {
      const error = new InvalidSequenceError('', 'ATCX', NucleicAcidType.DNA);

      expect(error.message).toBe('');
      expect(error.sequence).toBe('ATCX');
    });

    test('handles complex error messages', () => {
      const complexMessage =
        'Invalid nucleotide "X" found at position 3 in sequence "ATCX". DNA sequences can only contain A, T, C, G nucleotides.';
      const error = new InvalidSequenceError(complexMessage, 'ATCX', NucleicAcidType.DNA);

      expect(error.message).toBe(complexMessage);
      expect(error.message).toContain('position 3');
      expect(error.message).toContain('A, T, C, G');
    });

    test('handles multiline error messages', () => {
      const multilineMessage = `Invalid sequence detected:
            Sequence: ATCX
            Invalid character: X
            Position: 3`;
      const error = new InvalidSequenceError(multilineMessage, 'ATCX', NucleicAcidType.DNA);

      expect(error.message).toBe(multilineMessage);
      expect(error.message).toContain('\n');
    });
  });

  describe('type differentiation', () => {
    test('distinguishes between DNA and RNA errors', () => {
      const dnaError = new InvalidSequenceError('DNA error', 'AUCG', NucleicAcidType.DNA);
      const rnaError = new InvalidSequenceError('RNA error', 'ATCG', NucleicAcidType.RNA);

      expect(dnaError.nucleicAcidType).toBe(NucleicAcidType.DNA);
      expect(rnaError.nucleicAcidType).toBe(NucleicAcidType.RNA);
      expect(dnaError.nucleicAcidType).not.toBe(rnaError.nucleicAcidType);
    });

    test('same sequence different types', () => {
      const sequence = 'ATCG';
      const dnaError = new InvalidSequenceError('DNA context', sequence, NucleicAcidType.DNA);
      const rnaError = new InvalidSequenceError('RNA context', sequence, NucleicAcidType.RNA);

      expect(dnaError.sequence).toBe(rnaError.sequence);
      expect(dnaError.nucleicAcidType).not.toBe(rnaError.nucleicAcidType);
    });
  });

  describe('serialization and inspection', () => {
    test('can be stringified', () => {
      const error = new InvalidSequenceError('Test error', 'ATCX', NucleicAcidType.DNA);
      const stringified = error.toString();

      expect(stringified).toContain('Error: Test error');
    });

    test('preserves all properties', () => {
      const error = new InvalidSequenceError('Test error', 'ATCX', NucleicAcidType.DNA);

      const properties = Object.getOwnPropertyNames(error);
      expect(properties).toContain('sequence');
      expect(properties).toContain('nucleicAcidType');
      expect(properties).toContain('message');
    });

    test('properties are enumerable', () => {
      const error = new InvalidSequenceError('Test error', 'ATCX', NucleicAcidType.DNA);

      const enumerable = Object.keys(error);
      expect(enumerable).toContain('sequence');
      expect(enumerable).toContain('nucleicAcidType');
    });
  });

  describe('error catching and handling', () => {
    test('can be caught as Error', () => {
      try {
        throw new InvalidSequenceError('Test', 'ATCX', NucleicAcidType.DNA);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(InvalidSequenceError);
      }
    });

    test('can be caught and type checked', () => {
      try {
        throw new InvalidSequenceError('Test', 'ATCX', NucleicAcidType.DNA);
      } catch (error) {
        if (error instanceof InvalidSequenceError) {
          expect(error.sequence).toBe('ATCX');
          expect(error.nucleicAcidType).toBe(NucleicAcidType.DNA);
        } else {
          fail('Expected InvalidSequenceError');
        }
      }
    });

    test('maintains type information when thrown', () => {
      const throwAndCatch = () => {
        try {
          throw new InvalidSequenceError('Test', 'ATCX', NucleicAcidType.DNA);
        } catch (error) {
          return error;
        }
      };

      const caught = throwAndCatch();
      expect(caught).toBeInstanceOf(InvalidSequenceError);
      if (caught instanceof InvalidSequenceError) {
        expect(caught.sequence).toBe('ATCX');
        expect(caught.nucleicAcidType).toBe(NucleicAcidType.DNA);
      }
    });
  });
});
