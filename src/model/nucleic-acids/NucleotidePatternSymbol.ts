import { NUCLEOTIDE_PATTERN_SYMBOLS } from '../../nucleic-acids';

export class NucleotidePatternSymbol {
    private symbol: string;
    private matchingBases: string[];

    constructor(symbol: string) {
        this.symbol = symbol.toUpperCase();
        this.matchingBases = NUCLEOTIDE_PATTERN_SYMBOLS[this.symbol];
        if(!this.matchingBases) {
            throw new Error(`invalid IUPAC nucleotide symbol: ${this.symbol}`);
        }
    }

    getSymbol(): string {
        return this.symbol;
    }

    getMatchingBases(): string[] {
        return this.matchingBases;
    }
}