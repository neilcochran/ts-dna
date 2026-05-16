import { isDeepStrictEqual } from 'util';
import { UNSAFE_DNA_KEY } from './internal-keys.js';

/**
 * A double-helix-strand DNA sequence over the alphabet `{A, C, G, T}`.
 *
 * Instances are immutable: the `sequence` field is `readonly` and every transformation
 * (`getSubsequence`, `getComplement`, `getReverseComplement`) returns a new `DNA`.
 *
 * Public callers construct instances via {@link parseDNA}; the constructor is gated by a
 * module-private sentinel.
 */
export class DNA {
  /** Validated, normalized (upper-case) DNA sequence. */
  public readonly sequence: string;

  /**
   * Runtime tag identifying this as DNA. Used by code paths that need to branch on alphabet
   * (e.g. pattern complement) without instanceof checks.
   */
  public readonly nucleicAcidType = 'DNA' as const;

  /**
   * Constructs a `DNA`. Module-private; public callers must go through {@link parseDNA}.
   *
   * @param sequence - A pre-validated, normalized (upper-case) DNA sequence
   * @param trustedKey - Sentinel proving the caller is `sequence/`-internal
   *
   * @internal
   */
  constructor(sequence: string, trustedKey: typeof UNSAFE_DNA_KEY) {
    if (trustedKey !== UNSAFE_DNA_KEY) {
      throw new Error('DNA must be constructed via parseDNA');
    }
    this.sequence = sequence;
  }

  /**
   * Returns the validated DNA sequence string.
   *
   * @returns The DNA sequence, upper-case
   */
  getSequence(): string {
    return this.sequence;
  }

  /**
   * Returns the length of this DNA sequence in nucleotides.
   *
   * @returns Sequence length
   */
  length(): number {
    return this.sequence.length;
  }

  /**
   * Returns a new DNA carrying the substring `[start, end)` of this sequence.
   *
   * @param start - 0-based start position (inclusive)
   * @param end - 0-based end position (exclusive); defaults to the end of the sequence
   * @returns A new DNA over the substring
   */
  getSubsequence(start: number, end?: number): DNA {
    return new DNA(this.sequence.substring(start, end), UNSAFE_DNA_KEY);
  }

  /**
   * Returns a new DNA carrying the Watson-Crick complement of this sequence
   * (A&lt;-&gt;T, C&lt;-&gt;G), preserving order.
   *
   * @returns A new DNA over the complement
   */
  getComplement(): DNA {
    return new DNA(complementDNAString(this.sequence), UNSAFE_DNA_KEY);
  }

  /**
   * Returns a new DNA carrying the reverse complement of this sequence
   * (Watson-Crick complement, then reversed). Represents the opposite strand of a duplex.
   *
   * @returns A new DNA over the reverse complement
   */
  getReverseComplement(): DNA {
    return new DNA(reverseComplementDNAString(this.sequence), UNSAFE_DNA_KEY);
  }

  /**
   * Reports whether this DNA sequence contains a given subsequence.
   *
   * @param subsequence - Subsequence to search for, as a string or DNA instance
   * @returns `true` if the subsequence appears anywhere in this sequence
   */
  contains(subsequence: string | DNA): boolean {
    const search = typeof subsequence === 'string' ? subsequence : subsequence.sequence;
    return this.sequence.includes(search);
  }

  /**
   * Reports whether this DNA sequence starts with a given prefix.
   *
   * @param prefix - Prefix to test, as a string or DNA instance
   * @returns `true` if the sequence starts with `prefix`
   */
  startsWith(prefix: string | DNA): boolean {
    const value = typeof prefix === 'string' ? prefix : prefix.sequence;
    return this.sequence.startsWith(value);
  }

  /**
   * Reports whether this DNA sequence ends with a given suffix.
   *
   * @param suffix - Suffix to test, as a string or DNA instance
   * @returns `true` if the sequence ends with `suffix`
   */
  endsWith(suffix: string | DNA): boolean {
    const value = typeof suffix === 'string' ? suffix : suffix.sequence;
    return this.sequence.endsWith(value);
  }

  /**
   * Returns the first index of a subsequence in this DNA, or `-1` if not present.
   *
   * @param subsequence - Subsequence to search for, as a string or DNA instance
   * @param startPosition - Position to start the search from (default `0`)
   * @returns Index of the first match, or `-1`
   */
  indexOf(subsequence: string | DNA, startPosition: number = 0): number {
    const search = typeof subsequence === 'string' ? subsequence : subsequence.sequence;
    return this.sequence.indexOf(search, startPosition);
  }

  /**
   * Reports structural equality with another DNA instance.
   *
   * Compares all enumerable fields (currently `sequence` and `nucleicAcidType`). Two
   * instances with identical sequences are equal even if they are different object
   * references.
   *
   * @param other - The DNA to compare against
   * @returns `true` if the two instances are structurally equal
   */
  equals(other: DNA): boolean {
    return isDeepStrictEqual(this, other);
  }
}

const DNA_COMPLEMENT_MAP: Readonly<Record<string, string>> = Object.freeze({
  A: 'T',
  T: 'A',
  C: 'G',
  G: 'C',
});

function complementDNAString(sequence: string): string {
  let result = '';
  for (let i = 0; i < sequence.length; i++) {
    const base = sequence[i];
    const complement = DNA_COMPLEMENT_MAP[base];
    if (complement === undefined) {
      throw new Error(`DNA complement encountered invalid base '${base}' at index ${i}`);
    }
    result += complement;
  }
  return result;
}

function reverseComplementDNAString(sequence: string): string {
  let result = '';
  for (let i = sequence.length - 1; i >= 0; i--) {
    const base = sequence[i];
    const complement = DNA_COMPLEMENT_MAP[base];
    if (complement === undefined) {
      throw new Error(`DNA complement encountered invalid base '${base}' at index ${i}`);
    }
    result += complement;
  }
  return result;
}
