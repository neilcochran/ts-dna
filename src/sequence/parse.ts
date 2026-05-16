import { Result, success, failure } from '../result/index.js';
import { DNA } from './DNA.js';
import { RNA } from './RNA.js';
import type { DNAError, RNAError } from './errors.js';
import { validateDNAString, validateRNAString } from './internal-validation.js';
import { UNSAFE_DNA_KEY, UNSAFE_RNA_KEY } from './internal-keys.js';

/**
 * Parses an untrusted string as a {@link DNA} sequence.
 *
 * Accepts characters from `{A, C, G, T}` case-insensitively; the resulting `DNA` carries the
 * sequence in upper-case. The failure branch carries a structured {@link DNAError} so
 * callers can branch on the failure kind (`empty-sequence` vs `invalid-characters`) and
 * inspect the offending characters.
 *
 * @param input - Untrusted candidate sequence string
 * @returns `Result` whose success branch carries a `DNA` and whose failure branch carries
 * a `DNAError`
 *
 * @example
 * ```typescript
 * const result = parseDNA('atcg');
 * if (result.success) {
 *   console.log(result.data.sequence); // 'ATCG'
 * }
 * ```
 */
export function parseDNA(input: string): Result<DNA, DNAError> {
  const outcome = validateDNAString(input);
  if (!outcome.ok) {
    return failure(outcome.error);
  }
  return success(unsafeDNA(outcome.normalized));
}

/**
 * Parses an untrusted string as an {@link RNA} sequence.
 *
 * Accepts characters from `{A, C, G, U}` case-insensitively; the resulting `RNA` carries the
 * sequence in upper-case. The failure branch carries a structured {@link RNAError} so
 * callers can branch on the failure kind (`empty-sequence` vs `invalid-characters`) and
 * inspect the offending characters.
 *
 * @param input - Untrusted candidate sequence string
 * @returns `Result` whose success branch carries an `RNA` and whose failure branch carries
 * an `RNAError`
 *
 * @example
 * ```typescript
 * const result = parseRNA('aucg');
 * if (result.success) {
 *   console.log(result.data.sequence); // 'AUCG'
 * }
 * ```
 */
export function parseRNA(input: string): Result<RNA, RNAError> {
  const outcome = validateRNAString(input);
  if (!outcome.ok) {
    return failure(outcome.error);
  }
  return success(unsafeRNA(outcome.normalized));
}

/**
 * Constructs a {@link DNA} without re-validating the input. Reserved for sequence-internal
 * callers that already know the input is well-formed (e.g. after slicing a validated DNA,
 * after computing a complement). Not exported from the package barrel.
 *
 * @internal
 *
 * @param sequence - A pre-validated, normalized (upper-case) DNA sequence
 * @returns A new `DNA` wrapping the sequence with no validation
 */
export function unsafeDNA(sequence: string): DNA {
  return new DNA(sequence, UNSAFE_DNA_KEY);
}

/**
 * Constructs an {@link RNA} without re-validating the input. Reserved for sequence-internal
 * callers that already know the input is well-formed (e.g. after slicing a validated RNA,
 * after computing a complement). Not exported from the package barrel.
 *
 * @internal
 *
 * @param sequence - A pre-validated, normalized (upper-case) RNA sequence
 * @returns A new `RNA` wrapping the sequence with no validation
 */
export function unsafeRNA(sequence: string): RNA {
  return new RNA(sequence, UNSAFE_RNA_KEY);
}
