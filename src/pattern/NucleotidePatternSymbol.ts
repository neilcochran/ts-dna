import { NUCLEOTIDE_PATTERN_SYMBOLS } from './iupac-symbols.js';
import type { IUPACSymbol } from './iupac-symbols.js';
import { UNSAFE_NUCLEOTIDE_PATTERN_SYMBOL_KEY } from './internal-keys.js';

/**
 * A single IUPAC nucleotide notation symbol (e.g. `A`, `T`, `R`, `N`) with the concrete bases
 * it matches and a compiled, case-insensitive regex character class.
 *
 * Instances are immutable. Public callers construct instances via
 * {@link parseNucleotidePatternSymbol}; the constructor is gated by a module-private sentinel.
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
   * Constructs a `NucleotidePatternSymbol`. Module-private; public callers must go through
   * {@link parseNucleotidePatternSymbol}.
   *
   * @param symbol - A pre-validated, upper-cased IUPAC nucleotide symbol
   * @param trustedKey - Sentinel proving the caller is `pattern/`-internal
   *
   * @internal
   */
  constructor(symbol: IUPACSymbol, trustedKey: typeof UNSAFE_NUCLEOTIDE_PATTERN_SYMBOL_KEY) {
    if (trustedKey !== UNSAFE_NUCLEOTIDE_PATTERN_SYMBOL_KEY) {
      throw new Error(
        'NucleotidePatternSymbol must be constructed via parseNucleotidePatternSymbol',
      );
    }
    this.symbol = symbol;
    this.matchingBases = NUCLEOTIDE_PATTERN_SYMBOLS[symbol];
    this.matchingRegex = buildSymbolRegex(this.matchingBases);
  }
}

/**
 * Constructs a {@link NucleotidePatternSymbol} from a pre-validated, upper-cased IUPAC symbol.
 *
 * @internal
 */
export function unsafeNucleotidePatternSymbol(symbol: IUPACSymbol): NucleotidePatternSymbol {
  return new NucleotidePatternSymbol(symbol, UNSAFE_NUCLEOTIDE_PATTERN_SYMBOL_KEY);
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
