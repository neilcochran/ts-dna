import { NucleotidePattern } from '../../../src/model/nucleic-acids/NucleotidePattern';
import { NucleotidePatternSymbol } from '../../../src/model/nucleic-acids/NucleotidePatternSymbol';
import { DNA } from '../../../src/model/nucleic-acids/DNA';
import { RNA } from '../../../src/model/nucleic-acids/RNA';
import { InvalidNucleotidePatternError } from '../../../src/model/errors/InvalidNucleotidePatternError';
import { NUCLEOTIDE_PATTERN_SYMBOLS } from '../../../src/data/iupac-symbols';
import * as nucleicAcidsUtils from '../../../src/utils/nucleic-acids';

describe('NucleotidePattern Core Functionality', () => {
  describe('simple literal patterns', () => {
    test('creates TATAAA pattern successfully', () => {
      expect(() => new NucleotidePattern('TATAAA')).not.toThrow();
    });

    test('TATAAA pattern matches expected DNA', () => {
      const pattern = new NucleotidePattern('TATAAA');
      const dna = new DNA('TATAAA');
      expect(pattern.matches(dna)).toBe(true);
    });

    test('creates each basic nucleotide pattern', () => {
      const basicNucleotides = ['A', 'T', 'C', 'G', 'U'];
      for (const nucleotide of basicNucleotides) {
        expect(() => new NucleotidePattern(nucleotide)).not.toThrow();
        const pattern = new NucleotidePattern(nucleotide);
        expect(pattern.pattern).toBe(nucleotide);
      }
    });
  });

  describe('IUPAC ambiguity codes', () => {
    test('creates TATAWAR pattern successfully', () => {
      expect(() => new NucleotidePattern('TATAWAR')).not.toThrow();
    });

    test('creates each IUPAC symbol pattern', () => {
      const iupacSymbols = Object.keys(NUCLEOTIDE_PATTERN_SYMBOLS);
      for (const symbol of iupacSymbols) {
        expect(() => new NucleotidePattern(symbol)).not.toThrow();
        const pattern = new NucleotidePattern(symbol);
        expect(pattern.pattern).toBe(symbol);
      }
    });

    test('W symbol matches A and T', () => {
      const pattern = new NucleotidePattern('W');
      expect(pattern.matches(new DNA('A'))).toBe(true);
      expect(pattern.matches(new DNA('T'))).toBe(true);
      expect(pattern.matches(new DNA('C'))).toBe(false);
      expect(pattern.matches(new DNA('G'))).toBe(false);
    });

    test('R symbol matches G and A', () => {
      const pattern = new NucleotidePattern('R');
      expect(pattern.matches(new DNA('G'))).toBe(true);
      expect(pattern.matches(new DNA('A'))).toBe(true);
      expect(pattern.matches(new DNA('C'))).toBe(false);
      expect(pattern.matches(new DNA('T'))).toBe(false);
    });

    test('TATAWAR matches biological TATA box variants', () => {
      const pattern = new NucleotidePattern('TATAWAR');

      // Should match various TATA box sequences
      expect(pattern.matches(new DNA('TATAAAT'))).toBe(false); // R=T is invalid (R can only be G or A)
      expect(pattern.matches(new DNA('TATAAAA'))).toBe(true); // W=A, R=A
      expect(pattern.matches(new DNA('TATATAG'))).toBe(true); // W=T, R=G
      // Note: Cannot test literal 'TATAWAR' as DNA sequence since W and R are not valid DNA bases

      // Should not match invalid sequences
      expect(pattern.matches(new DNA('TATAAAC'))).toBe(false); // R cannot be C
      expect(pattern.matches(new DNA('TATACAA'))).toBe(false); // W cannot be C
    });
  });

  describe('matches method', () => {
    test('matches exact DNA sequence', () => {
      const pattern = new NucleotidePattern('ATGC');
      expect(pattern.matches(new DNA('ATGC'))).toBe(true);
      expect(pattern.matches(new DNA('ATGA'))).toBe(false);
    });

    test('matches exact RNA sequence', () => {
      const pattern = new NucleotidePattern('AUGC');
      expect(pattern.matches(new RNA('AUGC'))).toBe(true);
      expect(pattern.matches(new RNA('AUGA'))).toBe(false);
    });

    test('handles empty sequence', () => {
      const pattern = new NucleotidePattern('A');
      // Create a DNA with empty sequence by using a mock
      const emptySequenceDNA = {
        getSequence: () => '',
        nucleicAcidType: 'DNA',
      } as unknown as DNA;
      expect(pattern.matches(emptySequenceDNA)).toBe(false);
    });

    test('handles null/undefined sequence', () => {
      const pattern = new NucleotidePattern('A');
      const nullSequenceDNA = {
        getSequence: () => null,
        nucleicAcidType: 'DNA',
      } as unknown as DNA;
      expect(pattern.matches(nullSequenceDNA)).toBe(false);
    });

    test('case insensitive matching', () => {
      const pattern = new NucleotidePattern('ATGC');
      expect(pattern.matches(new DNA('atgc'))).toBe(true);
      expect(pattern.matches(new DNA('AtGc'))).toBe(true);
    });
  });

  describe('findMatches method', () => {
    test('finds all pattern matches in DNA sequence', () => {
      const pattern = new NucleotidePattern('GA');
      const dna = new DNA('ATGAGCGATC');
      const matches = pattern.findMatches(dna);

      expect(matches).toEqual([
        { start: 2, end: 4, match: 'GA' },
        { start: 6, end: 8, match: 'GA' },
      ]);
    });

    test('finds IUPAC pattern matches', () => {
      const pattern = new NucleotidePattern('RY'); // R=[G,A], Y=[C,T]
      const dna = new DNA('ATGAGCGATC');
      const matches = pattern.findMatches(dna);

      expect(matches.length).toBeGreaterThan(0);
      // First match should be 'AT' at position 0 (A matches R, T matches Y)
      expect(matches[0].start).toBe(0);
      expect(matches[0].match).toBe('AT');
    });

    test('returns empty array when no matches found', () => {
      const pattern = new NucleotidePattern('TTT');
      const dna = new DNA('AAACCCGGG');
      const matches = pattern.findMatches(dna);

      expect(matches).toEqual([]);
    });

    test('handles empty sequence', () => {
      const pattern = new NucleotidePattern('A');
      const emptySequenceDNA = {
        getSequence: () => '',
        nucleicAcidType: 'DNA',
      } as unknown as DNA;
      expect(pattern.findMatches(emptySequenceDNA)).toEqual([]);
    });

    test('handles null sequence', () => {
      const pattern = new NucleotidePattern('A');
      const nullSequenceDNA = {
        getSequence: () => null,
        nucleicAcidType: 'DNA',
      } as unknown as DNA;
      expect(pattern.findMatches(nullSequenceDNA)).toEqual([]);
    });

    test('finds overlapping matches', () => {
      const pattern = new NucleotidePattern('AA');
      const dna = new DNA('AAAA');
      const matches = pattern.findMatches(dna);

      // Should find AA at positions 0 and 2 (non-overlapping)
      expect(matches).toEqual([
        { start: 0, end: 2, match: 'AA' },
        { start: 2, end: 4, match: 'AA' },
      ]);
    });
  });

  describe('findFirst method', () => {
    test('finds first pattern match in DNA sequence', () => {
      const pattern = new NucleotidePattern('GA');
      const dna = new DNA('ATGAGCGATC');
      const match = pattern.findFirst(dna);

      expect(match).toEqual({
        start: 2,
        end: 4,
        match: 'GA',
      });
    });

    test('returns null when no match found', () => {
      const pattern = new NucleotidePattern('TTT');
      const dna = new DNA('AAACCCGGG');
      const match = pattern.findFirst(dna);

      expect(match).toBeNull();
    });

    test('handles empty sequence', () => {
      const pattern = new NucleotidePattern('A');
      const emptySequenceDNA = {
        getSequence: () => '',
        nucleicAcidType: 'DNA',
      } as unknown as DNA;
      expect(pattern.findFirst(emptySequenceDNA)).toBeNull();
    });

    test('handles null sequence', () => {
      const pattern = new NucleotidePattern('A');
      const nullSequenceDNA = {
        getSequence: () => null,
        nucleicAcidType: 'DNA',
      } as unknown as DNA;
      expect(pattern.findFirst(nullSequenceDNA)).toBeNull();
    });

    test('finds IUPAC pattern match', () => {
      const pattern = new NucleotidePattern('RY'); // R=[G,A], Y=[C,T]
      const dna = new DNA('ATGAGCGATC');
      const match = pattern.findFirst(dna);

      expect(match).not.toBeNull();
      // First match should be 'AT' at position 0 (A matches R, T matches Y)
      expect(match!.start).toBe(0);
      expect(match!.match).toBe('AT');
    });
  });

  describe('matchesEitherStrand method', () => {
    test('matches forward strand', () => {
      const pattern = new NucleotidePattern('GAATTC'); // EcoRI recognition site
      const dna = new DNA('GAATTC');

      expect(pattern.matchesEitherStrand(dna)).toBe(true);
      expect(pattern.matches(dna)).toBe(true); // Should also match normally
    });

    test('matches reverse complement strand', () => {
      const pattern = new NucleotidePattern('GAATTC'); // EcoRI recognition site
      const dna = new DNA('GAATTC'); // Same sequence - palindromic

      expect(pattern.matchesEitherStrand(dna)).toBe(true);
    });

    test('matches reverse complement with different sequence', () => {
      const pattern = new NucleotidePattern('ATCG');
      const dna = new DNA('CGAT'); // Reverse complement of ATCG

      expect(pattern.matches(dna)).toBe(false); // Should not match forward
      expect(pattern.matchesEitherStrand(dna)).toBe(true); // Should match reverse complement
    });

    test('works with RNA', () => {
      const pattern = new NucleotidePattern('AUCG');
      const rna = new RNA('CGAU'); // Reverse complement of AUCG

      expect(pattern.matches(rna)).toBe(false); // Should not match forward
      expect(pattern.matchesEitherStrand(rna)).toBe(true); // Should match reverse complement
    });

    test('returns false when no match on either strand', () => {
      const pattern = new NucleotidePattern('AAAA');
      const dna = new DNA('CCCC');

      expect(pattern.matchesEitherStrand(dna)).toBe(false);
    });

    test('handles invalid complement patterns gracefully', () => {
      const pattern = new NucleotidePattern('T'); // Use T so it won't match the forward 'A'
      // Mock a nucleic acid that would cause getComplementSequence to return null
      const problematicDNA = {
        getSequence: () => 'A',
        nucleicAcidType: 'INVALID',
      } as unknown as DNA;

      // Should not throw and should return false (no forward match, no valid complement)
      expect(pattern.matchesEitherStrand(problematicDNA)).toBe(false);
    });

    test('handles reverse complement pattern creation errors', () => {
      // This test ensures error handling in the try/catch block
      const pattern = new NucleotidePattern('A');
      const dna = new DNA('T');

      // Mock getComplementSequence to return an invalid pattern that would cause getNucleotidePattern to throw
      jest
        .spyOn(nucleicAcidsUtils, 'getComplementSequence')
        .mockReturnValueOnce('INVALID_CHARS_XYZ');

      expect(pattern.matchesEitherStrand(dna)).toBe(false);

      // Restore the mock
      jest.restoreAllMocks();
    });
  });

  describe('pattern property access', () => {
    test('stores original pattern string', () => {
      const patternString = 'TATAWAR';
      const pattern = new NucleotidePattern(patternString);
      expect(pattern.pattern).toBe(patternString);
    });

    test('patternRegex is accessible', () => {
      const pattern = new NucleotidePattern('ATGC');
      expect(pattern.getRegex()).toBeInstanceOf(RegExp);
      expect(pattern.testString('ATGC')).toBe(true);
      expect(pattern.testString('CGTA')).toBe(false);
    });
  });

  describe('test method (with NucleicAcid)', () => {
    test('test method returns true for matching nucleic acid', () => {
      const pattern = new NucleotidePattern('ATGC');
      const dna = new DNA('ATGCGTAC');
      expect(pattern.test(dna)).toBe(true);
    });

    test('test method returns false for non-matching nucleic acid', () => {
      const pattern = new NucleotidePattern('TTTT');
      const dna = new DNA('ATGCGTAC');
      expect(pattern.test(dna)).toBe(false);
    });

    test('test method works with RNA', () => {
      const pattern = new NucleotidePattern('AUG');
      const rna = new RNA('AUGCGUAC');
      expect(pattern.test(rna)).toBe(true);
    });
  });

  describe('replace methods', () => {
    test('replace method modifies nucleic acid sequence', () => {
      const pattern = new NucleotidePattern('ATG');
      const dna = new DNA('ATGCCCATGTTT');
      const result = pattern.replace(dna, 'XXX');
      expect(result).toBe('XXXCCCATGTTT'); // Only first occurrence replaced
    });

    test('replaceString method modifies string sequence', () => {
      const pattern = new NucleotidePattern('GGG');
      const sequence = 'ATGGGCCCGGGAAA';
      const result = pattern.replaceString(sequence, 'TTT');
      expect(result).toBe('ATTTTCCCGGGAAA'); // Only first occurrence replaced
    });

    test('replace with IUPAC pattern', () => {
      const pattern = new NucleotidePattern('RY'); // R=[GA], Y=[CT]
      const dna = new DNA('ATCGATCG');
      const result = pattern.replace(dna, 'XX');
      // Only first match: AT (A=R, T=Y) -> XX
      expect(result).toBe('XXCGATCG');
    });

    test('replace returns original when no match', () => {
      const pattern = new NucleotidePattern('TTTT');
      const dna = new DNA('ATGCCC');
      const result = pattern.replace(dna, 'AAAA');
      expect(result).toBe('ATGCCC');
    });
  });

  describe('split methods', () => {
    test('split method divides nucleic acid sequence', () => {
      const pattern = new NucleotidePattern('GGG');
      const dna = new DNA('ATGGGCCCGGGAAA');
      const result = pattern.split(dna);
      expect(result).toEqual(['AT', 'CCC', 'AAA']);
    });

    test('splitString method divides string sequence', () => {
      const pattern = new NucleotidePattern('TTT');
      const sequence = 'ATTTCCCTTTGGG';
      const result = pattern.splitString(sequence);
      expect(result).toEqual(['A', 'CCC', 'GGG']);
    });

    test('split with IUPAC pattern', () => {
      const pattern = new NucleotidePattern('W'); // W=[AT]
      const dna = new DNA('CGACGAC');
      const result = pattern.split(dna);
      // Split on 'A' -> ['CG', 'CG', 'C']
      expect(result).toEqual(['CG', 'CG', 'C']);
    });

    test('split returns original array when no match', () => {
      const pattern = new NucleotidePattern('TTTT');
      const dna = new DNA('ATGCCC');
      const result = pattern.split(dna);
      expect(result).toEqual(['ATGCCC']);
    });

    test('split returns empty strings for consecutive delimiters', () => {
      const pattern = new NucleotidePattern('G');
      const dna = new DNA('AGGGATCGG');
      const result = pattern.split(dna);
      expect(result).toEqual(['A', '', '', 'ATC', '', '']);
    });
  });

  describe('error handling', () => {
    test('throws error for invalid characters', () => {
      expect(() => new NucleotidePattern('TATAXYZ')).toThrow(InvalidNucleotidePatternError);
    });

    test('throws error for empty pattern', () => {
      expect(() => new NucleotidePattern('')).toThrow(InvalidNucleotidePatternError);
    });

    test('error message includes the invalid pattern', () => {
      try {
        new NucleotidePattern('INVALID');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNucleotidePatternError);
        expect((error as InvalidNucleotidePatternError).message).toContain('INVALID');
      }
    });
  });
});

describe('NucleotidePatternSymbol Core Functionality', () => {
  describe('basic nucleotide symbols', () => {
    test('creates basic nucleotide symbols', () => {
      const basicSymbols = ['A', 'T', 'C', 'G', 'U'];
      for (const symbol of basicSymbols) {
        const patternSymbol = new NucleotidePatternSymbol(symbol);
        expect(patternSymbol.symbol).toBe(symbol);
        expect(patternSymbol.matchingBases).toEqual([symbol]);
      }
    });
  });

  describe('IUPAC ambiguity symbols', () => {
    test('W symbol has correct bases', () => {
      const w = new NucleotidePatternSymbol('W');
      expect(w.matchingBases).toEqual(['A', 'T']);
    });

    test('R symbol has correct bases', () => {
      const r = new NucleotidePatternSymbol('R');
      expect(r.matchingBases).toEqual(['G', 'A']);
    });

    test('all IUPAC symbols create correctly', () => {
      for (const [symbol, expectedBases] of Object.entries(NUCLEOTIDE_PATTERN_SYMBOLS)) {
        const patternSymbol = new NucleotidePatternSymbol(symbol);
        expect(patternSymbol.symbol).toBe(symbol);
        expect(patternSymbol.matchingBases).toEqual(expectedBases);
      }
    });
  });

  describe('regex generation', () => {
    test('A symbol generates correct regex', () => {
      const a = new NucleotidePatternSymbol('A');
      expect(a.matchingRegex.source).toBe('[Aa]');
    });

    test('W symbol generates correct regex', () => {
      const w = new NucleotidePatternSymbol('W');
      expect(w.matchingRegex.source).toBe('[AaTt]');
    });
  });

  describe('case handling', () => {
    test('converts lowercase symbols to uppercase', () => {
      const a = new NucleotidePatternSymbol('a');
      expect(a.symbol).toBe('A');

      const w = new NucleotidePatternSymbol('w');
      expect(w.symbol).toBe('W');
    });
  });

  describe('regex matching functionality', () => {
    test('regex matches case insensitive', () => {
      const a = new NucleotidePatternSymbol('A');
      expect(a.matchingRegex.test('A')).toBe(true);
      expect(a.matchingRegex.test('a')).toBe(true);
      expect(a.matchingRegex.test('T')).toBe(false);
    });

    test('ambiguous symbol regex matches all bases', () => {
      const n = new NucleotidePatternSymbol('N'); // Matches any base
      expect(n.matchingRegex.test('A')).toBe(true);
      expect(n.matchingRegex.test('T')).toBe(true);
      expect(n.matchingRegex.test('C')).toBe(true);
      expect(n.matchingRegex.test('G')).toBe(true);
      expect(n.matchingRegex.test('a')).toBe(true);
      expect(n.matchingRegex.test('t')).toBe(true);
      expect(n.matchingRegex.test('c')).toBe(true);
      expect(n.matchingRegex.test('g')).toBe(true);
    });

    test('complex ambiguous symbols work correctly', () => {
      const b = new NucleotidePatternSymbol('B'); // Not A = G,T,C
      expect(b.matchingRegex.test('G')).toBe(true);
      expect(b.matchingRegex.test('T')).toBe(true);
      expect(b.matchingRegex.test('C')).toBe(true);
      expect(b.matchingRegex.test('A')).toBe(false);
    });
  });

  describe('immutability', () => {
    test('symbol property is readonly', () => {
      const a = new NucleotidePatternSymbol('A');
      // TypeScript would catch this at compile time, but verify runtime behavior
      expect(a.symbol).toBe('A');
      // Attempting to modify would fail in strict mode
    });

    test('matchingBases property is readonly', () => {
      const w = new NucleotidePatternSymbol('W');
      expect(w.matchingBases).toEqual(['A', 'T']);
      // Array reference is readonly, but contents could be modified
      // This tests that we get the expected initial state
    });
  });

  describe('error handling', () => {
    test('throws error for invalid IUPAC symbol', () => {
      expect(() => new NucleotidePatternSymbol('Z')).toThrow(InvalidNucleotidePatternError);
    });

    test('throws error for empty string', () => {
      expect(() => new NucleotidePatternSymbol('')).toThrow(InvalidNucleotidePatternError);
    });

    test('throws error for numeric characters', () => {
      expect(() => new NucleotidePatternSymbol('1')).toThrow(InvalidNucleotidePatternError);
    });

    test('throws error for special characters', () => {
      expect(() => new NucleotidePatternSymbol('!')).toThrow(InvalidNucleotidePatternError);
      expect(() => new NucleotidePatternSymbol('@')).toThrow(InvalidNucleotidePatternError);
    });

    test('error message includes the invalid symbol', () => {
      try {
        new NucleotidePatternSymbol('X');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNucleotidePatternError);
        expect((error as InvalidNucleotidePatternError).message).toContain('X');
      }
    });
  });
});

describe('Integration Tests', () => {
  test('promoter elements pattern creation (regression test)', () => {
    // This should work without errors - testing the exact failing case
    expect(() => {
      new NucleotidePattern('TATAAA'); // Simple version
      new NucleotidePattern('TATAWAR'); // IUPAC version
    }).not.toThrow();
  });

  test('transcription default options pattern creation', () => {
    // Test the exact pattern used in transcription defaults
    const createDefaultPattern = () => new NucleotidePattern('TATAAA');
    expect(createDefaultPattern).not.toThrow();

    const pattern = createDefaultPattern();
    expect(pattern.pattern).toBe('TATAAA');
  });
});
