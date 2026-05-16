import { InvalidNucleotidePatternError } from '../model/errors/InvalidNucleotidePatternError.js';
import { NUCLEOTIDE_PATTERN_SYMBOLS, isIUPACSymbol } from './iupac-symbols.js';
import type { IUPACSymbol } from './iupac-symbols.js';

/**
 * A single IUPAC nucleotide notation symbol (e.g. `A`, `T`, `R`, `N`) with the concrete bases
 * it matches and a compiled, case-insensitive regex character class.
 *
 * Instances are immutable. The constructor validates and throws
 * {@link InvalidNucleotidePatternError} on an unknown symbol; prefer {@link parseNucleotidePatternSymbol}
 * (returns a `Result`) for untrusted input.
 *
 * @see {@link https://en.wikipedia.org/wiki/Nucleic_acid_notation#IUPAC_notation|IUPAC notation}
 */
export class NucleotidePatternSymbol {
  /** The validated, upper-cased IUPAC symbol. */
  public readonly symbol: IUPACSymbol;

  /** Concrete bases this symbol matches (e.g. `R` matches `G` or `A`). */
  public readonly matchingBases: readonly string[];

  /** Compiled, case-insensitive regex character class matching any of {@link matchingBases}. */
  public readonly matchingRegex: RegExp;

  /**
   * Constructs a `NucleotidePatternSymbol` with constructor-time validation.
   *
   * @param symbol - An IUPAC nucleotide symbol (case-insensitive; normalized to upper-case)
   *
   * @throws {@link InvalidNucleotidePatternError} when `symbol` is empty or is not one of
   * the IUPAC nucleotide symbols
   */
  constructor(symbol: string) {
    const normalized = symbol.toUpperCase();
    if (normalized === '') {
      throw new InvalidNucleotidePatternError('Nucleotide pattern symbol cannot be empty', symbol);
    }
    if (!isIUPACSymbol(normalized)) {
      throw new InvalidNucleotidePatternError(
        `Invalid IUPAC nucleotide symbol: '${symbol}'`,
        symbol,
      );
    }
    this.symbol = normalized;
    this.matchingBases = NUCLEOTIDE_PATTERN_SYMBOLS[normalized];
    this.matchingRegex = buildSymbolRegex(this.matchingBases);
  }
}

/**
 * Builds the case-insensitive regex character class for a set of bases. Each base contributes
 * both its upper- and lower-case forms (e.g. `['A', 'T']` produces `/[AaTt]/`).
 */
function buildSymbolRegex(bases: readonly string[]): RegExp {
  let body = '';
  for (const base of bases) {
    body += base.toUpperCase() + base.toLowerCase();
  }
  return new RegExp(`[${body}]`);
}
