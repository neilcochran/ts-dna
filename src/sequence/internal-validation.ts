import type { DNAError, RNAError } from './errors.js';

const VALID_DNA_BASES = new Set(['A', 'C', 'G', 'T']);
const VALID_RNA_BASES = new Set(['A', 'C', 'G', 'U']);

/**
 * Result of validating a candidate DNA sequence string.
 *
 * @internal
 */
export type DNAValidationOutcome =
  | { readonly ok: true; readonly normalized: string }
  | { readonly ok: false; readonly error: DNAError };

/**
 * Result of validating a candidate RNA sequence string.
 *
 * @internal
 */
export type RNAValidationOutcome =
  | { readonly ok: true; readonly normalized: string }
  | { readonly ok: false; readonly error: RNAError };

/**
 * Normalizes a candidate DNA string and returns a structured outcome describing whether it
 * was valid. On success the normalized sequence is upper-cased; on failure the offending
 * characters and the index of the first one are reported.
 *
 * @internal
 *
 * @param input - Candidate sequence string
 * @returns Structured outcome
 */
export function validateDNAString(input: string): DNAValidationOutcome {
  if (input.length === 0) {
    return { ok: false, error: { kind: 'empty-sequence' } };
  }
  const normalized = input.toUpperCase();
  const issue = findInvalidBases(normalized, VALID_DNA_BASES);
  if (issue !== undefined) {
    return {
      ok: false,
      error: {
        kind: 'invalid-characters',
        chars: issue.chars,
        firstAt: issue.firstAt,
      },
    };
  }
  return { ok: true, normalized };
}

/**
 * Normalizes a candidate RNA string and returns a structured outcome describing whether it
 * was valid. On success the normalized sequence is upper-cased; on failure the offending
 * characters and the index of the first one are reported.
 *
 * @internal
 *
 * @param input - Candidate sequence string
 * @returns Structured outcome
 */
export function validateRNAString(input: string): RNAValidationOutcome {
  if (input.length === 0) {
    return { ok: false, error: { kind: 'empty-sequence' } };
  }
  const normalized = input.toUpperCase();
  const issue = findInvalidBases(normalized, VALID_RNA_BASES);
  if (issue !== undefined) {
    return {
      ok: false,
      error: {
        kind: 'invalid-characters',
        chars: issue.chars,
        firstAt: issue.firstAt,
      },
    };
  }
  return { ok: true, normalized };
}

function findInvalidBases(
  normalized: string,
  validBases: ReadonlySet<string>,
): { readonly chars: readonly string[]; readonly firstAt: number } | undefined {
  let firstAt = -1;
  const seen = new Set<string>();
  const chars: string[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charAt(i);
    if (!validBases.has(ch)) {
      if (firstAt === -1) {
        firstAt = i;
      }
      if (!seen.has(ch)) {
        seen.add(ch);
        chars.push(ch);
      }
    }
  }
  if (firstAt === -1) {
    return undefined;
  }
  return { chars, firstAt };
}
