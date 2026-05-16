import type { MRNA } from './MRNA.js';
import type { SpliceVariant } from '../gene/index.js';

/**
 * Configuration for splice-variant validation and enumeration.
 *
 * Defaults are biological-realism-leaning: reading frame must be maintained, both first and
 * last exons must be present, codon validation requires AUG / stop, and at least one exon is
 * required.
 */
export interface AlternativeSplicingOptions {
  /** Whether to enforce that the variant's mature length is divisible by 3. */
  readonly validateReadingFrames?: boolean;

  /** Whether to require a minimum number of exons per variant. */
  readonly requireMinimumExons?: boolean;

  /** Minimum number of exons required per variant when `requireMinimumExons` is set. */
  readonly minimumExonCount?: number;

  /**
   * Whether to validate that the variant starts with the start codon (AUG) and ends with a
   * stop codon. Useful to disable when modeling alternative start sites, nonsense mutations,
   * or partial-sequence research transcripts.
   */
  readonly validateCodons?: boolean;

  /** Whether to allow variants that skip exon 0. */
  readonly allowSkipFirstExon?: boolean;

  /**
   * Whether to allow variants that skip the gene's final exon. Disabling enforces a proper
   * C-terminus and termination signal; enabling supports alternative polyadenylation or
   * truncated isoforms.
   */
  readonly allowSkipLastExon?: boolean;
}

/**
 * Default {@link AlternativeSplicingOptions} reflecting the strictest biological-realism
 * stance.
 */
export const DEFAULT_ALTERNATIVE_SPLICING_OPTIONS: AlternativeSplicingOptions = {
  validateReadingFrames: true,
  requireMinimumExons: true,
  minimumExonCount: 1,
  validateCodons: true,
  allowSkipFirstExon: false,
  allowSkipLastExon: false,
} as const;

/**
 * Outcome of processing a single splice variant: the mature mRNA it produces plus the
 * derived coding-sequence string and predicted polypeptide length.
 *
 * Fields are public-readonly; the seven wrapper getters that previously surfaced
 * `variant.name`, `mRNA.length`, etc. were dropped because they added nothing programmatic.
 */
export class SplicingOutcome {
  /**
   * @param variant - The splice variant this outcome describes
   * @param matureMRNA - The mature mRNA produced by processing `variant`
   * @param codingSequence - The variant's coding-sequence string
   * @param polypeptideLength - Predicted polypeptide length in amino acids
   */
  constructor(
    public readonly variant: SpliceVariant,
    public readonly matureMRNA: MRNA,
    public readonly codingSequence: string,
    public readonly polypeptideLength: number,
  ) {}
}

/**
 * Builds an exon-skipping {@link SpliceVariant}: all exons of a gene except those in
 * `skippedExons` are included.
 *
 * @param name - Variant name
 * @param totalExons - Total exon count in the source gene
 * @param skippedExons - Indices to exclude from the variant
 * @param description - Optional human-readable description
 * @returns The constructed variant
 */
export function exonSkippingVariant(
  name: string,
  totalExons: number,
  skippedExons: readonly number[],
  description?: string,
): SpliceVariant {
  const skipped = new Set(skippedExons);
  const includedExons: number[] = [];
  for (let i = 0; i < totalExons; i++) {
    if (!skipped.has(i)) {
      includedExons.push(i);
    }
  }
  return {
    name,
    includedExons,
    description:
      description ??
      `Skips exon${skippedExons.length > 1 ? 's' : ''} ${[...skippedExons].join(', ')}`,
  };
}

/**
 * Builds a truncation {@link SpliceVariant} that keeps only the first `exonCount` exons of a
 * gene.
 *
 * @param name - Variant name
 * @param exonCount - Number of leading exons to include
 * @param description - Optional human-readable description
 * @returns The constructed variant
 */
export function truncationVariant(
  name: string,
  exonCount: number,
  description?: string,
): SpliceVariant {
  const includedExons = Array.from({ length: exonCount }, (_, i) => i);
  return {
    name,
    includedExons,
    description: description ?? `Truncated to first ${exonCount} exon${exonCount > 1 ? 's' : ''}`,
  };
}

/**
 * Builds a minimal {@link SpliceVariant} that includes only the specified essential exon
 * indices.
 *
 * @param name - Variant name
 * @param essentialExons - Indices to include (sorted automatically)
 * @param description - Optional human-readable description
 * @returns The constructed variant
 */
export function minimalVariant(
  name: string,
  essentialExons: readonly number[],
  description?: string,
): SpliceVariant {
  return {
    name,
    includedExons: [...essentialExons].sort((a, b) => a - b),
    description:
      description ?? `Minimal variant with essential exons ${[...essentialExons].join(', ')}`,
  };
}

/**
 * Builds a full-length {@link SpliceVariant} that includes every exon of a gene.
 *
 * @param name - Variant name
 * @param totalExons - Total exon count in the source gene
 * @param description - Optional human-readable description
 * @returns The constructed variant
 */
export function fullLengthVariant(
  name: string,
  totalExons: number,
  description?: string,
): SpliceVariant {
  const includedExons = Array.from({ length: totalExons }, (_, i) => i);
  return {
    name,
    includedExons,
    description: description ?? 'Full-length variant with all exons',
  };
}
