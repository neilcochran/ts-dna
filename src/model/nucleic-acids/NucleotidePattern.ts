import { DNA, RNA, complementDNABase, complementRNABase } from '../../sequence/index.js';
import { InvalidNucleotidePatternError } from '../errors/InvalidNucleotidePatternError.js';
import {
  NucleotidePatternSymbol,
  getNucleotidePatternSymbolComplement,
} from './NucleotidePatternSymbol.js';

/**
 * A class to represent patterns comprised of nucleotide IUPAC notation symbols.
 * The constructor enforces validation, and all members are readonly. Therefor, all NucleotidePattern
 * objects can only exist in a valid state.
 *
 * @see {@link NucleotidePatternSymbol}
 *
 * @see {@link https://en.wikipedia.org/wiki/Nucleic_acid_notation#IUPAC_notation|More info on IUPAC notation}
 */
export class NucleotidePattern {
  private readonly patternRegex: RegExp;
  public readonly pattern: string;

  /**
   * @param pattern - A nonempty regex string containing only nucleotide IUPAC notation symbols and valid regex symbols/operators
   *
   * @throws {@link InvalidNucleotidePatternError}
   * Thrown if the pattern is empty, or contains invalid characters
   */
  constructor(pattern: string) {
    try {
      this.patternRegex = NucleotidePattern.getNucleotidePattern(pattern) as RegExp;
    } catch (error) {
      throw new InvalidNucleotidePatternError(`Invalid nucleotide pattern: ${pattern}`, pattern);
    }
    this.pattern = pattern;
  }

  /**
   * Checks if a given nucleic acid sequence matches the IUPAC notation pattern.
   *
   * @param nucleicAcid - The DNA or RNA sequence to check against the pattern
   *
   * @returns True if the sequence matches the pattern, false otherwise
   *
   * @example
   * ```typescript
   *  //given the following pattern object
   *  const pattern = new NucleotidePattern('ANNT');
   *
   *  //check a valid DNA match
   *  pattern.matches(parseDNA('AAAT').unwrap()); //returns true
   *
   *  //check an invalid DNA match
   *  pattern.matches(parseDNA('CCCC').unwrap()); //returns false
   * ```
   */
  matches(nucleicAcid: DNA | RNA): boolean {
    const sequence = nucleicAcid.getSequence();
    if (!sequence) {
      return false;
    }
    return this.patternRegex.test(sequence);
  }

  /**
   * Finds all occurrences of the pattern within a nucleic acid sequence.
   *
   * @param nucleicAcid - The DNA or RNA sequence to search within
   *
   * @returns Array of match objects with start position, end position, and matched sequence
   *
   * @example
   * ```typescript
   *  const pattern = new NucleotidePattern('RY');
   *  const dna = parseDNA('ATGAGCGATC').unwrap();
   *  const matches = pattern.findMatches(dna);
   *  // Returns: [{ start: 2, end: 4, match: 'GA' }, { start: 5, end: 7, match: 'GC' }]
   * ```
   */
  findMatches(nucleicAcid: DNA | RNA): Array<{ start: number; end: number; match: string }> {
    const sequence = nucleicAcid.getSequence();
    if (!sequence) {
      return [];
    }

    const matches: Array<{ start: number; end: number; match: string }> = [];
    const globalRegex = new RegExp(this.patternRegex.source, 'g');
    let match;

    while ((match = globalRegex.exec(sequence)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
      });
    }

    return matches;
  }

  /**
   * Finds the first occurrence of the pattern within a nucleic acid sequence.
   *
   * @param nucleicAcid - The DNA or RNA sequence to search within
   *
   * @returns Match object with start position, end position, and matched sequence, or null if no match found
   *
   * @example
   * ```typescript
   *  const pattern = new NucleotidePattern('RY');
   *  const dna = parseDNA('ATGAGCGATC').unwrap();
   *  const match = pattern.findFirst(dna);
   *  // Returns: { start: 2, end: 4, match: 'GA' }
   * ```
   */
  findFirst(nucleicAcid: DNA | RNA): { start: number; end: number; match: string } | null {
    const sequence = nucleicAcid.getSequence();
    if (!sequence) {
      return null;
    }

    const match = this.patternRegex.exec(sequence);
    if (!match) {
      return null;
    }

    return {
      start: match.index,
      end: match.index + match[0].length,
      match: match[0],
    };
  }

  /**
   * Checks if the pattern matches either the forward strand or reverse complement strand
   * of the given nucleic acid sequence.
   *
   * @param nucleicAcid - The DNA or RNA sequence to check against both strands
   *
   * @returns True if the pattern matches either the forward or reverse complement strand
   *
   * @example
   * ```typescript
   *  const pattern = new NucleotidePattern('GAATTC'); // EcoRI restriction site
   *  const dna = parseDNA('CTTAAG').unwrap(); // Reverse complement of GAATTC
   *  console.log(pattern.matches(dna)); // false
   *  console.log(pattern.matchesEitherStrand(dna)); // true
   * ```
   */
  matchesEitherStrand(nucleicAcid: DNA | RNA): boolean {
    if (this.matches(nucleicAcid)) {
      return true;
    }

    const reverseComplementPattern = baseLevelReverseComplement(
      this.pattern,
      nucleicAcid.nucleicAcidType,
    );

    if (reverseComplementPattern === undefined) {
      return false;
    }

    try {
      const rcPatternRegex = NucleotidePattern.getNucleotidePattern(
        reverseComplementPattern,
      ) as RegExp;
      return rcPatternRegex.test(nucleicAcid.getSequence());
    } catch {
      return false;
    }
  }

  /**
   * Tests if a nucleic acid sequence contains the pattern.
   *
   * @param nucleicAcid - The nucleic acid to test
   * @returns True if the pattern is found in the sequence
   */
  test(nucleicAcid: DNA | RNA): boolean {
    return this.patternRegex.test(nucleicAcid.getSequence());
  }

  /**
   * Tests if a string sequence contains the pattern.
   *
   * @param sequence - The sequence string to test
   * @returns True if the pattern is found in the sequence
   */
  testString(sequence: string): boolean {
    return this.patternRegex.test(sequence);
  }

  /**
   * Replaces all occurrences of the pattern in a nucleic acid sequence.
   *
   * @param nucleicAcid - The nucleic acid containing the sequence to modify
   * @param replacement - The replacement string
   * @returns The modified sequence string
   */
  replace(nucleicAcid: DNA | RNA, replacement: string): string {
    return nucleicAcid.getSequence().replace(this.patternRegex, replacement);
  }

  /**
   * Replaces all occurrences of the pattern in a string sequence.
   *
   * @param sequence - The sequence string to modify
   * @param replacement - The replacement string
   * @returns The modified sequence string
   */
  replaceString(sequence: string, replacement: string): string {
    return sequence.replace(this.patternRegex, replacement);
  }

  /**
   * Splits a nucleic acid sequence by the pattern.
   *
   * @param nucleicAcid - The nucleic acid to split
   * @returns Array of sequence parts split by the pattern
   */
  split(nucleicAcid: DNA | RNA): string[] {
    return nucleicAcid.getSequence().split(this.patternRegex);
  }

  /**
   * Splits a string sequence by the pattern.
   *
   * @param sequence - The sequence string to split
   * @returns Array of sequence parts split by the pattern
   */
  splitString(sequence: string): string[] {
    return sequence.split(this.patternRegex);
  }

  /**
   * Finds all occurrences of the pattern within a string sequence.
   *
   * @param sequence - The sequence string to search within
   *
   * @returns Array of match objects with start position, end position, and matched sequence
   *
   * @example
   * ```typescript
   *  const pattern = new NucleotidePattern('RY');
   *  const matches = pattern.findMatchesString('ATGAGCGATC');
   *  // Returns: [{ start: 2, end: 4, match: 'GA' }, { start: 5, end: 7, match: 'GC' }]
   * ```
   */
  findMatchesString(sequence: string): Array<{ start: number; end: number; match: string }> {
    if (!sequence) {
      return [];
    }

    const matches: Array<{ start: number; end: number; match: string }> = [];
    const globalRegex = new RegExp(this.patternRegex.source, 'g');
    let match;

    while ((match = globalRegex.exec(sequence)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
      });
    }

    return matches;
  }

  /**
   * Gets the underlying RegExp object for advanced usage.
   *
   * @returns The compiled regular expression
   */
  getRegex(): RegExp {
    return this.patternRegex;
  }

  /**
   * Creates a NucleotidePattern representing the complement of the given pattern.
   *
   * @param nucleotidePattern - The pattern to get the complement of
   * @returns A new NucleotidePattern representing the complement
   */
  static createComplement(nucleotidePattern: NucleotidePattern): NucleotidePattern {
    const complementPattern = NucleotidePattern.getNucleotidePattern(
      nucleotidePattern.pattern,
      true,
      false,
    ) as string;
    return new NucleotidePattern(complementPattern);
  }

  /**
   * Creates a NucleotidePattern representing the reverse complement of this pattern.
   *
   * @returns A new NucleotidePattern representing the reverse complement
   *
   * @example
   * ```typescript
   *  const pattern = new NucleotidePattern('GAATTC');
   *  const reverseComplement = pattern.getReverseComplement();
   *  // Returns pattern equivalent to 'GAATTC' (EcoRI site is palindromic)
   *
   *  const asymmetric = new NucleotidePattern('ATCG');
   *  const rcAsymmetric = asymmetric.getReverseComplement();
   *  // Returns pattern equivalent to 'CGAT'
   * ```
   */
  getReverseComplement(): NucleotidePattern {
    const complementPattern = NucleotidePattern.getNucleotidePattern(
      this.pattern,
      true,
      false,
    ) as string;

    const reverseComplementPattern = complementPattern.split('').reverse().join('');

    return new NucleotidePattern(reverseComplementPattern);
  }

  /**
   * Internal method to convert IUPAC nucleotide patterns to regular expressions.
   *
   * @param pattern - The IUPAC nucleotide pattern string
   * @param getComplement - Whether to get the complement pattern
   * @param getRegex - Whether to return RegExp (true) or string (false)
   * @returns Regular expression or string representation
   *
   * @throws {@link InvalidNucleotidePatternError}
   * Thrown if the pattern input contains invalid alpha characters (must be a valid IUPAC nucleotide symbol) or is not a valid regex
   */
  private static getNucleotidePattern(
    pattern: string,
    getComplement = false,
    getRegex = true,
  ): RegExp | string {
    if (pattern === '') {
      throw new InvalidNucleotidePatternError('Nucleotide pattern cannot be empty.', '');
    }
    let result = '';
    for (let i = 0; i < pattern.length; i++) {
      const currChar = pattern[i];
      //check if it's an alpha character. If so, it either has to be a valid IUPAC nucleotide symbol or part of an escape sequence
      if (/[a-zA-Z]/.test(currChar)) {
        const isValidNucleotideSymbol = /^[AaTtCcGgUuRrYyKkMmSsWwBbVvDdHhNn]$/.test(currChar);
        const isEscapeSeq = i > 0 && pattern[i - 1] === '\\' ? true : false;
        if (isEscapeSeq) {
          result += currChar;
        } else if (isValidNucleotideSymbol) {
          const patternSymbol = getComplement
            ? getNucleotidePatternSymbolComplement(new NucleotidePatternSymbol(currChar))
            : new NucleotidePatternSymbol(currChar);
          result += getRegex ? patternSymbol.matchingRegex.source : patternSymbol.symbol;
        } else {
          throw new InvalidNucleotidePatternError(
            `Invalid nucleotide pattern character encountered: ${currChar}`,
            currChar,
          );
        }
      } else {
        // Non-alpha character - allow all regex operators and special characters
        // This includes: [], {}, (), +, *, ?, |, ^, $, ., \, -, ,, digits, spaces, and other regex constructs
        result += currChar;
      }
    }
    return getRegex ? new RegExp(result) : result;
  }
}

function baseLevelReverseComplement(sequence: string, alphabet: 'DNA' | 'RNA'): string | undefined {
  const complementBase = alphabet === 'DNA' ? complementDNABase : complementRNABase;
  let result = '';
  for (let i = sequence.length - 1; i >= 0; i--) {
    const complemented = complementBase(sequence[i]);
    if (complemented === undefined) {
      return undefined;
    }
    result += complemented;
  }
  return result;
}
