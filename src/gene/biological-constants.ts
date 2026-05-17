/**
 * Biological constants for gene structure.
 *
 * Sizes are in base pairs. The min/max bounds describe the realistic range observed in
 * eukaryotic genes; `parseGene` (and the transitive `validate-exons` helper) reject inputs
 * outside this range.
 */

/** Minimum exon size in base pairs (one codon). */
export const MIN_EXON_SIZE = 3;

/** Maximum realistic exon size in base pairs (larger than CFTR's ~17 kb largest known exon). */
export const MAX_EXON_SIZE = 50000;

/** Minimum intron size for the spliceosome to recognize and process. */
export const MIN_INTRON_SIZE = 20;

/**
 * Maximum intron size in base pairs. Sized to cover the largest known mammalian intron
 * (DMD intron 44 at ~2.2 Mb) with headroom; values beyond this are rejected by `parseGene`
 * as biologically implausible rather than as a hard physical limit.
 */
export const MAX_INTRON_SIZE = 3000000;

/** Default maximum intron length scanned by splice-site search routines. */
export const DEFAULT_MAX_INTRON_SEARCH = 10000;

/** Typical TATA box position relative to the transcription start site (bp). */
export const TATA_BOX_TYPICAL_POSITION = -25;

/** Typical Downstream Promoter Element position relative to TSS (bp). */
export const DPE_TYPICAL_POSITION = 30;
