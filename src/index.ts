export {
    NucleotidePatternSymbol,
    NucleotidePattern,
    NucleicAcidType,
    RNASubType,
    NucleicAcid,
    DNA,
    RNA,
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
    AminoAcid,
    getAminoAcidByCodon
} from './amino-acids';

export {
    Polypeptide,
    nucleicAcidToAminoAcids
} from './polypeptide';
