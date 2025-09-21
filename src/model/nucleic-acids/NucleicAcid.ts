import { isDeepStrictEqual } from 'util';
import { getComplementSequence } from '../../utils/complement.js';
import { NucleicAcidType } from '../../enums/nucleic-acid-type.js';

/**
 * An abstract class representing a general nucleic acid (a sequence of nucleotides)
 */
export abstract class NucleicAcid {
  readonly nucleicAcidType: NucleicAcidType;

  /**
   * @param nucleicAcidType - The type of NucleicAcid
   */
  constructor(nucleicAcidType: NucleicAcidType) {
    this.nucleicAcidType = nucleicAcidType;
  }

  abstract getSequence(): string;

  /**
   * Returns the complement of the sequence
   *
   * @returns String representing the complement of the sequence
   */
  getComplementSequence(): string {
    return getComplementSequence(this.getSequence(), this.nucleicAcidType) ?? '';
  }

  /**
   * Returns the length of the nucleic acid sequence
   *
   * @returns The length of the sequence in nucleotides/base pairs
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCG');
   * console.log(dna.length()); // 4
   * ```
   */
  length(): number {
    return this.getSequence().length;
  }

  /**
   * Checks if the sequence contains the specified subsequence
   *
   * @param subsequence - The subsequence to search for (string or same nucleic acid type)
   * @returns True if the subsequence is found, false otherwise
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCGATCG');
   * console.log(dna.contains('TCG')); // true
   * console.log(dna.contains('AAA')); // false
   * ```
   */
  contains(subsequence: string | NucleicAcid): boolean {
    const searchSequence =
      typeof subsequence === 'string' ? subsequence : subsequence.getSequence();
    return this.getSequence().includes(searchSequence);
  }

  /**
   * Checks if the sequence starts with the specified prefix
   *
   * @param prefix - The prefix to check for (string or same nucleic acid type)
   * @returns True if the sequence starts with the prefix, false otherwise
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCGATCG');
   * console.log(dna.startsWith('ATC')); // true
   * console.log(dna.startsWith('GTC')); // false
   * ```
   */
  startsWith(prefix: string | NucleicAcid): boolean {
    const prefixSequence = typeof prefix === 'string' ? prefix : prefix.getSequence();
    return this.getSequence().startsWith(prefixSequence);
  }

  /**
   * Checks if the sequence ends with the specified suffix
   *
   * @param suffix - The suffix to check for (string or same nucleic acid type)
   * @returns True if the sequence ends with the suffix, false otherwise
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCGATCG');
   * console.log(dna.endsWith('TCG')); // true
   * console.log(dna.endsWith('ATC')); // false
   * ```
   */
  endsWith(suffix: string | NucleicAcid): boolean {
    const suffixSequence = typeof suffix === 'string' ? suffix : suffix.getSequence();
    return this.getSequence().endsWith(suffixSequence);
  }

  /**
   * Returns the index of the first occurrence of the specified subsequence
   *
   * @param subsequence - The subsequence to search for (string or same nucleic acid type)
   * @param startPosition - The position to start searching from (default: 0)
   * @returns The index of the first occurrence, or -1 if not found
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCGATCG');
   * console.log(dna.indexOf('TCG')); // 1
   * console.log(dna.indexOf('TCG', 2)); // 5
   * console.log(dna.indexOf('AAA')); // -1
   * ```
   */
  indexOf(subsequence: string | NucleicAcid, startPosition: number = 0): number {
    const searchSequence =
      typeof subsequence === 'string' ? subsequence : subsequence.getSequence();
    return this.getSequence().indexOf(searchSequence, startPosition);
  }

  /**
   * Returns a subsequence from the specified start position to the end position
   *
   * @param start - The starting position (inclusive, 0-based)
   * @param end - The ending position (exclusive, 0-based). If not specified, goes to end of sequence
   * @returns A new instance of the same nucleic acid type containing the subsequence
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCGATCG');
   * const sub = dna.getSubsequence(2, 5); // Creates new DNA with 'CGA'
   * console.log(sub.getSequence()); // 'CGA'
   * ```
   */
  abstract getSubsequence(start: number, end?: number): NucleicAcid;

  /**
   * Checks if the given NucleicAcid is equal
   *
   * @param nucleicAcid - The NucleicAcid to compare
   *
   * @returns True if the NucleicAcids are equal, false otherwise
   */
  equals(nucleicAcid: NucleicAcid): boolean {
    return isDeepStrictEqual(this, nucleicAcid);
  }
}
