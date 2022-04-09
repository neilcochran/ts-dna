export {
    //classes
    NucleicAcid,
    DNA,
    RNA,
    //type guards
    isDNA,
    isRNA,
    //utils
    NucleicAcidType,
    DNA_BASES,
    RNA_BASES,
    DNA_REGEX,
    RNA_REGEX,
    //util functions
    isValidSequence,
    getDNABaseComplement,
    getRNABaseComplement,
    convertNucleicAcid,
    convertRNAtoDNA,
    convertDNAtoRNA
} from './nucleic-acids';

export {
    //classes
    AminoAcid,
    AminoAcidName,
    //util functions
    getAminoAcidByCodon
} from './amino-acids';