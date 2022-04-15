import { isValidNucleotidePattern } from '../../nucleic-acids';
import { NucleicAcid } from './NucleicAcid';
import { NucleotidePatternSymbol } from './NucleotidePatternSymbol';

export class NucleotidePattern {
    private pattern: NucleotidePatternSymbol[] = [];
    private patternString: string;

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

    getPattern(): NucleotidePatternSymbol[] {
        return this.pattern;
    }

    getPatternString(): string {
        return this.patternString;
    }

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