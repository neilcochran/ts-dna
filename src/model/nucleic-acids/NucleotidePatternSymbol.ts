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
