/**
 * `SpliceVariant`: a record of which exons of a gene are retained in a mature transcript,
 * plus the validation rules and option types that govern variant correctness.
 *
 * The interface is the foundational variant-metadata shape; gene-attached profiles
 * ({@link AlternativeSplicingProfile}) reference it, processing modules consume it, and the
 * validator below (`validateSpliceVariant`) enforces the per-variant biological rules.
 */

/**
 * A specific splice variant, describing which exons of a gene are retained in the mature
 * transcript.
 *
 * Indices reference the gene's `exons` array directly. Sets are treated as unordered;
 * downstream code always materializes them in gene-position order.
 */
export interface SpliceVariant {
  /** Unique name for this variant (e.g. `'variant-1'`, `'cardiac-specific'`). */
  readonly name: string;

  /** 0-based exon indices included in this variant. */
  readonly includedExons: readonly number[];

  /** Optional biological context or human-readable description. */
  readonly description?: string;
}

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
