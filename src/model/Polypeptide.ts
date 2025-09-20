import { MRNA, RNA } from './nucleic-acids/index.js';
import { AminoAcid } from './AminoAcid.js';
import { RNAtoAminoAcids } from '../utils/amino-acids.js';

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
   * Thrown if any codon is invalid (doesn't code for an amino acid and is not a stop codon)
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAAGGGAAAUAG', 'AUGAAAGGGAAAUAG', 1, 16);
   * const polypeptide = new Polypeptide(mRNA); // 4 codons: Met-Lys-Gly-Lys, stops at UAG
   * console.log(polypeptide.aminoAcidSequence.length); // 4
   * ```
   */
  constructor(mRNA: MRNA) {
    // Use the coding sequence for translation, which is biologically accurate
    const codingRNA = new RNA(mRNA.getCodingSequence());
    this.aminoAcidSequence = RNAtoAminoAcids(codingRNA);
    this.mRNA = mRNA;
  }

  /**
   * Returns the length of the polypeptide in amino acids
   *
   * @returns The number of amino acids in the sequence
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAAGGGAAAUAG', 'AUGAAAGGGAAAUAG', 1, 16);
   * const polypeptide = new Polypeptide(mRNA);
   * console.log(polypeptide.length()); // 4 amino acids
   * ```
   */
  length(): number {
    return this.aminoAcidSequence.length;
  }

  /**
   * Returns the single-letter amino acid sequence as a string
   *
   * @returns String representation of the amino acid sequence
   *
   * @example
   * ```typescript
   * const polypeptide = new Polypeptide(mRNA);
   * console.log(polypeptide.getSequence()); // 'MKGK' (single letter codes)
   * ```
   */
  getSequence(): string {
    return this.aminoAcidSequence.map(aa => aa.slc).join('');
  }

  /**
   * Checks if the polypeptide contains the specified amino acid subsequence
   *
   * @param subsequence - The amino acid subsequence to search for (string or Polypeptide)
   * @returns True if the subsequence is found, false otherwise
   *
   * @example
   * ```typescript
   * const polypeptide = new Polypeptide(mRNA); // sequence: 'MKGK'
   * console.log(polypeptide.contains('KG')); // true
   * console.log(polypeptide.contains('AA')); // false
   * ```
   */
  contains(subsequence: string | Polypeptide): boolean {
    const searchSequence =
      typeof subsequence === 'string' ? subsequence : subsequence.getSequence();
    return this.getSequence().includes(searchSequence);
  }

  /**
   * Checks if the polypeptide starts with the specified amino acid prefix
   *
   * @param prefix - The amino acid prefix to check for (string or Polypeptide)
   * @returns True if the sequence starts with the prefix, false otherwise
   *
   * @example
   * ```typescript
   * const polypeptide = new Polypeptide(mRNA); // sequence: 'MKGK'
   * console.log(polypeptide.startsWith('MK')); // true
   * console.log(polypeptide.startsWith('GK')); // false
   * ```
   */
  startsWith(prefix: string | Polypeptide): boolean {
    const prefixSequence = typeof prefix === 'string' ? prefix : prefix.getSequence();
    return this.getSequence().startsWith(prefixSequence);
  }

  /**
   * Checks if the polypeptide ends with the specified amino acid suffix
   *
   * @param suffix - The amino acid suffix to check for (string or Polypeptide)
   * @returns True if the sequence ends with the suffix, false otherwise
   *
   * @example
   * ```typescript
   * const polypeptide = new Polypeptide(mRNA); // sequence: 'MKGK'
   * console.log(polypeptide.endsWith('GK')); // true
   * console.log(polypeptide.endsWith('MK')); // false
   * ```
   */
  endsWith(suffix: string | Polypeptide): boolean {
    const suffixSequence = typeof suffix === 'string' ? suffix : suffix.getSequence();
    return this.getSequence().endsWith(suffixSequence);
  }

  /**
   * Returns the index of the first occurrence of the specified amino acid subsequence
   *
   * @param subsequence - The amino acid subsequence to search for (string or Polypeptide)
   * @param startPosition - The position to start searching from (default: 0)
   * @returns The index of the first occurrence, or -1 if not found
   *
   * @example
   * ```typescript
   * const polypeptide = new Polypeptide(mRNA); // sequence: 'MKGK'
   * console.log(polypeptide.indexOf('K')); // 1 (first K)
   * console.log(polypeptide.indexOf('K', 2)); // 3 (second K)
   * console.log(polypeptide.indexOf('AA')); // -1 (not found)
   * ```
   */
  indexOf(subsequence: string | Polypeptide, startPosition: number = 0): number {
    const searchSequence =
      typeof subsequence === 'string' ? subsequence : subsequence.getSequence();
    return this.getSequence().indexOf(searchSequence, startPosition);
  }

  /**
   * Returns a sub-polypeptide from the specified start position to the end position
   *
   * @param start - The starting position (inclusive, 0-based)
   * @param end - The ending position (exclusive, 0-based). If not specified, goes to end of sequence
   * @returns A new Polypeptide instance containing the amino acid subsequence
   *
   * @example
   * ```typescript
   * const polypeptide = new Polypeptide(mRNA); // sequence: 'MKGK'
   * const sub = polypeptide.getSubsequence(1, 3); // Creates polypeptide with 'KG'
   * console.log(sub.getSequence()); // 'KG'
   * ```
   */
  getSubsequence(start: number, end?: number): Polypeptide {
    const subAminoAcids = this.aminoAcidSequence.slice(start, end);

    // Create a minimal mRNA that would produce this subsequence
    const subSequence = subAminoAcids.map(aa => aa.codon.getSequence()).join('');
    // Add a stop codon to make it valid
    const fullSubSequence = subSequence + 'UAG';
    const subMRNA = new MRNA(fullSubSequence, fullSubSequence, 0, fullSubSequence.length);

    // Create new polypeptide and manually set the amino acid sequence
    const subPolypeptide = new Polypeptide(subMRNA);
    // Replace the sequence with our desired subsequence (without the stop codon effects)
    (
      subPolypeptide as Polypeptide & { aminoAcidSequence: typeof subAminoAcids }
    ).aminoAcidSequence = subAminoAcids;

    return subPolypeptide;
  }
}
