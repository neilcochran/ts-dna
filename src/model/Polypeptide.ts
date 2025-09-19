import { MRNA, RNA } from './nucleic-acids';
import { AminoAcid } from './AminoAcid';
import { RNAtoAminoAcids } from '../utils/amino-acids';

/**
 * A class representing a polypeptide. It has a sequence of amino acids and an mRNA sequence that contains the coding sequence.
 * The constructor enforces validation, and all members are readonly. Therefore, all Polypeptide objects can only exist in a valid state.
 *
 * Biologically accurate: Translation occurs from mature mRNA, not pre-mRNA or other RNA types.
 */
export class Polypeptide {
  public readonly aminoAcidSequence: AminoAcid[];
  public readonly mRNA: MRNA;

  /**
   * @param mRNA - A mature mRNA sequence that codes for a sequence of amino acids
   *
   * @throws {@link InvalidSequenceError}
   * Thrown if the mRNA coding sequence length is not divisible by 3 (invalid codons)
   *
   * @throws {@link InvalidCodonError}
   * Thrown if any codon is invalid (doesn't code for an amino acid)
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAAGGGAAA', 'AUGAAAGGG', 1, 10);
   * const polypeptide = new Polypeptide(mRNA); // 3 codons: Met-Lys-Gly
   * console.log(polypeptide.aminoAcidSequence.length); // 3
   * ```
   */
  constructor(mRNA: MRNA) {
    // Use the coding sequence for translation, which is biologically accurate
    const codingRNA = new RNA(mRNA.getCodingSequence());
    this.aminoAcidSequence = RNAtoAminoAcids(codingRNA);
    this.mRNA = mRNA;
  }
}
