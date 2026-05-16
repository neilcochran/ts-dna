import type { MRNA } from '../processing/index.js';
import type { AminoAcid } from './AminoAcid.js';
import { UNSAFE_POLYPEPTIDE_KEY } from './internal-keys.js';

/**
 * A polypeptide: the ordered amino-acid product of translating an mRNA's coding sequence.
 *
 * Composition over inheritance: a `Polypeptide` *has* an mRNA and an amino-acid sequence; it
 * is not a kind of sequence. Translation terminates at the first in-frame stop codon, so the
 * stored amino-acid sequence may be shorter than `mRNA.codingSequence.length / 3`.
 *
 * Public construction goes through the `translate` pipeline; the constructor is gated by a
 * module-private sentinel.
 */
export class Polypeptide {
  /** The mRNA whose coding sequence produced this polypeptide. */
  public readonly mRNA: MRNA;

  /** Ordered amino acids, terminating at (but not including) the first in-frame stop codon. */
  public readonly aminoAcids: readonly AminoAcid[];

  /**
   * Constructs a `Polypeptide`. Module-private; public callers must go through `translate`.
   *
   * @param mRNA - The mRNA whose coding sequence produced this polypeptide
   * @param aminoAcids - The validated, in-order amino-acid sequence
   * @param trustedKey - Sentinel proving the caller is `translation/`-internal
   *
   * @internal
   */
  constructor(
    mRNA: MRNA,
    aminoAcids: readonly AminoAcid[],
    trustedKey: typeof UNSAFE_POLYPEPTIDE_KEY,
  ) {
    if (trustedKey !== UNSAFE_POLYPEPTIDE_KEY) {
      throw new Error('Polypeptide must be constructed via translate');
    }
    this.mRNA = mRNA;
    this.aminoAcids = aminoAcids;
  }

  /**
   * Returns the polypeptide as a single-letter-code string (e.g. `'MKGK'`).
   *
   * @returns Concatenated single-letter amino-acid codes
   */
  getSequence(): string {
    let result = '';
    for (const aa of this.aminoAcids) {
      result += aa.data.singleLetterCode;
    }
    return result;
  }

  /**
   * Reports whether this polypeptide contains the given single-letter amino-acid
   * subsequence.
   *
   * @param subsequence - The subsequence to search for (string or {@link Polypeptide})
   * @returns `true` if the subsequence appears anywhere in the single-letter sequence
   */
  contains(subsequence: string | Polypeptide): boolean {
    const search = typeof subsequence === 'string' ? subsequence : subsequence.getSequence();
    return this.getSequence().includes(search);
  }

  /**
   * Reports whether this polypeptide starts with the given single-letter amino-acid prefix.
   *
   * @param prefix - The prefix to test (string or {@link Polypeptide})
   * @returns `true` if the single-letter sequence starts with `prefix`
   */
  startsWith(prefix: string | Polypeptide): boolean {
    const value = typeof prefix === 'string' ? prefix : prefix.getSequence();
    return this.getSequence().startsWith(value);
  }

  /**
   * Reports whether this polypeptide ends with the given single-letter amino-acid suffix.
   *
   * @param suffix - The suffix to test (string or {@link Polypeptide})
   * @returns `true` if the single-letter sequence ends with `suffix`
   */
  endsWith(suffix: string | Polypeptide): boolean {
    const value = typeof suffix === 'string' ? suffix : suffix.getSequence();
    return this.getSequence().endsWith(value);
  }

  /**
   * Returns the first index of the given single-letter amino-acid subsequence, or `-1` if
   * the subsequence does not appear.
   *
   * @param subsequence - The subsequence to search for (string or {@link Polypeptide})
   * @param startPosition - 0-based position to start searching from (default `0`)
   * @returns Index of the first match, or `-1`
   */
  indexOf(subsequence: string | Polypeptide, startPosition: number = 0): number {
    const search = typeof subsequence === 'string' ? subsequence : subsequence.getSequence();
    return this.getSequence().indexOf(search, startPosition);
  }
}
