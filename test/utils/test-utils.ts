import { RNA, DNA, MRNA, AminoAcid } from '../../src/model';

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
export const RNA_ALL_AMINO_ACIDS_1 = new RNA(
  'GCAUGCGACGAAUUCGGACACAUAAAAUUAAUGAACCCACAAAGAAGCACAGUAUGGUAC',
);
export const RNA_ALL_AMINO_ACIDS_2 = new RNA(
  'GCCUGUGAUGAGUUUGGCCAUAUCAAGUUGAUGAAUCCCCAGAGGAGUACCGUCUGGUAU',
);

// MRNA versions for Polypeptide tests - use the coding sequences directly
export const MRNA_ALL_AMINO_ACIDS_1 = new MRNA(
  'GCAUGCGACGAAUUCGGACACAUAAAAUUAAUGAACCCACAAAGAAGCACAGUAUGGUAC',
  'GCAUGCGACGAAUUCGGACACAUAAAAUUAAUGAACCCACAAAGAAGCACAGUAUGGUAC',
  0,
  60,
);

export const MRNA_ALL_AMINO_ACIDS_2 = new MRNA(
  'GCCUGUGAUGAGUUUGGCCAUAUCAAGUUGAUGAAUCCCCAGAGGAGUACCGUCUGGUAU',
  'GCCUGUGAUGAGUUUGGCCAUAUCAAGUUGAUGAAUCCCCAGAGGAGUACCGUCUGGUAU',
  0,
  60,
);
export const DNA_ALL_AMINO_ACIDS_1 = new DNA(
  'GCATGCGACGAATTCGGACACATAAAATTAATGAACCCACAAAGAAGCACAGTATGGTAC',
);
export const DNA_ALL_AMINO_ACIDS_2 = new DNA(
  'GCCTGTGATGAGTTTGGCCATATCAAGTTGATGAATCCCCAGAGGAGTACCGTCTGGTAT',
);

//the sequence of amino acid SINGLE_LETTER_CODEs produced by the above codons (all amino acids in alphabetic order by SINGLE_LETTER_CODE)
export const ALL_AMINO_ACIDS_SINGLE_LETTER_CODE_SEQ = 'ACDEFGHIKLMNPQRSTVWY';

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
  'GTAACTCTC',
];

export const isCorrectAminoAcid = (
  aminoAcid: AminoAcid,
  correctAminoAcidData: { name: string; abbrv: string; singleLetterCode: string },
): boolean => {
  const keysToCheck: (keyof { name: string; abbrv: string; singleLetterCode: string })[] = [
    'name',
    'abbrv',
    'singleLetterCode',
  ];
  for (const k of keysToCheck) {
    if (aminoAcid[k as keyof AminoAcid] !== correctAminoAcidData[k]) {
      return false;
    }
  }
  return true;
};

export const isCorrectAminoAcidSequence = (
  aminoAcidSequence: AminoAcid[],
  correctSingleLetterCodeSequence: string,
): boolean => {
  if (aminoAcidSequence.length !== correctSingleLetterCodeSequence.length) {
    return false;
  }
  for (let i = 0; i < correctSingleLetterCodeSequence.length; i++) {
    if (aminoAcidSequence[i].singleLetterCode !== correctSingleLetterCodeSequence[i]) {
      return false;
    }
  }
  return true;
};
