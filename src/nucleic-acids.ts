import {
    NucleotidePatternSymbol,
    NucleotidePattern,
    NucleicAcid,
    DNA,
    RNA,
    InvalidNucleotidePatternError
} from './model';
import { NucleicAcidType } from './NucleicAcidType';
import { RNASubType } from './RNASubType';

/**
 * helper regex for validating nucleotide patters
 *
 * @internal
 */
const NUCLEOTIDE_PATTERN_SYMBOLS_REGEX =  /^[AaTtCcGgUuRrYyKkMmSsWwBbVvDdHhNn]+$/;

/**
 * helper record that maps a nucleotide pattern symbol to its list of matching bases
 *
 * @internal
 */
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
 *
 * @see {@link NucleotidePattern}
 *
 * @param pattern - The pattern to validate
 *
 * @returns True if the pattern is a valid nucleotide pattern, false otherwise.
 *
 * @example
 * ```typescript
 *  //passing a valid pattern string
 *  isValidNucleotidePattern('RRYYATNNNN'); //returns true
 *
 *  //passing an invalid pattern string (X & Z are not a valid symbol)
 *  isValidNucleotidePattern('XXZZAANN'); //returns false
 * ```
 */
export const isValidNucleotidePattern = (pattern: string): boolean => {
    try {
        new NucleotidePattern(pattern);
        return true;
    } catch(error) {
        return false;
    }
};

/**
 * Get the complement of the given nucleotide pattern symbol
 *
 * @param patternSymbol - The nucleotide pattern symbol to get the complement of
 *
 * @returns The complement of the given nucleotide pattern symbol
 *
 * @example
 * ```typescript
 *  const symbol = new NucleotidePatternSymbol('R');
 *  //pass a valid nucleotide pattern symbol'R' and get it's complement symbol
 *  getNucleotidePatternSymbolComplement(symbol); //returns the nucleotide pattern symbol 'Y'
 * ```
 */
export const getNucleotidePatternSymbolComplement = (patternSymbol: NucleotidePatternSymbol): NucleotidePatternSymbol => {
    switch(patternSymbol.symbol) {
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
            //since the input param is a NucleotidePatternSymbol it must be valid so this case is just to satisfy the compiler so we don't have to return | undefined
            return new NucleotidePatternSymbol('N');
    }
};

/**
 * Get the complement of the given nucleotide pattern
 *
 * @param nucleotidePattern - The nucleotide pattern to get the complement of
 *
 * @returns The complement of the given nucleotide pattern
 *
 * @example
 * ```typescript
 *  const pattern = new NucleotidePattern('RYNA');
 *  //pass a valid nucleotide pattern and get it's complement pattern
 *  getNucleotidePatternComplement(pattern); //returns the complement pattern 'YRNT'
 * ```
 */
export const getNucleotidePatternComplement = (nucleotidePattern: NucleotidePattern): NucleotidePattern => {
    const complementPattern = getNucleotidePattern(nucleotidePattern.pattern, true, false) as string;
    return new NucleotidePattern(complementPattern);
};

/**
 * Get the (optionally complement) pattern or regex for the given pattern
 *
 * @param pattern - The nucleotide symbol pattern regex
 *
 * @param getComplement - Determines if the result is the complement of the input
 *
 * @param getRegex - Determines if the return value is a RegExp object or a nucleotide pattern string
 * @returns A nucleotide pattern string, or RegExp representing the input (or it's complement)
 *
 * @throws {@link InvalidNucleotidePatternError}
 * Thrown if the pattern input contains invalid alpha characters (must be a valid IUPAC nucleotide symbol) or is not a valid regex
 *
 * @internal
 */
export const getNucleotidePattern = (pattern: string, getComplement = false, getRegex = true): RegExp | string => {
    if(pattern === '') {
        throw new InvalidNucleotidePatternError('Nucleotide pattern cannot be empty.', '');
    }
    let result = '';
    for(let i = 0; i < pattern.length; i++) {
        const currChar = pattern[i];
        //check if it's an alpha character. If so, it either has to be a valid IUPAC nucleotide symbol or part of an escape sequence
        if(/[a-zA-Z]/.test(currChar)) {
            const isValidNucleotideSymbol = NUCLEOTIDE_PATTERN_SYMBOLS_REGEX.test(currChar);
            const isEscapeSeq = (i > 0 && pattern[i - 1] === '\\') ? true : false;
            if(isEscapeSeq) {
                result += currChar;
            }
            else if(isValidNucleotideSymbol) {
                const patternSymbol = getComplement ? getNucleotidePatternSymbolComplement(new NucleotidePatternSymbol(currChar)): new NucleotidePatternSymbol(currChar);
                result += getRegex ? patternSymbol.matchingRegex.source : patternSymbol.symbol;
            }
            else {
                throw new InvalidNucleotidePatternError(`Invalid nucleotide pattern character encountered: ${currChar}`, currChar);
            }
        }
        else { //non alpha character
            result += currChar;
        }
    }
    return getRegex ? new RegExp(result) : result;
};


/**
 * Type guard for checking if a nucleic acid is DNA
 *
 * @param nucleicAcid - The nucleic acid to check
 *
 * @returns True if the nucleic acid is DNA, false otherwise
 *
 * @example
 * ```typescript
 *  //pass a DNA object
 *  isDNA(new DNA()); //returns true
 *
 *  //pass an RNA object
 *  isDNA(new RNA()); //returns false
 * ```
 */
export const isDNA = (nucleicAcid: NucleicAcid): nucleicAcid is DNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.DNA;
};

/**
 * Type guard for checking if a nucleic acid is RNA
 *
 * @param nucleicAcid - The nucleic acid to check
 *
 * @returns True if the nucleic acid is RNA, false otherwise
 *
 * @example
 * ```typescript
 *  //pass an RNA object
 *  isRNA(new RNA()); //returns true
 *
 *  //pass an DNA object
 *  isRNA(new DNA()); //returns false
 * ```
 */
export const isRNA = (nucleicAcid: NucleicAcid): nucleicAcid is RNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.RNA;
};

// Re-export validation functions
export {
    getComplementSequence,
    isValidNucleicAcid,
    getDNABaseComplement,
    getRNABaseComplement
} from './validation';

/**
 * Given a nucleic acid, convert it to the opposite nucleic acid type
 *
 * @param nucleicAcid - The nucleic acid to convert
 *
 * @returns The equivalent DNA if the input was RNA, or the equivalent RNA if the input was DNA
 *
 * @example
 * ```typescript
 *  //Convert RNA to DNA
 *  convertNucleicAcid(new RNA('AUG')); //returns DNA with the sequence 'ATG'
 *
 *  //Convert DNA to RNA
 *  convertNucleicAcid(new DNA('ATG')); //returns RNA with a sequence of 'AUG'
 * ```
 */
export const convertNucleicAcid = (nucleicAcid: NucleicAcid): DNA | RNA => {
    const sequence = nucleicAcid.getSequence();
    if(nucleicAcid.nucleicAcidType === NucleicAcidType.DNA) {
        return new RNA(sequence.replaceAll('T', 'U'));
    }
    else {
        return new DNA(sequence.replaceAll('U', 'T'));
    }
};

/**
 * Convert the given DNA into RNA, optionally providing an RNA sub type
 *
 * @param dna - The DNA to convert to RNA
 *
 * @param rnaSubType - Optional RNA sub type
 *
 * @returns The equivalent RNA of the given DNA
 *
 * @example
 * ```typescript
 *  //Convert DNA to RNA with no RNA subtype
 *  convertToRNA(new DNA('ATG')); //returns RNA('AUG')
 *
 *  //Convert DNA to RNA with an RNA subtype
 *  convertToRNA(new DNA('ATG'), RNASubType.M_RNA); //returns RNA('AUG') with RNASubType.M_RNA
 * ```
 */
export const convertToRNA = (dna: DNA, rnaSubType?: RNASubType): RNA => {
    const sequence = dna.getSequence();
    return new RNA(sequence.replaceAll('T', 'U'), rnaSubType);
};

/**
 * Convert the given RNA into DNA
 *
 * @param rna - The RNA to convert to DNA
 *
 * @returns The equivalent DNA of the given RNA
 *
 * @example
 * ```typescript
 *  //Convert RNA to DNA
 *  convertToDNA(new RNA('AUG')); //returns DNA('ATG')
 * ```
 */
export const convertToDNA = (rna: RNA): DNA => {
    const sequence = rna.getSequence();
    return new DNA(sequence.replaceAll('U', 'T'));
};

/**
 * Stop codon UAA - does not code for an amino acid
 */
export const STOP_CODON_UAA = 'UAA' as const;

/**
 * Stop codon UAG - does not code for an amino acid
 */
export const STOP_CODON_UAG = 'UAG' as const;

/**
 * Stop codon UGA - does not code for an amino acid
 */
export const STOP_CODON_UGA = 'UGA' as const;

/**
 * Array of all stop codons
 */
export const STOP_CODONS = [STOP_CODON_UAA, STOP_CODON_UAG, STOP_CODON_UGA] as const;

