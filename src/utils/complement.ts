import { NucleicAcidType } from '../enums/nucleic-acid-type.js';

/**
 * Given a string sequence and a nucleic acid type, get the complement sequence
 * Optimized using string replacement for better performance
 *
 * @param sequence - The sequence to get a complement of
 * @param nucleicAcidType - The type of nucleic acid of the given sequence
 *
 * @returns The complement sequence, or undefined if the input sequence was undefined
 *
 * @example
 * ```typescript
 *  //Get DNA complement
 *  getComplementSequence('ATCG', NucleicAcidType.DNA); //returns 'TAGC'
 *
 *  //Get RNA complement
 *  getComplementSequence('AUCG', NucleicAcidType.RNA); //returns 'UAGC'
 * ```
 */
export const getComplementSequence = (
  sequence: string | undefined,
  nucleicAcidType: NucleicAcidType,
): string | undefined => {
  if (!sequence) {
    return undefined;
  }

  // Use character mapping for safety and performance
  const dnaComplementMap: Record<string, string> = {
    A: 'T',
    T: 'A',
    C: 'G',
    G: 'C',
  };

  const rnaComplementMap: Record<string, string> = {
    A: 'U',
    U: 'A',
    C: 'G',
    G: 'C',
  };

  const complementMap =
    nucleicAcidType === NucleicAcidType.DNA ? dnaComplementMap : rnaComplementMap;

  return sequence
    .split('')
    .map(base => complementMap[base] ?? '')
    .join('');
};

/**
 * Given a string sequence and a nucleic acid type, get the reverse complement sequence
 * This represents the opposite strand of double-stranded nucleic acids
 *
 * @param sequence - The sequence to get the reverse complement of
 * @param nucleicAcidType - The type of nucleic acid of the given sequence
 *
 * @returns The reverse complement sequence, or undefined if the input sequence was undefined
 *
 * @example
 * ```typescript
 *  //Get DNA reverse complement
 *  getReverseComplementSequence('ATCG', NucleicAcidType.DNA); //returns 'CGAT'
 *
 *  //Get RNA reverse complement
 *  getReverseComplementSequence('AUCG', NucleicAcidType.RNA); //returns 'CGAU'
 * ```
 */
export const getReverseComplementSequence = (
  sequence: string | undefined,
  nucleicAcidType: NucleicAcidType,
): string | undefined => {
  const complement = getComplementSequence(sequence, nucleicAcidType);
  return complement ? complement.split('').reverse().join('') : undefined;
};

/**
 * Given a valid DNA base string, return its complement
 *
 * @param base - The DNA base string to get the complement of
 *
 * @returns A string of the complement of the given base, or undefined if the given base was invalid
 *
 * @example
 * ```typescript
 *  getDNABaseComplement('A'); //returns 'T'
 *  getDNABaseComplement('T'); //returns 'A'
 *  getDNABaseComplement('C'); //returns 'G'
 *  getDNABaseComplement('G'); //returns 'C'
 * ```
 */
export const getDNABaseComplement = (base: string): string | undefined => {
  switch (base) {
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
 *
 * @param base - The RNA base string to get the complement of
 *
 * @returns A string of the complement of the given base, or undefined if the given base was invalid
 *
 * @example
 * ```typescript
 *  getRNABaseComplement('A'); //returns 'U'
 *  getRNABaseComplement('U'); //returns 'A'
 *  getRNABaseComplement('C'); //returns 'G'
 *  getRNABaseComplement('G'); //returns 'C'
 * ```
 */
export const getRNABaseComplement = (base: string): string | undefined => {
  switch (base) {
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
