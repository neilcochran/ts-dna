export * from './model';

export {
    NucleicAcidType,
    RNASubType,
    isDNA,
    isRNA,
    isValidNucleotidePattern,
    getNucleotidePatternSymbolComplement,
    isValidNucleicAcidSequence,
    convertNucleicAcid,
    convertToDNA,
    convertToRNA
} from './nucleic-acids';

export {
    getAminoAcidByCodon,
    nucleicAcidToAminoAcids
} from './amino-acids';