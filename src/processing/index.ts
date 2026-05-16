/**
 * Processing-level domain types: the `processRNA` pipeline, the `MRNA` composition-based
 * mature-mRNA type and its parser, splicing (including alternative splicing and the lazy
 * variant iterator), splice-site validation, polyadenylation analysis, 5'-cap and 3'
 * poly-A tail helpers, and the `ProcessingError` / `SplicingError` / `PolyadenylationError`
 * tagged unions.
 *
 * The module-private `unsafeMRNA` factory and the `UNSAFE_MRNA_KEY` symbol are deliberately
 * excluded from this barrel.
 */
export { MRNA } from './MRNA.js';
export { parseMRNA } from './parse.js';
export { processRNA, DEFAULT_RNA_PROCESSING_OPTIONS } from './process-rna.js';
export type { RNAProcessingOptions } from './process-rna.js';
export { spliceRNA, validateTranscriptSpliceSites } from './splicing.js';
export type { SpliceRNAOptions } from './splicing.js';
export {
  validateSpliceVariant,
  spliceRNAWithVariant,
  processAllSplicingVariants,
  processDefaultSpliceVariant,
  enumerateSpliceVariants,
} from './alternative-splicing.js';
export {
  SplicingOutcome,
  DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
  exonSkippingVariant,
  truncationVariant,
  minimalVariant,
  fullLengthVariant,
} from './splice-variants.js';
export type { AlternativeSplicingOptions } from './splice-variants.js';
export {
  findPolyadenylationSites,
  getStrongestPolyadenylationSite,
  filterPolyadenylationSites,
} from './polyadenylation.js';
export { DEFAULT_CLEAVAGE_OPTIONS } from './polyadenylation-site.js';
export type { PolyadenylationSite, CleavageSiteOptions } from './polyadenylation-site.js';
export { validateSpliceSites, findPotentialSpliceSites } from './splice-sites.js';
export {
  add5PrimeCap,
  add3PrimePolyATail,
  add3PrimePolyATailAtSite,
  remove3PrimePolyATail,
  has5PrimeCap,
  has3PrimePolyATail,
  get3PrimePolyATailLength,
  getCoreSequence,
  isFullyProcessed,
} from './modifications.js';
export {
  DNA_DONOR_SPLICE_CONSENSUS,
  DNA_ACCEPTOR_SPLICE_CONSENSUS,
  RNA_DONOR_SPLICE_CONSENSUS,
  RNA_ACCEPTOR_SPLICE_CONSENSUS,
} from './splice-consensus.js';
export type { ProcessingError, SplicingError, PolyadenylationError } from './errors.js';
export {
  describeProcessingError,
  describeSplicingError,
  describePolyadenylationError,
} from './errors.js';
export {
  DEFAULT_POLY_A_TAIL_LENGTH,
  MIN_POLY_A_DETECTION_LENGTH,
  MAX_POLY_A_TAIL_LENGTH,
  POLY_A_TAIL_PATTERN,
  POLYA_SIGNAL_OFFSET,
  DEFAULT_CLEAVAGE_OFFSET,
  CANONICAL_POLYA_SIGNAL_DNA,
  POLYA_SIGNALS,
  DEFAULT_POLYA_SIGNAL_STRENGTH,
  MIN_INTRON_LENGTH_FOR_SPLICING,
  MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH,
  USE_ELEMENT_MAX_BOOST,
  DSE_ELEMENT_MAX_BOOST,
  MIN_POLYA_SITE_STRENGTH,
  DEFAULT_POLYA_SIGNALS,
  DEFAULT_UPSTREAM_USE_PATTERN,
  DEFAULT_DOWNSTREAM_DSE_PATTERN,
  DEFAULT_CLEAVAGE_PREFERENCE,
  DEFAULT_CLEAVAGE_DISTANCE_RANGE,
} from './biological-constants.js';
