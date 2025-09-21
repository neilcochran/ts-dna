import { NucleotidePatternSymbol } from '../model/nucleic-acids/NucleotidePatternSymbol.js';
import { NucleicAcid } from '../model/nucleic-acids/NucleicAcid.js';
import { DNA } from '../model/nucleic-acids/DNA.js';
import { RNA } from '../model/nucleic-acids/RNA.js';
import { NucleicAcidType } from '../enums/nucleic-acid-type.js';

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
export const getNucleotidePatternSymbolComplement = (
  patternSymbol: NucleotidePatternSymbol,
): NucleotidePatternSymbol => {
  switch (patternSymbol.symbol) {
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
export { isValidNucleicAcid } from './validation.js';

// Re-export complement functions from dedicated module
export {
  getComplementSequence,
  getReverseComplementSequence,
  getDNABaseComplement,
  getRNABaseComplement,
} from './complement.js';

/**
 * Convert the given DNA into RNA
 *
 * @param dna - The DNA to convert to RNA
 *
 * @returns The equivalent RNA of the given DNA
 *
 * @example
 * ```typescript
 *  //Convert DNA to RNA
 *  convertToRNA(new DNA('ATG')); //returns RNA('AUG')
 * ```
 */
export const convertToRNA = (dna: DNA): RNA => {
  const sequence = dna.getSequence();
  return new RNA(sequence.replaceAll('T', 'U'));
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
export const STOP_CODON_UAA = 'UAA';

/**
 * Stop codon UAG - does not code for an amino acid
 */
export const STOP_CODON_UAG = 'UAG';

/**
 * Stop codon UGA - does not code for an amino acid
 */
export const STOP_CODON_UGA = 'UGA';

/**
 * Start codon AUG - codes for methionine and initiates translation
 */
export const START_CODON = 'AUG';

/**
 * Array of all stop codons
 */
export const STOP_CODONS = [STOP_CODON_UAA, STOP_CODON_UAG, STOP_CODON_UGA] as readonly string[];
