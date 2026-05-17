/**
 * Tagged-union errors raised by the `processing/` module: `parseMRNA`, the splicing helpers,
 * the polyadenylation helpers, and the `processRNA` pipeline.
 *
 * One union per concern - {@link SplicingError}, {@link PolyadenylationError},
 * {@link ProcessingError} - so callers can branch on `kind` and TypeScript narrows the
 * surrounding fields. Human-readable messages are produced by the renderer functions below
 * rather than carried alongside the structured payload.
 */

import type { RNAError } from '../sequence/index.js';
import { describeRNAError } from '../sequence/index.js';
import { assertUnreachable } from '../result/index.js';
import type { VariantValidationError } from '../variants/index.js';
import { describeVariantValidationError } from '../variants/index.js';

/**
 * Error variants produced by `spliceRNA`, `spliceRNAWithVariant`, and the splice-variant
 * orchestrators.
 *
 * The splicing-mechanics kinds are local to this module; the per-variant rule failures are
 * imported from `variants/` as {@link VariantValidationError} and merged in so that any
 * function accepting a {@link SplicingError} still observes the full set of variant kinds.
 *
 * - `no-exons`: the pre-mRNA carries no exon regions to splice.
 * - `exon-out-of-bounds`: an exon region exceeds the transcript bounds.
 * - `invalid-donor-site`: an intron does not start with the canonical RNA donor (`GU`).
 * - `invalid-acceptor-site`: an intron does not end with the canonical RNA acceptor (`AG`).
 * - `intron-too-short`: an intron is shorter than the minimum splice-machinery threshold.
 * - `no-splicing-profile`: an operation requiring a splicing profile was called on a gene
 *   without one.
 * - `no-default-variant`: a gene's splicing profile defines no resolvable default variant.
 * - Plus every variant of {@link VariantValidationError}.
 */
export type SplicingError =
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'no-exons';
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'exon-out-of-bounds';
      /** 0-based index of the offending exon. */
      readonly exonIndex: number;
      /** `start` of the offending exon. */
      readonly start: number;
      /** `end` of the offending exon. */
      readonly end: number;
      /** Length of the transcript the exon was checked against. */
      readonly sequenceLength: number;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-donor-site';
      /** 0-based intron index in transcript-coordinate order. */
      readonly intronIndex: number;
      /** Transcript-relative position where the donor was expected. */
      readonly position: number;
      /** The 2-base prefix actually found at that position. */
      readonly found: string;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-acceptor-site';
      /** 0-based intron index in transcript-coordinate order. */
      readonly intronIndex: number;
      /** Transcript-relative position where the acceptor was expected. */
      readonly position: number;
      /** The 2-base suffix actually found at that position. */
      readonly found: string;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'intron-too-short';
      /** 0-based intron index. */
      readonly intronIndex: number;
      /** Length of the intron in nucleotides. */
      readonly length: number;
      /** Minimum length required for splicing. */
      readonly min: number;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'no-splicing-profile';
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'no-default-variant';
    }
  | VariantValidationError;

/**
 * Error variants produced by `add3PrimePolyATail` and `add3PrimePolyATailAtSite`.
 *
 * - `invalid-cleavage-site`: a negative cleavage-site index was supplied.
 * - `invalid-tail-length`: tail length is negative or exceeds the maximum allowed.
 */
export type PolyadenylationError =
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-cleavage-site';
      /** The cleavage-site value the caller supplied. */
      readonly cleavageSite: number;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-tail-length';
      /** The tail length value the caller supplied. */
      readonly tailLength: number;
      /** Maximum tail length allowed. */
      readonly max: number;
    };

/**
 * Error variants produced by `parseMRNA` and the `processRNA` pipeline.
 *
 * - `invalid-sequence`: the supplied RNA-sequence string failed parsing.
 * - `invalid-coding-boundaries`: `codingStart` / `codingEnd` are not finite non-negative
 *   integers, are inverted, or extend past the sequence.
 * - `invalid-polya-tail-length`: tail length is negative or longer than the sequence.
 * - `splicing-failed`: the splicing stage of `processRNA` rejected the pre-mRNA.
 * - `no-start-codon`: codon-validation enabled but no `AUG` was found in the spliced
 *   sequence.
 * - `no-in-frame-stop`: codon-validation enabled but no in-frame stop codon was found after
 *   the start codon.
 */
export type ProcessingError =
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-sequence';
      /** Underlying RNA-parser failure. */
      readonly cause: RNAError;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-coding-boundaries';
      /** `codingStart` value as supplied. */
      readonly codingStart: number;
      /** `codingEnd` value as supplied. */
      readonly codingEnd: number;
      /** Length of the underlying RNA sequence. */
      readonly sequenceLength: number;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'invalid-polya-tail-length';
      /** Tail length as supplied. */
      readonly polyATailLength: number;
      /** Length of the underlying RNA sequence. */
      readonly sequenceLength: number;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'splicing-failed';
      /** Underlying splicing failure. */
      readonly cause: SplicingError;
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'no-start-codon';
    }
  | {
      /** Discriminator naming the failure mode. */
      readonly kind: 'no-in-frame-stop';
    };

/**
 * Renders a {@link SplicingError} as a human-readable message.
 *
 * @param error - The structured error payload
 * @returns A short human-readable description, suitable for logs or developer-facing messages
 */
export function describeSplicingError(error: SplicingError): string {
  switch (error.kind) {
    case 'no-exons':
      return 'Cannot splice RNA: no exons found in pre-mRNA';
    case 'exon-out-of-bounds':
      return `Exon ${error.exonIndex} region ${error.start}-${error.end} is outside transcript bounds (length ${error.sequenceLength})`;
    case 'invalid-donor-site':
      return `Invalid 5' splice site at transcript position ${error.position}: expected GU, found ${error.found}`;
    case 'invalid-acceptor-site':
      return `Invalid 3' splice site at transcript position ${error.position}: expected AG, found ${error.found}`;
    case 'intron-too-short':
      return `Intron ${error.intronIndex} is too short: ${error.length} bp (minimum ${error.min} bp required)`;
    case 'no-splicing-profile':
      return 'Gene does not have an alternative splicing profile';
    case 'no-default-variant':
      return 'Gene does not have a default splice variant defined';
    case 'variant-invalid-exon-index':
    case 'variant-skips-first-exon':
    case 'variant-skips-last-exon':
    case 'variant-below-minimum-exons':
    case 'variant-not-in-frame':
    case 'variant-missing-start-codon':
    case 'variant-missing-stop-codon':
      return describeVariantValidationError(error);
    default:
      return assertUnreachable(error);
  }
}

/**
 * Renders a {@link PolyadenylationError} as a human-readable message.
 *
 * @param error - The structured error payload
 * @returns A short human-readable description, suitable for logs or developer-facing messages
 */
export function describePolyadenylationError(error: PolyadenylationError): string {
  switch (error.kind) {
    case 'invalid-cleavage-site':
      return `Invalid cleavage site ${error.cleavageSite}: must be a non-negative integer`;
    case 'invalid-tail-length':
      return `Invalid poly-A tail length ${error.tailLength}: must be between 0 and ${error.max}`;
    default:
      return assertUnreachable(error);
  }
}

/**
 * Renders a {@link ProcessingError} as a human-readable message.
 *
 * @param error - The structured error payload
 * @returns A short human-readable description, suitable for logs or developer-facing messages
 */
export function describeProcessingError(error: ProcessingError): string {
  switch (error.kind) {
    case 'invalid-sequence':
      return `Invalid mRNA sequence: ${describeRNAError(error.cause)}`;
    case 'invalid-coding-boundaries':
      return `Invalid coding-sequence boundaries: start=${error.codingStart}, end=${error.codingEnd}, sequence length=${error.sequenceLength}`;
    case 'invalid-polya-tail-length':
      return `Invalid poly-A tail length ${error.polyATailLength}: must be between 0 and the sequence length (${error.sequenceLength})`;
    case 'splicing-failed':
      return `Splicing failed: ${describeSplicingError(error.cause)}`;
    case 'no-start-codon':
      return 'No start codon (AUG) found in spliced sequence';
    case 'no-in-frame-stop':
      return 'No in-frame stop codon found after start codon';
    default:
      return assertUnreachable(error);
  }
}
