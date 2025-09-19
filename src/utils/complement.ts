import { NucleicAcidType } from '../enums/nucleic-acid-type.js';

/**
 * Given a string sequence and a nucleic acid type, get the complement sequence
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
  let complement: string | undefined;
  if (sequence) {
    complement = '';
    for (const base of sequence) {
      complement +=
        NucleicAcidType.DNA === nucleicAcidType
          ? (getDNABaseComplement(base) ?? '')
          : (getRNABaseComplement(base) ?? '');
    }
  }
  return complement;
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
