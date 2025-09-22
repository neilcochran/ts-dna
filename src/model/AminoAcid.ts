import { RNA } from './nucleic-acids/index.js';
import {
  getAminoAcidDataByCodon,
  SINGLE_LETTER_CODE_ALT_CODONS_MAP,
} from '../utils/amino-acids.js';
import { AminoAcidData } from '../types/amino-acid-data.js';
import { AminoAcidPolarity } from '../enums/amino-acid-polarity.js';
import { AminoAcidCharge } from '../enums/amino-acid-charge.js';
import { AminoAcidSideChainType } from '../enums/amino-acid-side-chain-type.js';
import { isDeepStrictEqual } from 'util';
import { InvalidCodonError } from './errors/InvalidCodonError.js';
import { CODON_LENGTH } from '../constants/biological-constants.js';

/**
 * A class representing an amino acid instance with its backing RNA codon.
 * The constructor enforces validation, and all members are readonly. Therefore, all AminoAcid
 * objects can only exist in a valid state.
 */
export class AminoAcid implements AminoAcidData {
  public readonly codon: RNA;
  public readonly name!: string;
  public readonly abbrv!: string;
  public readonly singleLetterCode!: string;
  public readonly molecularWeight!: number;
  public readonly polarity!: AminoAcidPolarity;
  public readonly charge!: AminoAcidCharge;
  public readonly hydrophobicity!: number;
  public readonly sideChainType!: AminoAcidSideChainType;

  /**
   * @param codon - An RNA codon that codes for an amino acid
   *
   * @throws {@link InvalidCodonError}
   * Thrown if the codon does not code for an amino acid
   */
  constructor(codon: RNA) {
    const sequence = codon.getSequence();
    if (sequence.length !== CODON_LENGTH) {
      throw new InvalidCodonError(`Invalid codon length of: ${sequence.length}`, sequence);
    }
    const aminoAcidData = getAminoAcidDataByCodon(codon);
    if (!aminoAcidData) {
      throw new InvalidCodonError(
        `No amino acid is associated with the codon: ${sequence}`,
        sequence,
      );
    }

    // Copy all amino acid data properties
    Object.assign(this, aminoAcidData);

    // Set codon-specific properties
    this.codon = codon;
  }

  /**
   * Returns the codon nucleotide sequence
   *
   * @returns The codon nucleotide sequence
   */
  getCodonSequence(): string {
    return this.codon.getSequence();
  }

  /**
   * Return all codons that code for this amino acid
   *
   * @returns All codons that code for this amino acid
   */
  getAllAlternateCodons(): RNA[] {
    return SINGLE_LETTER_CODE_ALT_CODONS_MAP[this.singleLetterCode].map(
      codonStr => new RNA(codonStr),
    );
  }

  /**
   * Checks if the given amino acid is the same amino acid regardless of the backing codon
   *
   * @param aminoAcid - The amino acid to check
   *
   * @returns True if the amino acid is the same (without checking the codon), false otherwise
   *
   * @example
   * ```typescript
   *  //comparing the same amino acid with the same codon
   *  new AminoAcid(new RNA('GCG')).isAlternateOf(new AminoAcid(new RNA('GCG'))); //returns false
   *  //comparing the same amino acid with alternate codons
   *  new AminoAcid(new RNA('GCA')).isAlternateOf(new AminoAcid(new RNA('GCC'))); //returns true
   * ```
   */
  isAlternateOf(aminoAcid: AminoAcid): boolean {
    return this.name === aminoAcid.name && !this.codon.equals(aminoAcid.codon);
  }

  /**
   * Checks if the given amino acid is the same, including the backing codon
   *
   * @param aminoAcid - The amino acid to check
   *
   * @returns True if the amino acid is the same (including the backing codon), false otherwise
   *
   * @example
   * ```typescript
   *  //comparing the same amino acid with the same codon
   *  new AminoAcid(new RNA('GCG')).equals(new AminoAcid(new RNA('GCG'))); //returns true
   *
   *  //comparing the same amino acid with alternate codons
   *  new AminoAcid(new RNA('GCA')).equals(new AminoAcid(new RNA('GCC'))); //returns false
   *
   *  //comparing different amino acids
   *  new AminoAcid(new RNA('UGC')).equals(new AminoAcid(new RNA('GCA'))); //returns false
   * ```
   */
  equals(aminoAcid: AminoAcid): boolean {
    return isDeepStrictEqual(this, aminoAcid);
  }
}
