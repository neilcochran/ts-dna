/**
 * Pure gene-attached splice-variant metadata types.
 *
 * `SpliceVariant` and `AlternativeSplicingProfile` are referenced from `Gene` and consumed by
 * the `processing/` module. They live in `gene/` so that `processing/` can depend on `gene/`
 * without creating a `gene/` -\> `processing/` cycle.
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
 * The complete alternative-splicing profile attached to a `Gene`: the catalog of available
 * variants plus the name of the canonical default form.
 */
export interface AlternativeSplicingProfile {
  /** Gene identifier this profile applies to. */
  readonly geneId: string;

  /** All splice variants available for this gene. */
  readonly variants: readonly SpliceVariant[];

  /** Name of the variant treated as canonical when no variant is explicitly chosen. */
  readonly defaultVariant: string;
}
