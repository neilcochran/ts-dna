import { Result, success, failure } from '../result/index.js';
import { isIUPACSymbol } from './iupac-symbols.js';
import type { PatternError } from './errors.js';
import { NucleotidePattern } from './NucleotidePattern.js';
import { NucleotidePatternSymbol } from './NucleotidePatternSymbol.js';

/**
 * Parses an untrusted IUPAC pattern string into a {@link NucleotidePattern}.
 *
 * The success branch carries a compiled `NucleotidePattern`; the failure branch carries a
 * structured {@link PatternError} naming the specific failure mode (`empty-pattern`,
 * `invalid-iupac-character` with the offending character and index, or
 * `invalid-regex-construction` for patterns whose regex form is malformed).
 *
 * @param input - Candidate pattern string
 * @returns `Result` whose success branch carries a `NucleotidePattern` and whose failure
 * branch carries a `PatternError`
 *
 * @example
 * ```typescript
 * const result = parseNucleotidePattern('TATAWAR');
 * if (result.success) {
 *   result.data.matches(parseDNA('TATAAAT').unwrap());
 * }
 * ```
 */
export function parseNucleotidePattern(input: string): Result<NucleotidePattern, PatternError> {
  if (input === '') {
    return failure({ kind: 'empty-pattern' });
  }
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (/[a-zA-Z]/.test(character)) {
      const isEscapeSequence = i > 0 && input[i - 1] === '\\';
      if (isEscapeSequence) {
        continue;
      }
      if (!isIUPACSymbol(character.toUpperCase())) {
        return failure({ kind: 'invalid-iupac-character', character, index: i });
      }
    }
  }
  try {
    return success(new NucleotidePattern(input));
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return failure({ kind: 'invalid-regex-construction', pattern: input, cause: message });
  }
}

/**
 * Parses an untrusted IUPAC symbol into a {@link NucleotidePatternSymbol}.
 *
 * The success branch carries the validated symbol; the failure branch carries a
 * {@link PatternError} naming the failure mode (`empty-symbol` for empty input or
 * `invalid-iupac-symbol` for any character that is not one of the IUPAC nucleotide symbols).
 *
 * @param input - Candidate IUPAC symbol (single character, case-insensitive)
 * @returns `Result` whose success branch carries a `NucleotidePatternSymbol` and whose failure
 * branch carries a `PatternError`
 *
 * @example
 * ```typescript
 * const result = parseNucleotidePatternSymbol('r');
 * if (result.success) {
 *   result.data.matchingBases; // ['G', 'A']
 * }
 * ```
 */
export function parseNucleotidePatternSymbol(
  input: string,
): Result<NucleotidePatternSymbol, PatternError> {
  if (input === '') {
    return failure({ kind: 'empty-symbol' });
  }
  if (!isIUPACSymbol(input.toUpperCase())) {
    return failure({ kind: 'invalid-iupac-symbol', symbol: input });
  }
  return success(new NucleotidePatternSymbol(input));
}
