import { Result, success, failure } from '../result/index.js';
import type { ReadingFrameError } from './errors.js';

/**
 * Length of a codon in nucleotides. Always 3 for the standard genetic code.
 */
export const CODON_LENGTH = 3;

/**
 * The canonical start codon (RNA alphabet). Codes for methionine and initiates translation.
 */
export const START_CODON = 'AUG';

/**
 * The three RNA stop codons in the standard genetic code. Stop codons do not code for an
 * amino acid; they signal translation termination.
 */
export type StopCodon = 'UAA' | 'UAG' | 'UGA';

/**
 * The full set of RNA stop codons. Frozen so callers cannot mutate the shared array.
 */
export const STOP_CODONS: readonly StopCodon[] = Object.freeze(['UAA', 'UAG', 'UGA'] as const);

/**
 * Type predicate identifying RNA stop codons.
 *
 * @param codon - A candidate codon string (any length; only 3-character matches return true)
 * @returns `true` if `codon` is one of `UAA`, `UAG`, `UGA`, narrowing to {@link StopCodon}
 *
 * @example
 * ```typescript
 * isStopCodon('UAA'); // true
 * isStopCodon('AUG'); // false
 * ```
 */
export function isStopCodon(codon: string): codon is StopCodon {
  return codon === 'UAA' || codon === 'UAG' || codon === 'UGA';
}

/**
 * Validates that an RNA-coding region aligns to the reading frame.
 *
 * The coding region is the slice of the RNA sequence from `expectedStart` (default `0`) to
 * the end. Its length must be a positive multiple of {@link CODON_LENGTH}. When `expectedStart`
 * is `0`, the validator additionally requires the first three nucleotides to be the
 * {@link START_CODON} (`AUG`).
 *
 * @param sequence - The RNA sequence string to validate
 * @param expectedStart - 0-based position at which the coding region begins (default `0`)
 * @returns A `Result` whose success branch carries `void` (no payload) and whose failure
 * branch carries a structured {@link ReadingFrameError}
 *
 * @example
 * ```typescript
 * const result = validateReadingFrame('AUGAAACCC');
 * if (result.success) {
 *   // frame is valid
 * }
 * ```
 */
export function validateReadingFrame(
  sequence: string,
  expectedStart: number = 0,
): Result<void, ReadingFrameError> {
  const codingLength = sequence.length - expectedStart;
  if (codingLength % CODON_LENGTH !== 0) {
    return failure({
      kind: 'frame-misaligned',
      codingLength,
      codonLength: CODON_LENGTH,
    });
  }

  if (expectedStart === 0 && sequence.length >= CODON_LENGTH) {
    const startCodon = sequence.substring(0, CODON_LENGTH);
    if (startCodon !== START_CODON) {
      return failure({
        kind: 'missing-start-codon',
        found: startCodon,
        position: 0,
      });
    }
  }

  return success(undefined);
}
