import { parseDNA, parseRNA } from '../../src/sequence';
import { AminoAcid } from '../../src/translation';
import { parseMRNA } from '../../src/modifications';

/**
 * Indexed access helper for test code. With `noUncheckedIndexedAccess` enabled, `arr[i]` /
 * `rec[k]` widens to `T | undefined`; the test's contract is that the index exists, so this
 * helper throws with a precise out-of-bounds message rather than letting a downstream
 * `.field` access blow up with the generic `Cannot read properties of undefined`.
 *
 * Two overloads cover the common cases: array-style numeric index, and record-style string
 * key.
 *
 * @param target - The array or record to index into
 * @param key - The numeric index (arrays) or string key (records)
 * @returns The element at `target[key]`
 * @throws If `target[key]` is `undefined`
 */
export function at<T>(arr: readonly T[], i: number): T;
export function at<T>(rec: Readonly<Record<string, T>>, key: string): T;
export function at<T>(target: readonly T[] | Readonly<Record<string, T>>, key: number | string): T {
  const value = (target as Readonly<Record<string | number, T | undefined>>)[key];
  if (value === undefined) {
    const length = Array.isArray(target) ? target.length : Object.keys(target).length;
    throw new Error(`Test expected target[${String(key)}] to exist, but length is ${length}`);
  }
  return value;
}

//ensure RNA and DNA sequences are the same (excluding base differences) since some tests rely it
export const RNA_SEQ = 'AUCGGCUA';
export const RNA_SEQ_COMP = 'UAGCCGAU';
export const DNA_SEQ = 'ATCGGCTA';
export const DNA_SEQ_COMP = 'TAGCCGAT';

export const ALANINE_RNA_CODON_1 = parseRNA('GCU').unwrap();
export const ALANINE_RNA_CODON_2 = parseRNA('GCG').unwrap();
export const ALANINE_DNA_CODON_1 = parseDNA('GCT').unwrap();
export const ALANINE_DNA_CODON_2 = parseDNA('GCG').unwrap();

//ALL_AMINO_ACIDS_1 vs ALL_AMINO_ACIDS_2 use alternate codons but will code for the same amino acid sequence
export const RNA_ALL_AMINO_ACIDS_1 = parseRNA(
  'GCAUGCGACGAAUUCGGACACAUAAAAUUAAUGAACCCACAAAGAAGCACAGUAUGGUAC',
).unwrap();
export const RNA_ALL_AMINO_ACIDS_2 = parseRNA(
  'GCCUGUGAUGAGUUUGGCCAUAUCAAGUUGAUGAAUCCCCAGAGGAGUACCGUCUGGUAU',
).unwrap();

// MRNA versions for Polypeptide tests - use the coding sequences directly
export const MRNA_ALL_AMINO_ACIDS_1 = parseMRNA(
  'GCAUGCGACGAAUUCGGACACAUAAAAUUAAUGAACCCACAAAGAAGCACAGUAUGGUAC',
  0,
  60,
).unwrap();

export const MRNA_ALL_AMINO_ACIDS_2 = parseMRNA(
  'GCCUGUGAUGAGUUUGGCCAUAUCAAGUUGAUGAAUCCCCAGAGGAGUACCGUCUGGUAU',
  0,
  60,
).unwrap();
export const DNA_ALL_AMINO_ACIDS_1 = parseDNA(
  'GCATGCGACGAATTCGGACACATAAAATTAATGAACCCACAAAGAAGCACAGTATGGTAC',
).unwrap();
export const DNA_ALL_AMINO_ACIDS_2 = parseDNA(
  'GCCTGTGATGAGTTTGGCCATATCAAGTTGATGAATCCCCAGAGGAGTACCGTCTGGTAT',
).unwrap();

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
  correctAminoAcidData: { name: string; threeLetterCode: string; singleLetterCode: string },
): boolean => {
  return (
    aminoAcid.data.name === correctAminoAcidData.name &&
    aminoAcid.data.threeLetterCode === correctAminoAcidData.threeLetterCode &&
    aminoAcid.data.singleLetterCode === correctAminoAcidData.singleLetterCode
  );
};

export const isCorrectAminoAcidSequence = (
  aminoAcidSequence: readonly AminoAcid[],
  correctSingleLetterCodeSequence: string,
): boolean => {
  if (aminoAcidSequence.length !== correctSingleLetterCodeSequence.length) {
    return false;
  }
  for (let i = 0; i < correctSingleLetterCodeSequence.length; i++) {
    if (at(aminoAcidSequence, i).data.singleLetterCode !== correctSingleLetterCodeSequence[i]) {
      return false;
    }
  }
  return true;
};
