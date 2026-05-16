import { NUCLEOTIDE_PATTERN_SYMBOLS } from '../../data/iupac-symbols.js';
import { InvalidNucleotidePatternError } from '../../model/index.js';
/**
 * A class representing a single nucleotide IUPAC notation symbol.
 * The constructor enforces validation, and all members are readonly. Therefor, all NucleotidePatternSymbol
 * objects can only exist in a valid state.
 *
 * @see {@link NucleotidePattern}
 *
 * @see {@link https://en.wikipedia.org/wiki/Nucleic_acid_notation#IUPAC_notation|More info on IUPAC notation}
 */
export class NucleotidePatternSymbol {
  public readonly symbol: string;
  public readonly matchingBases: string[];
  public readonly matchingRegex: RegExp;

  /**
   * @param symbol - The IUPAC nucleotide symbol
   *
   * @throws {@link InvalidNucleotidePatternError}
   * Thrown if the pattern symbol is invalid
   */
  constructor(symbol: string) {
    this.symbol = symbol.toUpperCase();
    this.matchingBases = NUCLEOTIDE_PATTERN_SYMBOLS[this.symbol];
    if (!this.matchingBases) {
      throw new InvalidNucleotidePatternError(
        `Invalid IUPAC nucleotide symbol: ${this.symbol}`,
        this.symbol,
      );
    }
    //construct a regex character group of the matching bases
    let regex = '[';
    for (const base of this.matchingBases) {
      regex += base.toUpperCase() + base.toLocaleLowerCase();
    }
    regex += ']';
    this.matchingRegex = new RegExp(regex);
  }
}

/**
 * Returns the IUPAC complement of a {@link NucleotidePatternSymbol}.
 *
 * The complement is computed via a hand-maintained switch over the IUPAC alphabet. Phase 3
 * of the restructure replaces this with a programmatic derivation from the base-set table;
 * the function lives here in the meantime so the pattern subsystem keeps working after the
 * sequence-level move deletes the legacy `nucleic-acids.ts` helper.
 *
 * @param patternSymbol - The IUPAC nucleotide pattern symbol to complement
 * @returns A new `NucleotidePatternSymbol` carrying the complement
 */
export function getNucleotidePatternSymbolComplement(
  patternSymbol: NucleotidePatternSymbol,
): NucleotidePatternSymbol {
  switch (patternSymbol.symbol) {
    case 'A':
      return new NucleotidePatternSymbol('T');
    case 'T':
      return new NucleotidePatternSymbol('A');
    case 'C':
      return new NucleotidePatternSymbol('G');
    case 'G':
      return new NucleotidePatternSymbol('C');
    case 'U':
      return new NucleotidePatternSymbol('A');
    case 'R':
      return new NucleotidePatternSymbol('Y');
    case 'Y':
      return new NucleotidePatternSymbol('R');
    case 'K':
      return new NucleotidePatternSymbol('M');
    case 'M':
      return new NucleotidePatternSymbol('K');
    case 'S':
      return new NucleotidePatternSymbol('S');
    case 'W':
      return new NucleotidePatternSymbol('W');
    case 'B':
      return new NucleotidePatternSymbol('V');
    case 'V':
      return new NucleotidePatternSymbol('B');
    case 'D':
      return new NucleotidePatternSymbol('H');
    case 'H':
      return new NucleotidePatternSymbol('D');
    case 'N':
      return new NucleotidePatternSymbol('N');
    default:
      // The constructor validated `symbol`; this branch is unreachable. Returning N keeps
      // the function total without forcing the return type to widen to `| undefined`.
      return new NucleotidePatternSymbol('N');
  }
}
