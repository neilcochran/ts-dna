
import { RNA, AminoAcid, InvalidCodonError } from '../src/model';
import {
    getAminoAcidByCodon,
    getAminoAcidNameByCodon,
    SLC_ALT_CODONS_MAP,
    SLC_AMINO_ACID_NAME_MAP
} from '../src/amino-acids';
import * as TestUtils from './test-utils';

/*
    --- AminoAcid from RNA ---
*/

test('create AminoAcid (Alanine) from valid RNA codon', () => {
    expect(
        TestUtils.isCorrectAminoAcid(new AminoAcid(TestUtils.ALANINE_RNA_CODON_1), SLC_AMINO_ACID_NAME_MAP['A'])
    ).toEqual(true);
});

test('create invalid AminoAcid (Alanine) from empty RNA', () => {
    expect(() => new AminoAcid(new RNA())).toThrowError(InvalidCodonError);
});

test('create invalid AminoAcid (Alanine) from too long RNA', () => {
    expect(() => new AminoAcid(new RNA('AUCG'))).toThrowError(InvalidCodonError);
});

test('get all AminoAcid (Alanine) alternate codons', () => {
    expect(
        new AminoAcid(TestUtils.ALANINE_RNA_CODON_2).getAllAlternateCodons()
    ).toEqual(SLC_ALT_CODONS_MAP['A']);
});

test('ensure alternate AminoAcids (Alanine) return the same alternate RNA codons', () => {
    expect(
        new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).getAllAlternateCodons()
    ).toEqual(new AminoAcid(TestUtils.ALANINE_RNA_CODON_2).getAllAlternateCodons());
});

test('RNA AminoAcids (Alanine) is equal', () => {
    expect(
        new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).equals(new AminoAcid(TestUtils.ALANINE_RNA_CODON_1))
    ).toEqual(true);
});

test('RNA AminoAcids (Alanine) is not equal', () => {
    expect(
        new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).equals(new AminoAcid(TestUtils.ALANINE_RNA_CODON_2))
    ).toEqual(false);
});

test('RNA AminoAcids (Alanine) are alternates', () => {
    expect(
        new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).isAlternateOf(new AminoAcid(TestUtils.ALANINE_RNA_CODON_2))
    ).toEqual(true);
});

/*
    --- Bulk AminoAcid creation and retrieval
*/

test('testing creation of all codon variations for each amino acid', () => {
    let slc: keyof typeof SLC_AMINO_ACID_NAME_MAP;
    for(slc in SLC_AMINO_ACID_NAME_MAP) {
        const aminoAcidName = SLC_AMINO_ACID_NAME_MAP[slc];
        for(const codon of SLC_ALT_CODONS_MAP[slc]) {
            expect(TestUtils.isCorrectAminoAcid(new AminoAcid(codon), aminoAcidName)).toEqual(true);
        }
    }
});

test('testing AminoAcid retrieval via getAminoAcidByCodon() using all codon variations for each amino acid', () => {
    let slc: keyof typeof SLC_AMINO_ACID_NAME_MAP;
    for(slc in SLC_AMINO_ACID_NAME_MAP) {
        const aminoAcidName = SLC_AMINO_ACID_NAME_MAP[slc];
        for(const codon of SLC_ALT_CODONS_MAP[slc]) {
            const aminoAcid = getAminoAcidByCodon(codon);
            if(aminoAcid) {
                expect(TestUtils.isCorrectAminoAcid(aminoAcid, aminoAcidName)).toEqual(true);
            }
            else {
                throw new Error(`Invalid codon sequence did not return an AminoAcid: ${codon.getSequence()}`);
            }
        }
    }
});

test('testing AminoAcidName retrieval via getAminoAcidNameByCodon() using all codon variations for each amino acid', () => {
    let slc: keyof typeof SLC_AMINO_ACID_NAME_MAP;
    for(slc in SLC_AMINO_ACID_NAME_MAP) {
        const correctAminoAcidName = SLC_AMINO_ACID_NAME_MAP[slc];
        for(const codon of SLC_ALT_CODONS_MAP[slc]) {
            expect(getAminoAcidNameByCodon(codon)).toEqual(correctAminoAcidName);
        }
    }
});
