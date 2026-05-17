/**
 * Module-private trusted constructors for the `sequence/` domain types. Reserved for callers
 * that have already validated their inputs (via `parseDNA` / `parseRNA` /
 * `parseDoubleStrandedDNA` or by construction-mathematics — substrings of validated DNA, etc.)
 * and want to skip the re-validation cost.
 *
 * Not re-exported from `src/sequence/index.ts`; package consumers reach the validated
 * construction path through `parseDNA` / `parseRNA` / `parseDoubleStrandedDNA` /
 * `doubleStrandedDNA`. Other in-tree modules import these factories directly from this file.
 *
 * @internal
 */

import { DNA } from './DNA.js';
import { RNA } from './RNA.js';
import { DoubleStrandedDNA } from './DoubleStrandedDNA.js';
import { UNSAFE_DNA_KEY, UNSAFE_RNA_KEY, UNSAFE_DSDNA_KEY } from './internal-keys.js';

/**
 * Constructs a {@link DNA} without re-validating the input. Reserved for sequence-internal
 * callers that already know the input is well-formed (e.g. after slicing a validated DNA,
 * after computing a complement).
 *
 * @param sequence - A pre-validated, normalized (upper-case) DNA sequence
 * @returns A new `DNA` wrapping the sequence with no validation
 *
 * @internal
 */
export function unsafeDNA(sequence: string): DNA {
  return new DNA(sequence, UNSAFE_DNA_KEY);
}

/**
 * Constructs an {@link RNA} without re-validating the input. Reserved for sequence-internal
 * callers that already know the input is well-formed (e.g. after slicing a validated RNA,
 * after computing a complement).
 *
 * @param sequence - A pre-validated, normalized (upper-case) RNA sequence
 * @returns A new `RNA` wrapping the sequence with no validation
 *
 * @internal
 */
export function unsafeRNA(sequence: string): RNA {
  return new RNA(sequence, UNSAFE_RNA_KEY);
}

/**
 * Constructs a {@link DoubleStrandedDNA} without re-validating the pair. Reserved for
 * sequence-internal callers that already know the two strands form a duplex.
 *
 * @param forward - Pre-validated forward strand
 * @param reverse - Pre-validated reverse strand, complementary to `forward`
 * @returns A new `DoubleStrandedDNA` with no validation
 *
 * @internal
 */
export function unsafeDoubleStrandedDNA(forward: DNA, reverse: DNA): DoubleStrandedDNA {
  return new DoubleStrandedDNA(forward, reverse, UNSAFE_DSDNA_KEY);
}
