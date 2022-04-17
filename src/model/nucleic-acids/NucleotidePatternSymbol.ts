import { NUCLEOTIDE_PATTERN_SYMBOLS } from '../../nucleic-acids';

/**
 * A class representing a single nucleotide IUPAC notation symbol.
 * @see {@link NucleotidePattern}
 * @see {@link https://en.wikipedia.org/wiki/Nucleic_acid_notation#IUPAC_notation|More info on IUPAC notation}
 */
export class NucleotidePatternSymbol {
    private symbol: string;
    private matchingBases: string[];

    /**
     * @param symbol - The IUPAC nucleotide symbol
     */
    constructor(symbol: string) {
        this.symbol = symbol.toUpperCase();
        this.matchingBases = NUCLEOTIDE_PATTERN_SYMBOLS[this.symbol];
        if(!this.matchingBases) {
            throw new Error(`invalid IUPAC nucleotide symbol: ${this.symbol}`);
        }
    }

    /**
     * Returns the IUPAC nucleotide symbol
     * @returns The IUPAC nucleotide symbol
     */
    getSymbol(): string {
        return this.symbol;
    }

    /**
     * Returns a list of any nucleotide bases that match the IUPAC nucleotide symbol
     * @returns List of strings containing the nucleotide bases that match the IUPAC nucleotide symbol
     */
    getMatchingBases(): string[] {
        return this.matchingBases;
    }
}