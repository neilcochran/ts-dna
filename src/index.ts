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