import { Result, success, failure, isFailure } from '../result/index.js';
import { parseRNA, CODON_LENGTH, isStopCodon } from '../sequence/index.js';
import { unsafeRNA } from '../sequence/parse.js';
import type { RNA } from '../sequence/index.js';
import { AminoAcid } from './AminoAcid.js';
import type { AminoAcidData } from './AminoAcidData.js';
import { AMINO_ACID_BY_CODON } from './amino-acids.js';
import { UNSAFE_AMINO_ACID_KEY } from './internal-keys.js';
import type { TranslationError } from './errors.js';

/**
 * Parses an RNA codon string into a validated {@link AminoAcid}.
 *
 * The codon is validated against the RNA alphabet, checked for length, and rejected if it is
 * a stop codon (stop codons do not code for any amino acid). The function never throws;
 * untrusted callers go through this path exclusively.
 *
 * @param codon - The 3-character RNA codon string (case-insensitive; uppercased internally)
 * @returns `Result.success` containing the `AminoAcid`, or `Result.failure` with a structured
 * {@link TranslationError}
 *
 * @example
 * ```typescript
 * parseAminoAcid('AUG').match({
 *   success: aa => aa.data.name,    // 'Methionine'
 *   failure: e => describeTranslationError(e),
 * });
 * ```
 */
export function parseAminoAcid(codon: string): Result<AminoAcid, TranslationError> {
  const rnaResult = parseRNA(codon);
  if (isFailure(rnaResult)) {
    return failure({ kind: 'invalid-codon-sequence', codon, cause: rnaResult.error });
  }
  const rna = rnaResult.data;
  const sequence = rna.sequence;

  if (sequence.length !== CODON_LENGTH) {
    return failure({
      kind: 'invalid-codon-length',
      codon: sequence,
      length: sequence.length,
      expected: CODON_LENGTH,
    });
  }

  if (isStopCodon(sequence)) {
    return failure({ kind: 'stop-codon', codon: sequence });
  }

  const data = AMINO_ACID_BY_CODON[sequence];
  if (data === undefined) {
    return failure({ kind: 'invalid-codon', codon: sequence, position: 0 });
  }

  return success(unsafeAminoAcid(rna, data));
}

/**
 * Constructs an {@link AminoAcid} without re-running validation. Reserved for
 * `translation/`-internal callers (the {@link parseAminoAcid} parser, the `translate`
 * pipeline). Not exported from the package barrel.
 *
 * @param codon - The validated RNA codon
 * @param data - The validated amino-acid data
 * @returns A new `AminoAcid`
 *
 * @internal
 */
export function unsafeAminoAcid(codon: RNA, data: AminoAcidData): AminoAcid {
  return new AminoAcid(codon, data, UNSAFE_AMINO_ACID_KEY);
}

/**
 * Constructs an {@link AminoAcid} from a trusted codon string and the matching data entry.
 * Reserved for `translation/`-internal callers (the `translate` pipeline). Skips both RNA
 * parsing and codon-table lookup; the caller is asserting both are already known to be
 * consistent. Not exported from the package barrel.
 *
 * @param codonString - A validated RNA codon string (3 characters over `{A, C, G, U}`)
 * @param data - The validated amino-acid data for that codon
 * @returns A new `AminoAcid`
 *
 * @internal
 */
export function unsafeAminoAcidFromString(codonString: string, data: AminoAcidData): AminoAcid {
  return unsafeAminoAcid(unsafeRNA(codonString), data);
}
