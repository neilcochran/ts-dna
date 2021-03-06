export * from './model';

export {
    NucleicAcidType,
    RNASubType,
    isDNA,
    isRNA,
    isValidNucleotidePattern,
    getNucleotidePatternSymbolComplement,
    getNucleotidePatternComplement,
    isValidNucleicAcid,
    convertNucleicAcid,
    convertToDNA,
    convertToRNA
} from './nucleic-acids';

export {
    AminoAcidName,
    getAminoAcidByCodon,
    RNAtoAminoAcids
} from './amino-acids';