import { isValidNucleotidePattern } from '../../nucleic-acids';
import { InvalidNucleotidePatternError } from '../errors/InvalidNucleotidePatternError';
import { NucleicAcid } from './NucleicAcid';
import { NucleotidePatternSymbol } from './NucleotidePatternSymbol';

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
    public readonly pattern: NucleotidePatternSymbol[] = [];
    public readonly patternString: string;

    /**
     * @param pattern - A nonempty string of nucleotide IUPAC notation symbols
     *
     * @throws {@link InvalidNucleotidePatternError}
     * Thrown if the pattern is empty, or contains invalid characters
     */
    constructor(pattern: string) {
        if(!isValidNucleotidePattern(pattern)){
            throw new InvalidNucleotidePatternError('Nucleotide symbol patterns must use valid IUPAC notation', pattern);
        }
        this.patternString = '';
        for(const symbol of pattern) {
            this.pattern.push(new NucleotidePatternSymbol(symbol));
            this.patternString += symbol.toUpperCase();
        }
    }

    /**
     * Checks if a given NucleicAcid matches the nucleotide IUPAC notation pattern
     *
     * @param nucleicAcid - The NucleicAcid to check against the pattern
     *
     * @returns True if the NucleicAcid matches the pattern, false otherwise
     *
     * @example
     * ```typescript
     *  //given the following pattern object
     *  const pattern = new NucleotidePattern('ANNT');
     *
     *  //check a valid DNA match
     *  pattern.matches(new DNA('AAAT')); //returns true
     *
     *  //check an invalid DNA match
     *  pattern.matches(new DNA('CCCC')); //returns false
     *
     *  //check an invalid RNA match
     *  pattern.matches(new RNA('AGCU')); //returns false
     *
     *  //check DNA that matches the pattern, but is longer than the pattern
     *  pattern.matches(new DNA('ACCTAAA')); //returns false
     * ```
     */
    matches(nucleicAcid: NucleicAcid): boolean {
        const sequence = nucleicAcid.getSequence();
        if(this.patternString.length === sequence?.length) {
            for(let i = 0; i < this.pattern.length; i ++) {
                if(!this.pattern[i].matchingBases.includes(sequence[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}