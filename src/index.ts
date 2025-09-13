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
    unwrapOr
} from './types/validation-result';

export {
    GenomicRegion,
    isValidGenomicRegion,
    regionsOverlap,
    validateNonOverlappingRegions
} from './types/genomic-region';

export {
    validateNucleicAcid
} from './utils/validation';

export {
    isDNA,
    isRNA,
    isValidNucleotidePattern,
    getNucleotidePatternSymbolComplement,
    getNucleotidePatternComplement,
    isValidNucleicAcid,
    convertNucleicAcid,
    convertToDNA,
    convertToRNA,
    STOP_CODON_UAA,
    STOP_CODON_UAG,
    STOP_CODON_UGA,
    STOP_CODONS
} from './utils/nucleic-acids';

export {
    getAminoAcidByCodon,
    RNAtoAminoAcids
} from './utils/amino-acids';

export {
    validateSpliceSites,
    findPotentialSpliceSites,
    validateGeneSpliceSites,
    SPLICE_DONOR_SEQUENCES,
    SPLICE_ACCEPTOR_SEQUENCES
} from './utils/splice-sites';

export {
    findPromoters,
    identifyTSS
} from './utils/promoter-recognition';

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
    PROMOTER_ELEMENT_COMBINATIONS
} from './data/promoter-elements';