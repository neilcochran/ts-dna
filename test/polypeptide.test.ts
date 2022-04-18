import { RNA, Polypeptide, InvalidSequenceError } from '../src/model';
import { RNAtoAminoAcids  } from '../src/amino-acids';
import * as TestUtils from './test-utils';

test('create invalid polypeptide from empty RNA', () => {
    expect(() => {
        new Polypeptide(new RNA());
    }).toThrowError();
});

test('create invalid polypeptide from invalid length RNA sequence', () => {
    expect(() => {
        new Polypeptide(new RNA('AUGC'));
    }).toThrowError(InvalidSequenceError);
});

test('create invalid polypeptide from invalid (short) length RNA sequence', () => {
    expect(() => {
        new Polypeptide(new RNA('AU'));
    }).toThrowError(InvalidSequenceError);
});

test('create valid polypeptide from RNA_ALL_AMINO_ACIDS_1', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(new Polypeptide(TestUtils.RNA_ALL_AMINO_ACIDS_1).aminoAcidSequence, TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

test('create valid polypeptide from RNA_ALL_AMINO_ACIDS_2', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(new Polypeptide(TestUtils.RNA_ALL_AMINO_ACIDS_2).aminoAcidSequence, TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

test('RNAtoAminoAcids() from empty RNA', () => {
    expect(() => {
        RNAtoAminoAcids(new RNA());
    }).toThrowError(InvalidSequenceError);
});

test('RNAtoAminoAcids() from invalid length RNA sequence', () => {
    expect(() => {
        RNAtoAminoAcids(new RNA('AUGC'));
    }).toThrowError(InvalidSequenceError);
});

test('RNAtoAminoAcids() from invalid (short) length RNA sequence', () => {
    expect(() => {
        new Polypeptide(new RNA('AU'));
    }).toThrowError(InvalidSequenceError);
});

test('RNAtoAminoAcids() from RNA_ALL_AMINO_ACIDS_1', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(RNAtoAminoAcids(TestUtils.RNA_ALL_AMINO_ACIDS_1), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});

test('RNAtoAminoAcids() from RNA_ALL_AMINO_ACIDS_2', () => {
    expect(
        TestUtils.isCorrectAminoAcidSequence(RNAtoAminoAcids(TestUtils.RNA_ALL_AMINO_ACIDS_2), TestUtils.ALL_AMINO_ACIDS_SLC_SEQ)
    ).toEqual(true);
});
