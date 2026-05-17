import { NucleicAcidImpl } from './internal-nucleic-acid-impl.js';
import { UNSAFE_DNA_KEY } from './internal-keys.js';

const DNA_COMPLEMENT_MAP: Readonly<Record<string, string>> = Object.freeze({
  A: 'T',
  T: 'A',
  C: 'G',
  G: 'C',
});

/**
 * A double-helix-strand DNA sequence over the alphabet `{A, C, G, T}`.
 *
 * Instances are immutable: the `sequence` field is `readonly` and every transformation
 * (`getSubsequence`, `getComplement`, `getReverseComplement`) returns a new `DNA`. All the
 * methods (substring / complement / containment / equality) come from the shared
 * {@link NucleicAcidImpl} base; `DNA` only contributes the alphabet-specific complement table
 * and a sentinel-gated constructor.
 *
 * Public callers construct instances via {@link parseDNA}; the constructor is gated by a
 * module-private sentinel.
 */
export class DNA extends NucleicAcidImpl<DNA> {
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
    super(sequence, DNA_COMPLEMENT_MAP);
  }

  /**
   * Builds a new `DNA` over a pre-validated sequence. Implements the base class's abstract
   * factory so Self-returning methods (`getSubsequence`, `getComplement`,
   * `getReverseComplement`) produce a `DNA` without re-running validation.
   *
   * @param sequence - Pre-validated, normalized (upper-case) DNA sequence
   * @returns A new `DNA` over the sequence
   *
   * @internal
   */
  protected clone(sequence: string): DNA {
    return new DNA(sequence, UNSAFE_DNA_KEY);
  }
}
