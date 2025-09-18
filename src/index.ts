export * from './model';

export { NucleicAcidType } from './enums/nucleic-acid-type';
export { RNASubType } from './enums/rna-sub-type';
export { AminoAcidPolarity } from './enums/amino-acid-polarity';
export { AminoAcidCharge } from './enums/amino-acid-charge';
export { AminoAcidSideChainType } from './enums/amino-acid-side-chain-type';

export {
  ValidationResult,
  success,
  failure,
  isSuccess,
  isFailure,
  map,
  chain,
  unwrap,
  unwrapOr,
} from './types/validation-result';

export { AminoAcidData } from './types/amino-acid-data';

export {
  SpliceVariant,
  AlternativeSplicingProfile,
  AlternativeSplicingOptions,
  SplicingOutcome,
  SpliceVariantPatterns,
  DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
} from './types/alternative-splicing';

export {
  GenomicRegion,
  isValidGenomicRegion,
  regionsOverlap,
  validateNonOverlappingRegions,
  validateExons,
  buildOptimizedIntervalTree,
  IntervalTree,
} from './types/genomic-region';

export { validateNucleicAcid } from './utils/validation';

export {
  isDNA,
  isRNA,
  isValidNucleotidePattern,
  getNucleotidePatternSymbolComplement,
  getNucleotidePatternComplement,
  isValidNucleicAcid,
  convertToDNA,
  convertToRNA,
  START_CODON,
  STOP_CODON_UAA,
  STOP_CODON_UAG,
  STOP_CODON_UGA,
  STOP_CODONS,
} from './utils/nucleic-acids';

export { getAminoAcidByCodon, RNAtoAminoAcids } from './utils/amino-acids';

export {
  validateSpliceSites,
  findPotentialSpliceSites,
  SPLICE_DONOR_SEQUENCES,
  SPLICE_ACCEPTOR_SEQUENCES,
} from './utils/splice-sites';

export { findPromoters, identifyTSS, PromoterSearchOptions } from './utils/promoter-recognition';

export { transcribe, TranscriptionOptions } from './utils/transcription';

export {
  TATA_BOX,
  INITIATOR,
  DOWNSTREAM_PROMOTER_ELEMENT,
  CAAT_BOX,
  GC_BOX,
  CEBP_SITE,
  E_BOX,
  AP1_SITE,
  STANDARD_PROMOTER_ELEMENTS,
  CORE_PROMOTER_ELEMENTS,
  PROXIMAL_PROMOTER_ELEMENTS,
  PROMOTER_ELEMENT_COMBINATIONS,
} from './data/promoter-elements';

export {
  PolyadenylationSite,
  CleavageSiteOptions,
  DEFAULT_CLEAVAGE_OPTIONS,
} from './types/polyadenylation-site';

export {
  findPolyadenylationSites,
  getStrongestPolyadenylationSite,
  filterPolyadenylationSites,
} from './utils/polyadenylation';

export { spliceRNA, validateReadingFrame } from './utils/rna-processing';

export {
  ProcessedRNA,
  add5PrimeCap,
  add3PrimePolyATail,
  add3PrimePolyATailAtSite,
  remove5PrimeCap,
  remove3PrimePolyATail,
  has5PrimeCap,
  has3PrimePolyATail,
  get3PrimePolyATailLength,
  getCoreSequence,
  isFullyProcessed,
} from './utils/rna-modifications';

export {
  spliceRNAWithVariant,
  processAllSplicingVariants,
  validateSpliceVariant,
  processDefaultSpliceVariant,
  findVariantsByProteinLength,
} from './utils/alternative-splicing';

export {
  processRNA,
  RNAProcessingOptions,
  DEFAULT_RNA_PROCESSING_OPTIONS,
  convertProcessedRNAToMRNA,
} from './utils/mrna-processing';
