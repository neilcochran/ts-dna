export * from './model';

export { NucleicAcidType } from './NucleicAcidType';
export { RNASubType } from './RNASubType';

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
    AminoAcidName,
    getAminoAcidByCodon,
    RNAtoAminoAcids
} from './amino-acids';