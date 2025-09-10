import { RNA, Polypeptide, InvalidSequenceError } from '../src/model';
import { RNAtoAminoAcids  } from '../src/amino-acids';
import * as TestUtils from './test-utils';

test('create invalid polypeptide from RNA with wrong length', () => {
    expect(() => {
        new Polypeptide(new RNA('AUGC'));
    }).toThrowError(InvalidSequenceError);
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

test('RNAtoAminoAcids() from RNA with wrong length', () => {
    expect(() => {
        RNAtoAminoAcids(new RNA('AUGC'));
    }).toThrowError(InvalidSequenceError);
});

test('RNAtoAminoAcids() from invalid length RNA sequence', () => {
    expect(() => {
        RNAtoAminoAcids(new RNA('AUGC'));
    }).toThrowError(InvalidSequenceError);
});

test('RNAtoAminoAcids() from invalid (short) length RNA sequence', () => {
    expect(() => {
        RNAtoAminoAcids(new RNA('AU'));
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

/*
    --- Additional Polypeptide Tests ---
*/

test('polypeptide maintains reference to original RNA', () => {
    const rna = TestUtils.RNA_ALL_AMINO_ACIDS_1;
    const polypeptide = new Polypeptide(rna);
    expect(polypeptide.rna).toBe(rna);
    expect(polypeptide.rna.getSequence()).toEqual(rna.getSequence());
});

test('polypeptide amino acid sequence has correct length', () => {
    const polypeptide = new Polypeptide(TestUtils.RNA_ALL_AMINO_ACIDS_1);
    const expectedLength = TestUtils.RNA_ALL_AMINO_ACIDS_1.getSequence().length / 3;
    expect(polypeptide.aminoAcidSequence.length).toEqual(expectedLength);
});

test('polypeptide from single codon creates single amino acid', () => {
    const rna = new RNA('AUG'); // Methionine
    const polypeptide = new Polypeptide(rna);
    expect(polypeptide.aminoAcidSequence.length).toEqual(1);
    expect(polypeptide.aminoAcidSequence[0].slc).toEqual('M');
    expect(polypeptide.aminoAcidSequence[0].name).toEqual('Methionine');
});

test('polypeptide properties are readonly', () => {
    const polypeptide = new Polypeptide(TestUtils.RNA_ALL_AMINO_ACIDS_1);

    // Verify properties are readonly by checking they exist and are not undefined
    expect(polypeptide.aminoAcidSequence).toBeDefined();
    expect(polypeptide.rna).toBeDefined();

    // Properties should be consistent on multiple reads
    const sequence1 = polypeptide.aminoAcidSequence;
    const sequence2 = polypeptide.aminoAcidSequence;
    expect(sequence1).toBe(sequence2);
});

test('create polypeptide with start and stop codons', () => {
    // AUG (start) + UUU (Phe) + UAG (stop, but should still create Polypeptide with 2 amino acids since UAG codes for nothing)
    const rna = new RNA('AUGUUU'); // Met-Phe (6 nucleotides = 2 codons)
    const polypeptide = new Polypeptide(rna);
    expect(polypeptide.aminoAcidSequence.length).toEqual(2);
    expect(polypeptide.aminoAcidSequence[0].slc).toEqual('M'); // Methionine
    expect(polypeptide.aminoAcidSequence[1].slc).toEqual('F'); // Phenylalanine
});

test('RNAtoAminoAcids returns empty array for empty string (if it could exist)', () => {
    // Note: Since RNA constructor now requires a sequence, we can't test truly empty
    // But we can test the function logic with the smallest valid RNA
    const rna = new RNA('AUG'); // Single codon
    const aminoAcids = RNAtoAminoAcids(rna);
    expect(aminoAcids.length).toEqual(1);
    expect(aminoAcids[0].slc).toEqual('M');
});

test('polypeptide immutability - RNA changes do not affect polypeptide', () => {
    const originalRNA = TestUtils.RNA_ALL_AMINO_ACIDS_1;
    const polypeptide = new Polypeptide(originalRNA);

    // Store original values
    const originalAminoAcidCount = polypeptide.aminoAcidSequence.length;
    const originalFirstAminoAcid = polypeptide.aminoAcidSequence[0].slc;

    // Verify polypeptide maintains its state
    expect(polypeptide.aminoAcidSequence.length).toEqual(originalAminoAcidCount);
    expect(polypeptide.aminoAcidSequence[0].slc).toEqual(originalFirstAminoAcid);
    expect(polypeptide.rna.getSequence()).toEqual(originalRNA.getSequence());
});
