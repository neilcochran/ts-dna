import {
    NucleotidePatternSymbol,
    NucleotidePattern,
    NucleicAcid,
    DNA,
    RNA
} from './model';

//helper regex for validating nucleotide patters
const NUCLEOTIDE_PATTERN_SYMBOLS_REGEX =  /^[AaTtCcGgUuRrYyKkMmSsWwBbVvDdHhNn]+$/;

//helper record that maps a nucleotide pattern symbol to its list of matching bases
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

/**
 * Checks if a string is a valid nucleotide pattern
 * @see {@link NucleotidePattern}
 * @param pattern - The pattern to validate
 * @returns True if the pattern is a valid nucleotide pattern, false otherwise.
 */
export const isValidNucleotidePattern = (pattern: string): boolean => {
    return NUCLEOTIDE_PATTERN_SYMBOLS_REGEX.test(pattern);
};

/**
 * Get the complement of the given nucleotide pattern symbol
 * @param patternSymbol - The nucleotide pattern symbol to get the complement of
 * @returns The complement of the given nucleotide pattern symbol
 */
export const getNucleotidePatternSymbolComplement = (patternSymbol: NucleotidePatternSymbol): NucleotidePatternSymbol => {
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
            //since the input param is a NucleotidePatternSymbol it must be valid so this case is just to satisfy the compiler so we dont have to return | undefined
            return new NucleotidePatternSymbol('N');
    }
};

/**
 * Get the complement of the given nucleotide pattern
 * @param nucleotidePattern - The nucleotide pattern to get the complement of
 * @returns The complement of the given nucleotide pattern
 */
export const getNucleotidePatternComplement = (nucleotidePattern: NucleotidePattern): NucleotidePattern => {
    let complementPatternString = '';
    for(const patternSymbol of nucleotidePattern.getPattern()) {
        complementPatternString += getNucleotidePatternSymbolComplement(patternSymbol).getSymbol();
    }
    return new NucleotidePattern(complementPatternString);
};

/**
 * An enum to representing the type of a nucleic acid: RNA or DNA
 */
export enum NucleicAcidType {
    DNA = 'DNA',
    RNA = 'RNA'
}

/**
 * An enum to represent the subtypes of RNA
 */
export enum RNASubType {
    PRE_M_RNA = 'PRE_M_RNA',
    M_RNA = 'M_RNA'
}

/**
 * Type guard for checking if a nucleic acid is DNA
 * @param nucleicAcid - The nucleic acid to check
 * @returns True if the nucleic acid is DNA, false otherwise
 */
export const isDNA = (nucleicAcid: NucleicAcid): nucleicAcid is DNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.DNA;
};

/**
 * Type guard for checking if a nucleic acid is RNA
 * @param nucleicAcid - The nucleic acid to check
 * @returns True if the nucleic acid is RNA, false otherwise
 */
export const isRNA = (nucleicAcid: NucleicAcid): nucleicAcid is RNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.RNA;
};

/**
 * Given a string sequence and a nucleic acid type, get the complement sequence
 * @remarks
 * For internal use by DNA/RNA classes only. Since sequence validation is enforced in those classes, it is not needed here.
 * @internal
 * @param sequence - The sequence to get a complement of
 * @param nucleicAcidType - The type of nucleic acid of the given sequence
 * @returns The complement sequence, or undefined if the input sequence was undefined
 */
export const getComplementSequence = (sequence: string | undefined, nucleicAcidType: NucleicAcidType): string | undefined => {
    let complement: string | undefined;
    if(sequence){
        complement = '';
        for (const base of sequence) {
            complement += NucleicAcidType.DNA === nucleicAcidType
                ? getDNABaseComplement(base) ?? ''
                : getRNABaseComplement(base) ?? '';
        }
    }
    return complement;
};

/**
 * Given a string sequence and a nucleic acid type, check if the sequence is valid
 * @param sequence - The sequence to validate
 * @param nucleicAcidType - The type of nucleic acid of the given sequence
 * @returns True if the sequence if valid, false otherwise
 */
export const isValidNucleicAcidSequence = (sequence: string, nucleicAcidType: NucleicAcidType): boolean => {
    let regex = undefined;
    switch(nucleicAcidType){
        case NucleicAcidType.DNA:
            regex = /^[AaTtCcGg]+$/;
            break;
        case NucleicAcidType.RNA:
            regex =  /^[AaUuCcGg]+$/;
            break;
    }
    return regex.test(sequence);
};

/**
 * Given a nucleic acid, convert it to the opposite nucleic acid type
 * @param nucleicAcid - The nucleic acid to convert
 * @returns The equivalent DNA if the input was RNA, or the equivalent RNA if the input was DNA
 */
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

/**
 * Convert the given DNA into RNA, optionally providing an RNA sub type
 * @param dna - The DNA to convert to RNA
 * @param rnaSubType - Optional RNA sub type
 * @returns The equivalent RNA of the given DNA
 */
export const convertToRNA = (dna: DNA, rnaSubType?: RNASubType): RNA => {
    const rna = new RNA(undefined, rnaSubType);
    const sequence = dna.getSequence();
    if(sequence) {
        rna.setSequence(sequence.replaceAll('T', 'U'));
    }
    return rna;
};

/**
 * Convert the given RNA into DNA
 * @param rna - The RNA to convert to DNA
 * @returns The equivalent
 */
export const convertToDNA = (rna: RNA): DNA => {
    const dna = new DNA();
    const sequence = rna.getSequence();
    if(sequence) {
        dna.setSequence(sequence.replaceAll('U', 'T'));
    }
    return dna;
};

/**
 * Given a valid DNA base string, return its complement
 * @internal
 * @param base - The DNA base string to get the complement of
 * @returns A string of the complement of the given base, or undefined if the given base was invalid
 */
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

/**
 * Given a valid RNA base string, return its complement
 * @internal
 * @param base - The RNA base string to get the complement of
 * @returns A string of the complement of the given base, or undefined if the given base was invalid
 */
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
