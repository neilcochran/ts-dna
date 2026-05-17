import { UNSAFE_RNA_KEY } from './internal-keys.js';

/**
 * A single-stranded RNA sequence over the alphabet `{A, C, G, U}`.
 *
 * Instances are immutable: the `sequence` field is `readonly` and every transformation
 * (`getSubsequence`, `getComplement`, `getReverseComplement`) returns a new `RNA`.
 *
 * Public callers construct instances via {@link parseRNA}; the constructor is gated by a
 * module-private sentinel.
 */
export class RNA {
  /** Validated, normalized (upper-case) RNA sequence. */
  public readonly sequence: string;

  /**
   * Constructs an `RNA`. Module-private; public callers must go through {@link parseRNA}.
   *
   * @param sequence - A pre-validated, normalized (upper-case) RNA sequence
   * @param trustedKey - Sentinel proving the caller is `sequence/`-internal
   *
   * @internal
   */
  constructor(sequence: string, trustedKey: typeof UNSAFE_RNA_KEY) {
    if (trustedKey !== UNSAFE_RNA_KEY) {
      throw new Error('RNA must be constructed via parseRNA');
    }
    this.sequence = sequence;
  }

  /**
   * Returns the validated RNA sequence string.
   *
   * @returns The RNA sequence, upper-case
   */
  getSequence(): string {
    return this.sequence;
  }

  /**
   * Returns the length of this RNA sequence in nucleotides.
   *
   * @returns Sequence length
   */
  length(): number {
    return this.sequence.length;
  }

  /**
   * Returns a new RNA carrying the substring `[start, end)` of this sequence.
   *
   * @param start - 0-based start position (inclusive)
   * @param end - 0-based end position (exclusive); defaults to the end of the sequence
   * @returns A new RNA over the substring
   */
  getSubsequence(start: number, end?: number): RNA {
    return new RNA(this.sequence.substring(start, end), UNSAFE_RNA_KEY);
  }

  /**
   * Returns a new RNA carrying the Watson-Crick complement of this sequence
   * (A&lt;-&gt;U, C&lt;-&gt;G), preserving order.
   *
   * @returns A new RNA over the complement
   */
  getComplement(): RNA {
    return new RNA(complementRNAString(this.sequence), UNSAFE_RNA_KEY);
  }

  /**
   * Returns a new RNA carrying the reverse complement of this sequence
   * (Watson-Crick complement, then reversed).
   *
   * @returns A new RNA over the reverse complement
   */
  getReverseComplement(): RNA {
    return new RNA(reverseComplementRNAString(this.sequence), UNSAFE_RNA_KEY);
  }

  /**
   * Reports whether this RNA sequence contains a given subsequence.
   *
   * @param subsequence - Subsequence to search for
   * @returns `true` if the subsequence appears anywhere in this sequence
   */
  contains(subsequence: RNA): boolean {
    return this.sequence.includes(subsequence.sequence);
  }

  /**
   * Reports whether this RNA sequence starts with a given prefix.
   *
   * @param prefix - Prefix to test
   * @returns `true` if the sequence starts with `prefix`
   */
  startsWith(prefix: RNA): boolean {
    return this.sequence.startsWith(prefix.sequence);
  }

  /**
   * Reports whether this RNA sequence ends with a given suffix.
   *
   * @param suffix - Suffix to test
   * @returns `true` if the sequence ends with `suffix`
   */
  endsWith(suffix: RNA): boolean {
    return this.sequence.endsWith(suffix.sequence);
  }

  /**
   * Returns the first index of a subsequence in this RNA, or `-1` if not present.
   *
   * @param subsequence - Subsequence to search for
   * @param startPosition - Position to start the search from (default `0`)
   * @returns Index of the first match, or `-1`
   */
  indexOf(subsequence: RNA, startPosition: number = 0): number {
    return this.sequence.indexOf(subsequence.sequence, startPosition);
  }

  /**
   * Reports structural equality with another RNA instance. Two RNAs are equal when their
   * sequence strings match.
   *
   * @param other - The RNA to compare against
   * @returns `true` if both sequences are identical
   */
  equals(other: RNA): boolean {
    return this.sequence === other.sequence;
  }
}

const RNA_COMPLEMENT_MAP: Readonly<Record<string, string>> = Object.freeze({
  A: 'U',
  U: 'A',
  C: 'G',
  G: 'C',
});

function complementRNAString(sequence: string): string {
  let result = '';
  for (let i = 0; i < sequence.length; i++) {
    const base = sequence[i];
    const complement = base === undefined ? undefined : RNA_COMPLEMENT_MAP[base];
    if (complement === undefined) {
      throw new Error(`RNA complement encountered invalid base '${base}' at index ${i}`);
    }
    result += complement;
  }
  return result;
}

function reverseComplementRNAString(sequence: string): string {
  let result = '';
  for (let i = sequence.length - 1; i >= 0; i--) {
    const base = sequence[i];
    const complement = base === undefined ? undefined : RNA_COMPLEMENT_MAP[base];
    if (complement === undefined) {
      throw new Error(`RNA complement encountered invalid base '${base}' at index ${i}`);
    }
    result += complement;
  }
  return result;
}
