import { NucleotidePatternSymbol, NUCLEOTIDE_PATTERN_SYMBOLS } from '../../src/pattern';
import { InvalidNucleotidePatternError } from '../../src/model/errors/InvalidNucleotidePatternError';

describe('NucleotidePatternSymbol', () => {
  describe('construction', () => {
    test('accepts every IUPAC symbol and exposes its matching bases', () => {
      for (const [symbol, expectedBases] of Object.entries(NUCLEOTIDE_PATTERN_SYMBOLS)) {
        const instance = new NucleotidePatternSymbol(symbol);
        expect(instance.symbol).toBe(symbol);
        expect(instance.matchingBases).toEqual(expectedBases);
      }
    });

    test('normalizes lowercase input to uppercase', () => {
      expect(new NucleotidePatternSymbol('a').symbol).toBe('A');
      expect(new NucleotidePatternSymbol('w').symbol).toBe('W');
      expect(new NucleotidePatternSymbol('n').symbol).toBe('N');
    });

    test('throws InvalidNucleotidePatternError on empty input', () => {
      expect(() => new NucleotidePatternSymbol('')).toThrow(InvalidNucleotidePatternError);
    });

    test('throws InvalidNucleotidePatternError on non-IUPAC characters', () => {
      expect(() => new NucleotidePatternSymbol('Z')).toThrow(InvalidNucleotidePatternError);
      expect(() => new NucleotidePatternSymbol('1')).toThrow(InvalidNucleotidePatternError);
      expect(() => new NucleotidePatternSymbol('!')).toThrow(InvalidNucleotidePatternError);
    });

    test('error message names the offending symbol', () => {
      try {
        new NucleotidePatternSymbol('X');
        fail('Expected NucleotidePatternSymbol to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNucleotidePatternError);
        expect((error as InvalidNucleotidePatternError).message).toContain('X');
      }
    });
  });

  describe('matchingRegex', () => {
    test('A symbol regex matches a/A only', () => {
      const symbol = new NucleotidePatternSymbol('A');
      expect(symbol.matchingRegex.source).toBe('[Aa]');
      expect(symbol.matchingRegex.test('A')).toBe(true);
      expect(symbol.matchingRegex.test('a')).toBe(true);
      expect(symbol.matchingRegex.test('T')).toBe(false);
    });

    test('W ambiguity matches A or T (case-insensitive)', () => {
      const symbol = new NucleotidePatternSymbol('W');
      expect(symbol.matchingRegex.source).toBe('[AaTt]');
      expect(symbol.matchingRegex.test('A')).toBe(true);
      expect(symbol.matchingRegex.test('T')).toBe(true);
      expect(symbol.matchingRegex.test('t')).toBe(true);
      expect(symbol.matchingRegex.test('C')).toBe(false);
    });

    test('N ambiguity matches every concrete base', () => {
      const symbol = new NucleotidePatternSymbol('N');
      for (const base of ['A', 'C', 'G', 'T', 'a', 'c', 'g', 't']) {
        expect(symbol.matchingRegex.test(base)).toBe(true);
      }
    });

    test('B ambiguity excludes A', () => {
      const symbol = new NucleotidePatternSymbol('B');
      expect(symbol.matchingRegex.test('G')).toBe(true);
      expect(symbol.matchingRegex.test('T')).toBe(true);
      expect(symbol.matchingRegex.test('C')).toBe(true);
      expect(symbol.matchingRegex.test('A')).toBe(false);
    });
  });
});
