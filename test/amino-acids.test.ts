import { 
    AminoAcid,
    AminoAcidName, 
    getAminoAcidByCodon, 
    getAminoAcidNameByCodon, 
    SLC_ALT_CODON_SEQ_MAP, 
    SLC_AMINO_ACID_NAME_MAP
} from '../src/amino-acids';
import { DNA, RNA } from '../src/nucleic-acids';

const ALANINE_RNA_CODON_1 = new RNA('GCU');
const ALANINE_RNA_CODON_2 = new RNA('GCG');
const ALANINE_DNA_CODON_1 = new DNA('GCT');
const ALANINE_DNA_CODON_2 = new DNA('GCG');

const isCorrectAminoAcid = (aminoAcid: AminoAcid, correctAminoAcidName: AminoAcidName): boolean => {
    let k: keyof  AminoAcidName;
    for(k in correctAminoAcidName) {
        if(aminoAcid[k] !== correctAminoAcidName[k]) {
            return false;
        }
    }
    return true;
};

test('create AminoAcid (Alanine) from valid RNA codon', () => {
    expect(isCorrectAminoAcid(new AminoAcid(ALANINE_RNA_CODON_1), SLC_AMINO_ACID_NAME_MAP['A'])).toEqual(true);
});

test('create AminoAcid (Alanine) from valid DNA codon', () => {
    expect(isCorrectAminoAcid(new AminoAcid(ALANINE_DNA_CODON_1), SLC_AMINO_ACID_NAME_MAP['A'])).toEqual(true);
});

test('create invalid AminoAcid (Alanine) from empty DNA', () => {
    expect(() => new AminoAcid(new DNA())).toThrowError();
});

test('create invalid AminoAcid (Alanine) from empty RNA', () => {
    expect(() => new AminoAcid(new RNA())).toThrowError();
});

test('create invalid AminoAcid (Alanine) from too long RNA', () => {
    expect(() => new AminoAcid(new RNA('AUCG'))).toThrowError();
});

test('create invalid AminoAcid (Alanine) from too long DNA', () => {
    expect(() => new AminoAcid(new DNA('ATCG'))).toThrowError();
});

test('get all AminoAcid (Alanine) alternate codons', () => {
    expect(new AminoAcid(ALANINE_RNA_CODON_2).getAllAlternateCodons()).toEqual(SLC_ALT_CODON_SEQ_MAP['A']);
});

test('ensure alternate AminoAcids (Alanine) return the same alternate RNA codons', () => {
    expect(new AminoAcid(ALANINE_RNA_CODON_1).getAllAlternateCodons()).toEqual(new AminoAcid(ALANINE_RNA_CODON_2).getAllAlternateCodons());
});

test('ensure alternate AminoAcids (Alanine) return the same alternate DNA codons', () => {
    expect(new AminoAcid(ALANINE_DNA_CODON_1).getAllAlternateCodons()).toEqual(new AminoAcid(ALANINE_DNA_CODON_2).getAllAlternateCodons());
});

test('DNA AminoAcids (Alanine) is equal', () => {
    expect(new AminoAcid(ALANINE_DNA_CODON_1).equals(new AminoAcid(ALANINE_DNA_CODON_1))).toEqual(true);
});

test('DNA AminoAcids (Alanine) not equal', () => {
    expect(new AminoAcid(ALANINE_DNA_CODON_1).equals(new AminoAcid(ALANINE_DNA_CODON_2))).toEqual(false);
});

test('RNA AminoAcids (Alanine) is equal', () => {
    expect(new AminoAcid(ALANINE_RNA_CODON_1).equals(new AminoAcid(ALANINE_RNA_CODON_1))).toEqual(true);
});

test('RNA AminoAcids (Alanine) is not equal', () => {
    expect(new AminoAcid(ALANINE_RNA_CODON_1).equals(new AminoAcid(ALANINE_RNA_CODON_2))).toEqual(false);
});

test('RNA AminoAcids (Alanine) are alternates', () => {
    expect(new AminoAcid(ALANINE_RNA_CODON_1).isAlternateOf(new AminoAcid(ALANINE_RNA_CODON_2))).toEqual(true);
});

test('DNA AminoAcids (Alanine) are alternates', () => {
    expect(new AminoAcid(ALANINE_DNA_CODON_1).isAlternateOf(new AminoAcid(ALANINE_DNA_CODON_2))).toEqual(true);
});

test('testing creation of all codon variations for each amino acid', () => {
    let slc: keyof typeof SLC_AMINO_ACID_NAME_MAP;
    for(slc in SLC_AMINO_ACID_NAME_MAP) {
        const aminoAcidName = SLC_AMINO_ACID_NAME_MAP[slc];
        for(const codon of SLC_ALT_CODON_SEQ_MAP[slc]) {
            expect(isCorrectAminoAcid(new AminoAcid(codon), aminoAcidName)).toEqual(true);
        }
    }
});

test('testing AminoAcid retreval via getAminoAcidByCodon() using all codon variations for each amino acid', () => {
    let slc: keyof typeof SLC_AMINO_ACID_NAME_MAP;
    for(slc in SLC_AMINO_ACID_NAME_MAP) {
        const aminoAcidName = SLC_AMINO_ACID_NAME_MAP[slc];
        for(const codon of SLC_ALT_CODON_SEQ_MAP[slc]) {
            const aminoAcid = getAminoAcidByCodon(codon);
            if(aminoAcid) {
                expect(isCorrectAminoAcid(aminoAcid, aminoAcidName)).toEqual(true);
            }
            else {
                throw new Error(`invalid codon sequence did not return an AminoAcid: ${codon.getSequence()}`);
            }
            
        }
    }
});

test('testing AminoAcidName retreval via getAminoAcidNameByCodon() using all codon variations for each amino acid', () => {
    let slc: keyof typeof SLC_AMINO_ACID_NAME_MAP;
    for(slc in SLC_AMINO_ACID_NAME_MAP) {
        const correctAminoAcidName = SLC_AMINO_ACID_NAME_MAP[slc];
        for(const codon of SLC_ALT_CODON_SEQ_MAP[slc]) {
            expect(getAminoAcidNameByCodon(codon)).toEqual(correctAminoAcidName);
        }
    }
});
