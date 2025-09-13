export * from './model';

export { NucleicAcidType } from './NucleicAcidType';
export { RNASubType } from './RNASubType';
export { AminoAcidPolarity } from './AminoAcidPolarity';
export { AminoAcidCharge } from './AminoAcidCharge';
export { AminoAcidSideChainType } from './AminoAcidSideChainType';

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
} from './ValidationResult';

export {
    validateNucleicAcid
} from './validation';

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
} from './nucleic-acids';

export {
    getAminoAcidByCodon,
    RNAtoAminoAcids
} from './amino-acids';