import { NucleicAcidImpl } from './internal-nucleic-acid-impl.js';

/**
 * Module-private construction key gating the {@link RNA} constructor. Not re-exported from
 * the package barrel; only files inside `src/` reach it via {@link unsafeRNA}.
 *
 * @internal
 */
const UNSAFE_RNA_KEY: unique symbol = Symbol('unsafe-rna');

const RNA_COMPLEMENT_MAP: Readonly<Record<string, string>> = Object.freeze({
  A: 'U',
  U: 'A',
  C: 'G',
  G: 'C',
});

/**
 * A single-stranded RNA sequence over the alphabet `{A, C, G, U}`.
 *
 * Instances are immutable: the `sequence` field is `readonly` and every transformation
 * (`getSubsequence`, `getComplement`, `getReverseComplement`) returns a new `RNA`. All the
 * methods (substring / complement / containment / equality) come from the shared
 * {@link NucleicAcidImpl} base; `RNA` only contributes the alphabet-specific complement table
 * and a sentinel-gated constructor.
 *
 * Public callers construct instances via {@link parseRNA}; the constructor is gated by a
 * module-private sentinel.
 */
export class RNA extends NucleicAcidImpl<RNA> {
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
    super(sequence, RNA_COMPLEMENT_MAP);
  }

  /**
   * Builds a new `RNA` over a pre-validated sequence. Implements the base class's abstract
   * factory so Self-returning methods (`getSubsequence`, `getComplement`,
   * `getReverseComplement`) produce an `RNA` without re-running validation.
   *
   * @param sequence - Pre-validated, normalized (upper-case) RNA sequence
   * @returns A new `RNA` over the sequence
   *
   * @internal
   */
  protected clone(sequence: string): RNA {
    return new RNA(sequence, UNSAFE_RNA_KEY);
  }
}

/**
 * Constructs an {@link RNA} without re-validating the input. Reserved for in-tree callers
 * that already know the input is well-formed (e.g. after slicing a validated RNA, after
 * computing a complement). Package consumers must use {@link parseRNA} instead.
 *
 * @param sequence - A pre-validated, normalized (upper-case) RNA sequence
 * @returns A new `RNA` wrapping the sequence with no validation
 *
 * @internal
 */
export function unsafeRNA(sequence: string): RNA {
  return new RNA(sequence, UNSAFE_RNA_KEY);
}
