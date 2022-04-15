import {
    NucleotidePatternSymbol,
    NucleotidePattern,
    NucleicAcid,
    DNA,
    RNA
} from './model';

const NUCLEOTIDE_PATTERN_SYMBOLS_REGEX =  /^[AaTtCcGgUuRrYyKkMmSsWwBbVvDdHhNn]+$/;

export const NUCLEOTIDE_PATTERN_SYMBOLS: Record<string, string[]> = {
    A: ['A'], //Adenine
    T: ['T'], //Thymine
    C: ['C'], //Cytosine
    G: ['G'], //Guanine
    U: ['U'], //Uracil
    R: ['G', 'A'], //Purine
    Y: ['C', 'T'], //Pyrimidine
    K: ['G', 'T'], //Ketone
    M: ['A', 'C'], //Amino
    S: ['G', 'C'], //Strong
    W: ['A', 'T'], //Weak
    B: ['G', 'T', 'C'], //Not A
    V: ['G', 'C', 'A'], //Not T
    D: ['G', 'A', 'T'], //Not C
    H: ['A', 'C', 'T'], //Not G
    N: ['A', 'G', 'C', 'T'] //Any one base
};

export const isValidNucleotidePattern = (pattern: string): boolean => {
    return NUCLEOTIDE_PATTERN_SYMBOLS_REGEX.test(pattern);
};

export const getNucleotidePatternSymbolComplement = (patternSymbol: NucleotidePatternSymbol): NucleotidePatternSymbol | undefined => {
    switch(patternSymbol.getSymbol()) {
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
            return undefined;
    }
};

export const getNucleotidePatternComplement = (nucleotidePattern: NucleotidePattern): NucleotidePattern => {
    let complementPatternString = '';
    for(const patternSymbol of nucleotidePattern.getPattern()) {
        //Since we've already validated the pattern getting the complement should never return undefined
        //however, coalesce to an empty string to satisfy compiler.
        complementPatternString += getNucleotidePatternSymbolComplement(patternSymbol)?.getSymbol() ?? '';
    }
    return new NucleotidePattern(complementPatternString);
};

export enum NucleicAcidType {
    DNA = 'DNA',
    RNA = 'RNA'
}

export enum RNASubType {
    PRE_M_RNA = 'PRE_M_RNA',
    M_RNA = 'M_RNA'
}

export const isDNA = (nucleicAcid: NucleicAcid): nucleicAcid is DNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.DNA;
};

export const isRNA = (nucleicAcid: NucleicAcid): nucleicAcid is RNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.RNA;
};

// For internal use by DNA/RNA classes only! Since sequence validation is enforced in the DNA/RNA constructor so no validation is needed
export const getComplementSequence = (sequence: string | undefined, type: NucleicAcidType): string | undefined => {
    let complement: string | undefined;
    if(sequence){
        complement = '';
        for (const base of sequence) {
            complement += NucleicAcidType.DNA === type
                ? getDNABaseComplement(base) ?? ''
                : getRNABaseComplement(base) ?? '';
        }
    }
    return complement;
};

export const isValidNucleicAcidSequence = (sequence: string, type: NucleicAcidType): boolean => {
    let regex = undefined;
    switch(type){
        case NucleicAcidType.DNA:
            regex = /^[AaTtCcGg]+$/;
            break;
        case NucleicAcidType.RNA:
            regex =  /^[AaUuCcGg]+$/;
            break;
    }
    return regex.test(sequence);
};

export const convertNucleicAcid = (nucleicAcid: NucleicAcid): DNA | RNA => {
    const sequence = nucleicAcid.getSequence();
    if(nucleicAcid.nucleicAcidType === NucleicAcidType.DNA) {
        const rna = new RNA();
        if(sequence) {
            rna.setSequence(sequence.replaceAll('T', 'U'));
        }
        return rna;
    }
    else {
        const dna = new DNA();
        if(sequence) {
            dna.setSequence(sequence.replaceAll('U', 'T'));
        }
        return dna;
    }
};

export const convertToRNA = (dna: DNA, rnaSubType?: RNASubType): RNA => {
    const rna = new RNA(undefined, rnaSubType);
    const sequence = dna.getSequence();
    if(sequence) {
        rna.setSequence(sequence.replaceAll('T', 'U'));
    }
    return rna;
};

export const convertToDNA = (rna: RNA): DNA => {
    const dna = new DNA();
    const sequence = rna.getSequence();
    if(sequence) {
        dna.setSequence(sequence.replaceAll('U', 'T'));
    }
    return dna;
};

export const getDNABaseComplement = (base: string): string | undefined => {
    switch(base){
        case 'A':
            return 'T';
        case 'T':
            return 'A';
        case 'C':
            return 'G';
        case 'G':
            return 'C';
        default:
            return undefined;
    }
};

export const getRNABaseComplement = (base: string): string | undefined => {
    switch(base){
        case 'A':
            return 'U';
        case 'U':
            return 'A';
        case 'C':
            return 'G';
        case 'G':
            return 'C';
        default:
            return undefined;
    }
};
