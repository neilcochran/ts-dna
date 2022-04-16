import { isValidNucleotidePattern } from '../../nucleic-acids';
import { NucleicAcid } from './NucleicAcid';
import { NucleotidePatternSymbol } from './NucleotidePatternSymbol';

/**
 * A class to represent patterns comprised of nucleotide IUPAC notation symbols
 * @see {@link NucleotidePatternSymbol}
 * @see {@link https://en.wikipedia.org/wiki/Nucleic_acid_notation#IUPAC_notation|More info on IUPAC notation}
 */
export class NucleotidePattern {
    private pattern: NucleotidePatternSymbol[] = [];
    private patternString: string;

    /**
     * @param pattern - A nonempty string of nucleotide IUPAC notation symbols
     * @throws
     * If the pattern is empty, or contains invalid characters an error is thrown
     */
    constructor(pattern: string) {
        if(!isValidNucleotidePattern(pattern)){
            throw new Error('Nucleotide symbol patterns must use valid IUPAC notation');
        }
        this.patternString = '';
        for(const symbol of pattern) {
            this.pattern.push(new NucleotidePatternSymbol(symbol));
            this.patternString += symbol.toUpperCase();
        }
    }

    /**
     * Returns the list of NucleotidePatternSymbols that comprise the pattern
     * @returns The list of NucleotidePatternSymbols that comprise the pattern
     */
    getPattern(): NucleotidePatternSymbol[] {
        return this.pattern;
    }

    /**
     * Returns the string of nucleotide IUPAC notation symbols that comprise the patternString
     * @returns The string of nucleotide IUPAC notation symbols that comprise the patternString
     */
    getPatternString(): string {
        return this.patternString;
    }

    /**
     * Checks if a given NucleicAcid matches the nucleotide IUPAC notation pattern
     * @param nucleicAcid - The NucleicAcid to check against the pattern
     * @returns True if the NucleicAcid matches the pattern, false otherwise
     */
    matches(nucleicAcid: NucleicAcid): boolean {
        const sequence = nucleicAcid.getSequence();
        if(this.patternString.length === sequence?.length) {
            for(let i = 0; i < this.pattern.length; i ++) {
                if(!this.pattern[i].getMatchingBases().includes(sequence[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}