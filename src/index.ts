export {
    NucleotidePatternSymbol,
    NucleicAcidType,
    RNASubType,
    NucleicAcid,
    DNA,
    RNA,
    isDNA,
    isRNA,
    isValidNucleotideSymbolPattern,
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
