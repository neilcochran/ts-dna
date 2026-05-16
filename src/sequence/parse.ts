import { Result, success, failure } from '../result/index.js';
import { DNA } from './DNA.js';
import { RNA } from './RNA.js';
import { DoubleStrandedDNA } from './DoubleStrandedDNA.js';
import type { DNAError, RNAError, DoubleStrandedError } from './errors.js';
import { validateDNAString, validateRNAString } from './internal-validation.js';
import { UNSAFE_DNA_KEY, UNSAFE_RNA_KEY, UNSAFE_DSDNA_KEY } from './internal-keys.js';

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

/**
 * Validates that a pair of {@link DNA} strands form a valid double-stranded duplex.
 *
 * The pair is valid when both strands have the same length and the reverse strand (read
 * 5'-to-3') equals the reverse complement of the forward strand (read 5'-to-3'). Equivalently,
 * `reverse.sequence === forward.getReverseComplement().sequence`.
 *
 * @param forward - Forward strand of the duplex, oriented 5'-to-3'
 * @param reverse - Reverse strand of the duplex, oriented 5'-to-3'; must equal
 * `forward.getReverseComplement()`
 * @returns `Result.success` containing a `DoubleStrandedDNA` when the strands form a duplex;
 * `Result.failure` carrying a {@link DoubleStrandedError} otherwise
 *
 * @example
 * ```typescript
 * const forward = parseDNA('ATCG').unwrap();
 * const reverse = parseDNA('CGAT').unwrap();
 * const result = parseDoubleStrandedDNA(forward, reverse);
 * if (result.success) {
 *   result.data.forward.sequence; // 'ATCG'
 *   result.data.reverse.sequence; // 'CGAT'
 * }
 * ```
 */
export function parseDoubleStrandedDNA(
  forward: DNA,
  reverse: DNA,
): Result<DoubleStrandedDNA, DoubleStrandedError> {
  if (forward.sequence.length !== reverse.sequence.length) {
    return failure({
      kind: 'length-mismatch',
      forwardLength: forward.sequence.length,
      reverseLength: reverse.sequence.length,
    });
  }
  const expected = forward.getReverseComplement().sequence;
  if (expected !== reverse.sequence) {
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== reverse.sequence[i]) {
        return failure({
          kind: 'not-complementary',
          firstMismatchAt: i,
          expected: expected[i],
          actual: reverse.sequence[i],
        });
      }
    }
  }
  return success(unsafeDoubleStrandedDNA(forward, reverse));
}

/**
 * Constructs a {@link DoubleStrandedDNA} from a single forward strand, synthesizing the
 * reverse strand as the reverse complement of the input.
 *
 * Infallible: the input is already a validated {@link DNA}, and the reverse-complement
 * derivation cannot fail. Use this when you only have one strand and want a duplex (the
 * common case for replication callers); use {@link parseDoubleStrandedDNA} when you have a
 * pair of strands and need to validate they form a duplex.
 *
 * @param forward - Forward strand of the duplex, oriented 5'-to-3'
 * @returns A new `DoubleStrandedDNA` with the synthesized reverse strand
 *
 * @example
 * ```typescript
 * const forward = parseDNA('ATCG').unwrap();
 * const duplex = doubleStrandedDNA(forward);
 * duplex.reverse.sequence; // 'CGAT'
 * ```
 */
export function doubleStrandedDNA(forward: DNA): DoubleStrandedDNA {
  return unsafeDoubleStrandedDNA(forward, forward.getReverseComplement());
}

/**
 * Constructs a {@link DoubleStrandedDNA} without re-validating the pair. Reserved for
 * sequence-internal callers that already know the two strands form a duplex. Not exported
 * from the package barrel.
 *
 * @internal
 *
 * @param forward - Pre-validated forward strand
 * @param reverse - Pre-validated reverse strand, complementary to `forward`
 * @returns A new `DoubleStrandedDNA` with no validation
 */
export function unsafeDoubleStrandedDNA(forward: DNA, reverse: DNA): DoubleStrandedDNA {
  return new DoubleStrandedDNA(forward, reverse, UNSAFE_DSDNA_KEY);
}
