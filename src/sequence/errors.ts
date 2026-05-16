/**
 * Tagged-union errors raised by the sequence-level parsers and helpers.
 *
 * Each domain returns its own discriminated union so callers can branch on `kind` and have
 * TypeScript narrow the surrounding fields. Human-readable messages are produced at the
 * rendering layer (see {@link describeDNAError} / {@link describeRNAError} /
 * {@link describeReadingFrameError}) rather than carried alongside the structured payload.
 */

/**
 * Error variants produced when parsing a DNA sequence string.
 *
 * Returned in the failure branch of `Result<DNA, DNAError>` from `parseDNA`.
 */
export type DNAError =
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'empty-sequence';
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-characters';
      /** Distinct invalid characters discovered in the input, preserving discovery order. */
      readonly chars: readonly string[];
      /** Index of the first invalid character (0-based, in the original input). */
      readonly firstAt: number;
    };

/**
 * Error variants produced when parsing an RNA sequence string.
 *
 * Returned in the failure branch of `Result<RNA, RNAError>` from `parseRNA`.
 */
export type RNAError =
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'empty-sequence';
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-characters';
      /** Distinct invalid characters discovered in the input, preserving discovery order. */
      readonly chars: readonly string[];
      /** Index of the first invalid character (0-based, in the original input). */
      readonly firstAt: number;
    };

/**
 * Error variants raised by `validateReadingFrame`.
 *
 * The `kind: 'frame-misaligned'` variant fires when the coding-region length is not a
 * multiple of `CODON_LENGTH`. The `kind: 'missing-start-codon'` variant fires when the
 * caller asked the validator to verify that position 0 begins with `AUG` and it does not.
 */
export type ReadingFrameError =
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'frame-misaligned';
      /** Length (in nucleotides) of the coding region as provided. */
      readonly codingLength: number;
      /** Codon length the coding region must be a multiple of (always 3 for the standard code). */
      readonly codonLength: number;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'missing-start-codon';
      /** Codon string actually found at the candidate start position. */
      readonly found: string;
      /** Position (0-based) at which the start codon was expected. */
      readonly position: number;
    };

/**
 * Renders a {@link DNAError} as a human-readable message.
 *
 * @param error - The structured error payload
 * @returns A short human-readable description, suitable for logs or developer-facing messages
 */
export function describeDNAError(error: DNAError): string {
  switch (error.kind) {
    case 'empty-sequence':
      return 'DNA sequence cannot be empty';
    case 'invalid-characters':
      return `Invalid DNA sequence: contains invalid characters ${error.chars.join(', ')} (first at index ${error.firstAt})`;
  }
}

/**
 * Renders an {@link RNAError} as a human-readable message.
 *
 * @param error - The structured error payload
 * @returns A short human-readable description, suitable for logs or developer-facing messages
 */
export function describeRNAError(error: RNAError): string {
  switch (error.kind) {
    case 'empty-sequence':
      return 'RNA sequence cannot be empty';
    case 'invalid-characters':
      return `Invalid RNA sequence: contains invalid characters ${error.chars.join(', ')} (first at index ${error.firstAt})`;
  }
}

/**
 * Renders a {@link ReadingFrameError} as a human-readable message.
 *
 * @param error - The structured error payload
 * @returns A short human-readable description, suitable for logs or developer-facing messages
 */
export function describeReadingFrameError(error: ReadingFrameError): string {
  switch (error.kind) {
    case 'frame-misaligned':
      return `Reading frame error: coding sequence length ${error.codingLength} is not divisible by ${error.codonLength}`;
    case 'missing-start-codon':
      return `Expected start codon AUG at position ${error.position}, found ${error.found}`;
  }
}
