import { NucleotidePattern, NUCLEOTIDE_PATTERN_SYMBOLS } from '../../src/pattern';
import { DNA, RNA } from '../../src/sequence';
import { InvalidNucleotidePatternError } from '../../src/model/errors/InvalidNucleotidePatternError';

describe('NucleotidePattern', () => {
  describe('construction', () => {
    test('accepts each basic literal nucleotide', () => {
      for (const nucleotide of ['A', 'T', 'C', 'G', 'U']) {
        expect(() => new NucleotidePattern(nucleotide)).not.toThrow();
      }
    });

    test('accepts every IUPAC ambiguity symbol', () => {
      for (const symbol of Object.keys(NUCLEOTIDE_PATTERN_SYMBOLS)) {
        const pattern = new NucleotidePattern(symbol);
        expect(pattern.pattern).toBe(symbol);
      }
    });

    test('accepts compound patterns mixing literals and ambiguity codes', () => {
      expect(() => new NucleotidePattern('TATAWAR')).not.toThrow();
      expect(() => new NucleotidePattern('CANNTG')).not.toThrow();
      expect(() => new NucleotidePattern('RGWYV')).not.toThrow();
    });

    test('accepts regex meta-characters and quantifiers', () => {
      expect(() => new NucleotidePattern('ATGN{3}GCC')).not.toThrow();
      expect(() => new NucleotidePattern('[AU]{2,}')).not.toThrow();
      expect(() => new NucleotidePattern('GU{2,}[ACGU]{0,3}U{2,}')).not.toThrow();
    });

    test('stores the original pattern string verbatim', () => {
      const pattern = new NucleotidePattern('TATAWAR');
      expect(pattern.pattern).toBe('TATAWAR');
    });

    test('throws InvalidNucleotidePatternError on empty pattern', () => {
      expect(() => new NucleotidePattern('')).toThrow(InvalidNucleotidePatternError);
    });

    test('throws InvalidNucleotidePatternError on non-IUPAC alpha character', () => {
      expect(() => new NucleotidePattern('TATAXYZ')).toThrow(InvalidNucleotidePatternError);
    });

    test('throws InvalidNucleotidePatternError on regex that fails to compile', () => {
      // Unbalanced character-class bracket - alpha chars valid, but the resulting regex is malformed
      expect(() => new NucleotidePattern('A[')).toThrow(InvalidNucleotidePatternError);
    });

    test('error message identifies the invalid character', () => {
      try {
        new NucleotidePattern('INVALID');
        fail('Expected NucleotidePattern to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNucleotidePatternError);
        expect((error as InvalidNucleotidePatternError).message).toContain('I');
      }
    });
  });

  describe('matches', () => {
    test('matches a literal DNA pattern against an exact sequence', () => {
      const pattern = new NucleotidePattern('ATGC');
      expect(pattern.matches(new DNA('ATGC'))).toBe(true);
      expect(pattern.matches(new DNA('ATGA'))).toBe(false);
    });

    test('matches a literal RNA pattern against an exact sequence', () => {
      const pattern = new NucleotidePattern('AUGC');
      expect(pattern.matches(new RNA('AUGC'))).toBe(true);
      expect(pattern.matches(new RNA('AUGA'))).toBe(false);
    });

    test('matches anywhere within the sequence (substring match)', () => {
      const pattern = new NucleotidePattern('TATA');
      expect(pattern.matches(new DNA('GCATATAGC'))).toBe(true);
      expect(pattern.matches(new DNA('GCGCGCGC'))).toBe(false);
    });

    test('matches case-insensitively', () => {
      const pattern = new NucleotidePattern('ATGC');
      expect(pattern.matches(new DNA('atgc'))).toBe(true);
      expect(pattern.matches(new DNA('AtGc'))).toBe(true);
    });

    test('W ambiguity matches A or T', () => {
      const pattern = new NucleotidePattern('W');
      expect(pattern.matches(new DNA('A'))).toBe(true);
      expect(pattern.matches(new DNA('T'))).toBe(true);
      expect(pattern.matches(new DNA('C'))).toBe(false);
    });

    test('TATAWAR matches biological TATA box variants', () => {
      const pattern = new NucleotidePattern('TATAWAR');
      expect(pattern.matches(new DNA('TATAAAA'))).toBe(true);
      expect(pattern.matches(new DNA('TATATAG'))).toBe(true);
      expect(pattern.matches(new DNA('TATAAAC'))).toBe(false);
      expect(pattern.matches(new DNA('TATACAA'))).toBe(false);
    });

    test('repeated invocations are stateless (no g-flag leak)', () => {
      const pattern = new NucleotidePattern('GA');
      const dna = new DNA('GAGA');
      expect(pattern.matches(dna)).toBe(true);
      expect(pattern.matches(dna)).toBe(true);
      expect(pattern.matches(dna)).toBe(true);
    });
  });

  describe('findAll', () => {
    test('returns every match with start, end, and matched substring', () => {
      const pattern = new NucleotidePattern('GA');
      const matches = pattern.findAll(new DNA('ATGAGCGATC'));
      expect(matches).toEqual([
        { start: 2, end: 4, matched: 'GA' },
        { start: 6, end: 8, matched: 'GA' },
      ]);
    });

    test('returns frozen array', () => {
      const pattern = new NucleotidePattern('A');
      const matches = pattern.findAll(new DNA('AAAA'));
      expect(Object.isFrozen(matches)).toBe(true);
    });

    test('respects IUPAC ambiguity in the pattern', () => {
      const pattern = new NucleotidePattern('RY');
      const matches = pattern.findAll(new DNA('ATGAGCGATC'));
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toEqual({ start: 0, end: 2, matched: 'AT' });
    });

    test('returns empty array when no matches', () => {
      const pattern = new NucleotidePattern('TTT');
      expect(pattern.findAll(new DNA('AAACCCGGG'))).toEqual([]);
    });

    test('finds non-overlapping matches of repeating motif', () => {
      const pattern = new NucleotidePattern('AA');
      const matches = pattern.findAll(new DNA('AAAA'));
      expect(matches).toEqual([
        { start: 0, end: 2, matched: 'AA' },
        { start: 2, end: 4, matched: 'AA' },
      ]);
    });

    test('repeated invocations return consistent results', () => {
      const pattern = new NucleotidePattern('GA');
      const dna = new DNA('GAGAGA');
      const first = pattern.findAll(dna);
      const second = pattern.findAll(dna);
      expect(first).toEqual(second);
    });
  });

  describe('findFirst', () => {
    test('returns the first match', () => {
      const pattern = new NucleotidePattern('GA');
      const match = pattern.findFirst(new DNA('ATGAGCGATC'));
      expect(match).toEqual({ start: 2, end: 4, matched: 'GA' });
    });

    test('returns undefined when no match', () => {
      const pattern = new NucleotidePattern('TTT');
      expect(pattern.findFirst(new DNA('AAACCCGGG'))).toBeUndefined();
    });

    test('respects IUPAC ambiguity', () => {
      const pattern = new NucleotidePattern('RY');
      const match = pattern.findFirst(new DNA('ATGAGCGATC'));
      expect(match).toBeDefined();
      expect(match?.start).toBe(0);
      expect(match?.matched).toBe('AT');
    });
  });

  describe('matchesEitherStrand', () => {
    test('matches the forward strand', () => {
      const pattern = new NucleotidePattern('GAATTC');
      expect(pattern.matchesEitherStrand(new DNA('GAATTC'))).toBe(true);
    });

    test('matches the reverse-complement strand of an asymmetric pattern', () => {
      const pattern = new NucleotidePattern('ATCG');
      expect(pattern.matches(new DNA('CGAT'))).toBe(false);
      expect(pattern.matchesEitherStrand(new DNA('CGAT'))).toBe(true);
    });

    test('palindromic restriction site matches itself on both strands', () => {
      const ecoRI = new NucleotidePattern('GAATTC');
      expect(ecoRI.matchesEitherStrand(new DNA('GAATTC'))).toBe(true);
    });

    test('returns false when neither strand matches', () => {
      const pattern = new NucleotidePattern('AAAA');
      expect(pattern.matchesEitherStrand(new DNA('CCCC'))).toBe(false);
    });

    test('handles IUPAC ambiguity in patterns', () => {
      // Reverse complement of RY is RY (R -> Y -> Y reversed gives... R, Y -> R, reversed -> RY)
      // Actually: complement(R) = Y, complement(Y) = R. RY -> YR -> reversed -> RY (palindrome).
      const pattern = new NucleotidePattern('RY');
      expect(pattern.matchesEitherStrand(new DNA('AT'))).toBe(true);
    });

    test('returns false when the reverse-complement string is not a valid regex', () => {
      // Pattern 'A+' -> complement 'T+' -> reverse '+T' is malformed regex
      const pattern = new NucleotidePattern('A+');
      expect(pattern.matchesEitherStrand(new DNA('CCC'))).toBe(false);
    });
  });

  describe('complement', () => {
    test('complements literal bases', () => {
      expect(new NucleotidePattern('ATCG').complement().pattern).toBe('TAGC');
    });

    test('complements IUPAC ambiguity codes via base-set lookup', () => {
      expect(new NucleotidePattern('R').complement().pattern).toBe('Y');
      expect(new NucleotidePattern('Y').complement().pattern).toBe('R');
      expect(new NucleotidePattern('K').complement().pattern).toBe('M');
      expect(new NucleotidePattern('M').complement().pattern).toBe('K');
      expect(new NucleotidePattern('S').complement().pattern).toBe('S');
      expect(new NucleotidePattern('W').complement().pattern).toBe('W');
      expect(new NucleotidePattern('B').complement().pattern).toBe('V');
      expect(new NucleotidePattern('V').complement().pattern).toBe('B');
      expect(new NucleotidePattern('D').complement().pattern).toBe('H');
      expect(new NucleotidePattern('H').complement().pattern).toBe('D');
      expect(new NucleotidePattern('N').complement().pattern).toBe('N');
    });

    test('U complements to A (DNA-favoring convention)', () => {
      expect(new NucleotidePattern('U').complement().pattern).toBe('A');
    });

    test('preserves regex meta-characters', () => {
      expect(new NucleotidePattern('A{3}').complement().pattern).toBe('T{3}');
    });

    test('complemented pattern matches the complement sequence', () => {
      const original = new NucleotidePattern('ATCG');
      const complement = original.complement();
      expect(complement.matches(new DNA('TAGC'))).toBe(true);
      expect(original.matches(new DNA('TAGC'))).toBe(false);
    });
  });

  describe('reverseComplement', () => {
    test('reverse-complements a simple asymmetric pattern', () => {
      expect(new NucleotidePattern('ATCG').reverseComplement().pattern).toBe('CGAT');
    });

    test('palindromic patterns round-trip to themselves', () => {
      // EcoRI is palindromic: GAATTC -> complement CTTAAG -> reverse GAATTC
      expect(new NucleotidePattern('GAATTC').reverseComplement().pattern).toBe('GAATTC');
    });

    test('reverse-complements IUPAC ambiguity codes', () => {
      // RYK -> complement YRM -> reverse MRY
      expect(new NucleotidePattern('RYK').reverseComplement().pattern).toBe('MRY');
    });

    test('reverse-complemented pattern matches the reverse complement sequence', () => {
      const original = new NucleotidePattern('ATCG');
      const rc = original.reverseComplement();
      expect(rc.matches(new DNA('CGAT'))).toBe(true);
      expect(original.matches(new DNA('CGAT'))).toBe(false);
    });

    test('reverse-complement on simple literal patterns is involutive', () => {
      const patternStrings = ['A', 'T', 'CG', 'ATCG', 'GAATTC'];
      for (const str of patternStrings) {
        const pattern = new NucleotidePattern(str);
        const doubleRC = pattern.reverseComplement().reverseComplement();
        expect(doubleRC.pattern).toBe(pattern.pattern);
      }
    });
  });

  describe('biological regression cases', () => {
    test('TATA box construction (regression for prior init bug)', () => {
      expect(() => new NucleotidePattern('TATAAA')).not.toThrow();
      expect(() => new NucleotidePattern('TATAWAR')).not.toThrow();
    });

    test('canonical poly-A signal AATAAA matches DNA termini', () => {
      const polyA = new NucleotidePattern('AATAAA');
      const dna = new DNA('ATGAAACCCAATAAACCCGGGAAATAA');
      expect(polyA.matches(dna)).toBe(true);
      const match = polyA.findFirst(dna);
      expect(match?.start).toBe(9);
      expect(match?.matched).toBe('AATAAA');
    });

    test('EcoRI site is palindromic at both reverse-complement and matchesEitherStrand', () => {
      const ecoRI = new NucleotidePattern('GAATTC');
      expect(ecoRI.reverseComplement().pattern).toBe('GAATTC');
      expect(ecoRI.matchesEitherStrand(new DNA('GAATTC'))).toBe(true);
    });
  });
});
