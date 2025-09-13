import { RNA, DNA, AminoAcid } from '../src/model';

//ensure RNA and DNA sequences are the same (excluding base differences) since some tests rely it
export const RNA_SEQ = 'AUCGGCUA';
export const RNA_SEQ_COMP = 'UAGCCGAU';
export const DNA_SEQ = 'ATCGGCTA';
export const DNA_SEQ_COMP = 'TAGCCGAT';

export const ALANINE_RNA_CODON_1 = new RNA('GCU');
export const ALANINE_RNA_CODON_2 = new RNA('GCG');
export const ALANINE_DNA_CODON_1 = new DNA('GCT');
export const ALANINE_DNA_CODON_2 = new DNA('GCG');

//ALL_AMINO_ACIDS_1 vs ALL_AMINO_ACIDS_2 use alternate codons but will code for the same amino acid sequence
export const RNA_ALL_AMINO_ACIDS_1 = new RNA('GCAUGCGACGAAUUCGGACACAUAAAAUUAAUGAACCCACAAAGAAGCACAGUAUGGUAC');
export const RNA_ALL_AMINO_ACIDS_2 = new RNA('GCCUGUGAUGAGUUUGGCCAUAUCAAGUUGAUGAAUCCCCAGAGGAGUACCGUCUGGUAU');
export const DNA_ALL_AMINO_ACIDS_1 = new DNA('GCATGCGACGAATTCGGACACATAAAATTAATGAACCCACAAAGAAGCACAGTATGGTAC');
export const DNA_ALL_AMINO_ACIDS_2 = new DNA('GCCTGTGATGAGTTTGGCCATATCAAGTTGATGAATCCCCAGAGGAGTACCGTCTGGTAT');

//the sequence of amino acid SLCs produced by the above codons (all amino acids in alphabetic order by SLC)
export const ALL_AMINO_ACIDS_SLC_SEQ = 'ACDEFGHIKLMNPQRSTVWY';

//Nucleotide pattern symbols and complement symbols strings
export const ALL_NUCLEOTIDE_SYMBOLS = 'ATCGURYKMSWBVDHN';
export const ALL_NUCLEOTIDE_SYMBOLS_COMP = 'TAGCAYRMKSWVBHDN';
export const NUCLEOTIDE_PATTERN = '^N*Y?A+(WY){3}$';
export const NUCLEOTIDE_PATTERN_COMP = '^N*R?T+(WR){3}$';
export const NUCLEOTIDE_PATTERN_REGEX = '^[AaGgCcTt]*[CcTt]?[Aa]+([AaTt][CcTt]){3}$';
export const NUCLEOTIDE_PATTERN_REGEX_COMP = '/^[AaGgCcTt]*[GgAa]?[Tt]+([AaTt][GgAa]){3}$/';
//Examples of sequences that pass the above regex
export const NUCLEOTIDE_PATTERN_PASSING_SEQS = [
    //N*             YA+ (WY){3}
    'ATCGATCGATCGATCGCAAATTTTTT',
    //N*             YA+ (WY){3}
    'ATCGATCGATCGATCGCAAAACTCTC',
    //N*              A+(WY){3}
    'ATCGATCGATCGATCGCAACTCTC',
    //N*A+(WY){3}
    'GAACTCTC',
    //N*YA+(WY){3}
    'GCAACTCTC',
    //N*YA+(WY){3}
    'GTAACTCTC'
];

export const isCorrectAminoAcid = (aminoAcid: AminoAcid, correctAminoAcidData: { name: string; abbrv: string; slc: string }): boolean => {
    const keysToCheck = ['name', 'abbrv', 'slc'];
    for(const k of keysToCheck) {
        if(aminoAcid[k as keyof AminoAcid] !== correctAminoAcidData[k]) {
            return false;
        }
    }
    return true;
};

export const isCorrectAminoAcidSequence = (aminoAcidSequence: AminoAcid[], correctSLCSequence: string): boolean => {
    if(aminoAcidSequence.length !== correctSLCSequence.length) {
        return false;
    }
    for(let i = 0; i < correctSLCSequence.length; i++) {
        if(aminoAcidSequence[i].slc !== correctSLCSequence[i]) {
            return false;
        }
    }
    return true;
};
