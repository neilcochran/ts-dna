import { isDeepStrictEqual } from 'util';
import { InvalidSequenceError } from '../model/errors/InvalidSequenceError.js';
import { describeRNAError } from './errors.js';
import { validateRNAString } from './internal-validation.js';
import { UNSAFE_RNA_KEY } from './internal-keys.js';

/**
 * A single-stranded RNA sequence over the alphabet `{A, C, G, U}`.
 *
 * Instances are immutable: the `sequence` field is `readonly` and every transformation
 * (`getSubsequence`, `getComplement`, `getReverseComplement`) returns a new `RNA`.
 *
 * The constructor validates and throws {@link InvalidSequenceError} on bad input. Prefer
 * {@link parseRNA} (which returns a `Result`) for untrusted input. The `MRNA` subclass calls
 * `super(sequence)` directly and benefits from the same validation.
 *
 * The constructor accepts an optional second parameter that is reserved for sequence-internal
 * trusted construction (the `unsafeRNA` factory). Public callers must not pass it; the key
 * is module-private and the parameter exists only to enable the bypass without an
 * `Object.create` hack.
 */
export class RNA {
  /** Validated, normalized (upper-case) RNA sequence. */
  public readonly sequence: string;

  /**
   * Runtime tag identifying this as RNA. Used by code paths that need to branch on alphabet
   * (e.g. pattern complement) without instanceof checks.
   */
  public readonly nucleicAcidType = 'RNA' as const;

  /**
   * Constructs an RNA instance with constructor-time validation.
   *
   * @param sequence - The RNA sequence string (case-insensitive; normalized to upper-case)
   * @param trustedKey - Sequence-internal construction key. Module-private; public callers
   * must not pass this. When supplied with the matching key, `sequence` is stored verbatim
   * with no validation. See {@link UNSAFE_RNA_KEY}.
   *
   * @throws {@link InvalidSequenceError} when `sequence` is empty or contains characters
   * outside the set A, C, G, U (case-insensitive)
   */
  constructor(sequence: string, trustedKey?: typeof UNSAFE_RNA_KEY) {
    if (trustedKey === UNSAFE_RNA_KEY) {
      this.sequence = sequence;
      return;
    }
    const outcome = validateRNAString(sequence);
    if (!outcome.ok) {
      throw new InvalidSequenceError(describeRNAError(outcome.error), sequence, 'RNA');
    }
    this.sequence = outcome.normalized;
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
   * @param subsequence - Subsequence to search for, as a string or RNA instance
   * @returns `true` if the subsequence appears anywhere in this sequence
   */
  contains(subsequence: string | RNA): boolean {
    const search = typeof subsequence === 'string' ? subsequence : subsequence.sequence;
    return this.sequence.includes(search);
  }

  /**
   * Reports whether this RNA sequence starts with a given prefix.
   *
   * @param prefix - Prefix to test, as a string or RNA instance
   * @returns `true` if the sequence starts with `prefix`
   */
  startsWith(prefix: string | RNA): boolean {
    const value = typeof prefix === 'string' ? prefix : prefix.sequence;
    return this.sequence.startsWith(value);
  }

  /**
   * Reports whether this RNA sequence ends with a given suffix.
   *
   * @param suffix - Suffix to test, as a string or RNA instance
   * @returns `true` if the sequence ends with `suffix`
   */
  endsWith(suffix: string | RNA): boolean {
    const value = typeof suffix === 'string' ? suffix : suffix.sequence;
    return this.sequence.endsWith(value);
  }

  /**
   * Returns the first index of a subsequence in this RNA, or `-1` if not present.
   *
   * @param subsequence - Subsequence to search for, as a string or RNA instance
   * @param startPosition - Position to start the search from (default `0`)
   * @returns Index of the first match, or `-1`
   */
  indexOf(subsequence: string | RNA, startPosition: number = 0): number {
    const search = typeof subsequence === 'string' ? subsequence : subsequence.sequence;
    return this.sequence.indexOf(search, startPosition);
  }

  /**
   * Reports structural equality with another RNA instance.
   *
   * Compares all enumerable fields (currently `sequence` and `nucleicAcidType`). Two
   * instances with identical sequences are equal even if they are different object
   * references.
   *
   * @param other - The RNA to compare against
   * @returns `true` if the two instances are structurally equal
   */
  equals(other: RNA): boolean {
    return isDeepStrictEqual(this, other);
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
    const complement = RNA_COMPLEMENT_MAP[base];
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
    const complement = RNA_COMPLEMENT_MAP[base];
    if (complement === undefined) {
      throw new Error(`RNA complement encountered invalid base '${base}' at index ${i}`);
    }
    result += complement;
  }
  return result;
}
