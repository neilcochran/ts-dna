import { getNucleotidePattern } from '../../utils/nucleic-acids';
import { InvalidNucleotidePatternError } from '../errors/InvalidNucleotidePatternError';
import { NucleicAcid } from './NucleicAcid';

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
    public readonly patternRegex: RegExp;
    public readonly pattern: string;

    /**
     * @param pattern - A nonempty regex string containing only nucleotide IUPAC notation symbols and valid regex symbols/operators
     *
     * @throws {@link InvalidNucleotidePatternError}
     * Thrown if the pattern is empty, or contains invalid characters
     */
    constructor(pattern: string) {
        try {
            this.patternRegex = getNucleotidePattern(pattern) as RegExp;
        } catch(error) {
            throw new InvalidNucleotidePatternError(`Invalid nucleotide pattern: ${pattern}`, pattern);
        }
        this.pattern = pattern;
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
        if(!sequence) {
            return false;
        }
        return this.patternRegex.test(sequence);
    }
}