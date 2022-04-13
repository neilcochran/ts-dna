import { DNA, RNA } from '../src/nucleic-acids';
import { nucleicAcidToAminoAcids, Polypeptide } from '../src/polypeptide';
import * as TestUtils from './test-utils';

/*
    --- Polypeptide from RNA ---
*/

test('create invalid polypeptide from empty RNA', () => {
    expect(() => {
        new Polypeptide(new RNA());
    }).toThrowError();
});

test('create invalid polypeptide from invalid length RNA sequence', () => {
    expect(() => {
        new Polypeptide(new RNA('AUGC'));
    }).toThrowError();
});

test('create invalid polypeptide from invalid (short) length RNA sequence', () => {
    expect(() => {
        new Polypeptide(new RNA('AU'));
    }).toThrowError();
});

test('create valid polypeptide from RNA_ALL_AMINO_ACIDS_1', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(new Polypeptide(TestUtils.RNA_ALL_AMINO_ACIDS_1).getAminoAcidSequence(), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

test('create valid polypeptide from RNA_ALL_AMINO_ACIDS_2', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(new Polypeptide(TestUtils.RNA_ALL_AMINO_ACIDS_2).getAminoAcidSequence(), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

/*
    --- Polypeptide from DNA ---
*/

test('create invalid polypeptide from empty DNA', () => {
    expect(() => {
        new Polypeptide(new DNA());
    }).toThrowError();
});

test('create invalid polypeptide from invalid length DNA sequence', () => {
    expect(() => {
        new Polypeptide(new DNA('ATGC'));
    }).toThrowError();
});

test('create invalid polypeptide from invalid (short) length DNA sequence', () => {
    expect(() => {
        new Polypeptide(new DNA('AT'));
    }).toThrowError();
});

test('create valid polypeptide from DNA_ALL_AMINO_ACIDS_1', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(new Polypeptide(TestUtils.DNA_ALL_AMINO_ACIDS_1).getAminoAcidSequence(), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

test('create valid polypeptide from DNA_ALL_AMINO_ACIDS_2', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(new Polypeptide(TestUtils.DNA_ALL_AMINO_ACIDS_2).getAminoAcidSequence(), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

/*
    --- nucleicAcidToAminoAcids() from RNA ---
*/

test('nucleicAcidToAminoAcids() from empty RNA', () => {
    expect(() => {
        nucleicAcidToAminoAcids(new RNA());
    }).toThrowError();
});

test('nucleicAcidToAminoAcids() from invalid length RNA sequence', () => {
    expect(() => {
        nucleicAcidToAminoAcids(new RNA('AUGC'));
    }).toThrowError();
});

test('nucleicAcidToAminoAcids() from invalid (short) length RNA sequence', () => {
    expect(() => {
        new Polypeptide(new RNA('AU'));
    }).toThrowError();
});

test('nucleicAcidToAminoAcids() from RNA_ALL_AMINO_ACIDS_1', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(nucleicAcidToAminoAcids(TestUtils.RNA_ALL_AMINO_ACIDS_1), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

test('nucleicAcidToAminoAcids() from RNA_ALL_AMINO_ACIDS_2', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(nucleicAcidToAminoAcids(TestUtils.RNA_ALL_AMINO_ACIDS_2), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

/*
    --- nucleicAcidToAminoAcids() from DNA ---
*/

test('nucleicAcidToAminoAcids() from empty DNA', () => {
    expect(() => {
        nucleicAcidToAminoAcids(new DNA());
    }).toThrowError();
});

test('nucleicAcidToAminoAcids() from invalid length DNA sequence', () => {
    expect(() => {
        nucleicAcidToAminoAcids(new DNA('ATGC'));
    }).toThrowError();
});

test('nucleicAcidToAminoAcids() from invalid (short) length DNA sequence', () => {
    expect(() => {
        nucleicAcidToAminoAcids(new DNA('AT'));
    }).toThrowError();
});

test('nucleicAcidToAminoAcids() from DNA_ALL_AMINO_ACIDS_1', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(nucleicAcidToAminoAcids(TestUtils.DNA_ALL_AMINO_ACIDS_1), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

test('nucleicAcidToAminoAcids() from DNA_ALL_AMINO_ACIDS_2', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(nucleicAcidToAminoAcids(TestUtils.DNA_ALL_AMINO_ACIDS_2), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});
