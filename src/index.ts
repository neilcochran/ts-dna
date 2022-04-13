export {
    NucleicAcidType,
    NucleicAcid,
    DNA,
    RNA,
    isDNA,
    isRNA,
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
