import { AminoAcid } from '../model/AminoAcid.js';
import { RNA } from '../model/nucleic-acids/RNA.js';
import { InvalidCodonError } from '../model/errors/InvalidCodonError.js';
import { InvalidSequenceError } from '../model/errors/InvalidSequenceError.js';
import { NucleicAcidType } from '../enums/nucleic-acid-type.js';
import { AminoAcidData } from '../types/amino-acid-data.js';
import { CODON_LENGTH } from '../constants/biological-constants.js';
import {
  SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP,
  CODON_TO_SINGLE_LETTER_CODE_MAP,
} from '../data/codon-map.js';
import { STOP_CODONS } from './nucleic-acids.js';

export {
  SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP,
  SINGLE_LETTER_CODE_ALT_CODONS_MAP,
  CODON_TO_SINGLE_LETTER_CODE_MAP,
} from '../data/codon-map.js';

/**
 * Given a valid RNA codon, return the corresponding amino acid
 *
 * @param codon - The RNA codon that codes for an amino acid
 *
 * @returns The corresponding amino acid or undefined if the RNA codon is invalid
 *
 * @example
 * ```typescript
 *  //passing a valid RNA codon
 *  getAminoAcidByCodon(new RNA('GCA')); //returns an AminoAcid object
 *
 *  //passing an invalid codon (wrong length)
 *  getAminoAcidByCodon(new RNA('GC')); //returns undefined
 * ```
 */
export const getAminoAcidByCodon = (codon: RNA): AminoAcid | undefined => {
  //leverage the AminoAcid constructor validation and simply attempt to create the AminoAcid object
  //if it is not a valid amino acid codon it will throw an error
  try {
    const aminoAcid = new AminoAcid(codon);
    return aminoAcid;
  } catch (error) {
    return undefined;
  }
};

/**
 * Given a valid codon, return the corresponding amino acid data
 *
 * @param codon - The RNA codon that codes for an amino acid
 *
 * @returns The corresponding amino acid data or undefined if the codon is invalid
 *
 * @internal For internal use by model classes
 */
export const getAminoAcidDataByCodon = (codon: RNA): AminoAcidData | undefined => {
  const sequence = codon.getSequence();
  if (sequence.length !== CODON_LENGTH) {
    return undefined;
  }

  const singleLetterCode = CODON_TO_SINGLE_LETTER_CODE_MAP[sequence];
  if (!singleLetterCode) {
    return undefined;
  }

  return SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP[singleLetterCode];
};

/**
 * Parse RNA into a list of amino acids. Translation stops when a stop codon is encountered.
 *
 * @param rna - The RNA comprised of codons
 *
 * @returns A list of amino acids (translation stops at first stop codon)
 *
 * @throws {@link InvalidSequenceError}
 * Thrown if the sequence is undefined, or not evenly divisible by {@link CODON_LENGTH} (codons always have a length of {@link CODON_LENGTH})
 *
 * @throws {@link InvalidCodonError}
 * Thrown if an invalid codon is encountered (one that does not code for an amino acid and is not a stop codon)
 *
 * @example
 * ```typescript
 *  //passing RNA with coding codons and stop codon
 *  RNAtoAminoAcids(new RNA('AUGAAACCCUAG')); //returns 3 amino acids, stops at UAG
 * ```
 */
export const RNAtoAminoAcids = (rna: RNA): AminoAcid[] => {
  const sequence = rna.getSequence();
  const aminoAcids: AminoAcid[] = [];

  if (sequence.length % CODON_LENGTH !== 0) {
    throw new InvalidSequenceError(
      `Invalid codon: ${sequence} The RNA sequence length must be divisible by ${CODON_LENGTH} to be comprised of only codons`,
      sequence,
      NucleicAcidType.RNA,
    );
  }

  // Parse sequence into groups of codons
  const codons = sequence.match(new RegExp(`.{1,${CODON_LENGTH}}`, 'g')) ?? [];

  for (const codonSeq of codons) {
    // Check if this is a stop codon - if so, terminate translation
    if (STOP_CODONS.includes(codonSeq)) {
      break;
    }

    // Try to translate the codon to an amino acid
    const aminoAcid = getAminoAcidByCodon(new RNA(codonSeq));
    if (!aminoAcid) {
      throw new InvalidCodonError(`Invalid codon encountered: ${codonSeq}`, codonSeq);
    }
    aminoAcids.push(aminoAcid);
  }

  return aminoAcids;
};
