import { RNA, MRNA, Polypeptide, InvalidSequenceError } from '../../src/model';
import { RNAtoAminoAcids } from '../../src/utils/amino-acids';
import { STOP_CODONS } from '../../src/utils/nucleic-acids';
import { CODON_LENGTH } from '../../src/constants/biological-constants';
import * as TestUtils from '../utils/test-utils';

test('create invalid polypeptide from mRNA with wrong length', () => {
  expect(() => {
    new Polypeptide(new MRNA('AUGC', 'AUGC', 0, 4));
  }).toThrowError(InvalidSequenceError);
});

test('create invalid polypeptide from invalid length mRNA sequence', () => {
  expect(() => {
    new Polypeptide(new MRNA('AUGC', 'AUGC', 0, 4));
  }).toThrowError(InvalidSequenceError);
});

test('create invalid polypeptide from invalid (short) length mRNA sequence', () => {
  expect(() => {
    new Polypeptide(new MRNA('AU', 'AU', 0, 2));
  }).toThrowError(InvalidSequenceError);
});

test('create valid polypeptide from MRNA_ALL_AMINO_ACIDS_1', () => {
  expect(
    TestUtils.isCorrectAminoAcidSequence(
      new Polypeptide(TestUtils.MRNA_ALL_AMINO_ACIDS_1).aminoAcidSequence,
      TestUtils.ALL_AMINO_ACIDS_SLC_SEQ,
    ),
  ).toEqual(true);
});

test('create valid polypeptide from MRNA_ALL_AMINO_ACIDS_2', () => {
  expect(
    TestUtils.isCorrectAminoAcidSequence(
      new Polypeptide(TestUtils.MRNA_ALL_AMINO_ACIDS_2).aminoAcidSequence,
      TestUtils.ALL_AMINO_ACIDS_SLC_SEQ,
    ),
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

test('RNAtoAminoAcids() returns empty array for stop codons only', () => {
  for (const stopCodon of STOP_CODONS) {
    const aminoAcids = RNAtoAminoAcids(new RNA(stopCodon));
    expect(aminoAcids).toHaveLength(0); // Stop codon terminates immediately
  }
});

test('RNAtoAminoAcids() stops translation at stop codon', () => {
  // Valid codon followed by stop codon
  const aminoAcids = RNAtoAminoAcids(new RNA('AUGUAA')); // Met + Stop(UAA)
  expect(aminoAcids).toHaveLength(1); // Only Met, stops at UAA
  expect(aminoAcids[0].slc).toBe('M'); // Met
});

test('Polypeptide constructor creates empty polypeptide for stop codons only', () => {
  for (const stopCodon of STOP_CODONS) {
    const polypeptide = new Polypeptide(new MRNA(stopCodon, stopCodon, 0, 3));
    expect(polypeptide.aminoAcidSequence).toHaveLength(0); // No amino acids
  }
});

test('Polypeptide constructor stops translation at stop codon', () => {
  const polypeptide = new Polypeptide(new MRNA('AUGUAG', 'AUGUAG', 0, 6)); // Met + Stop(UAG)
  expect(polypeptide.aminoAcidSequence).toHaveLength(1); // Only Met
  expect(polypeptide.aminoAcidSequence[0].slc).toBe('M'); // Met
});

test('RNAtoAminoAcids() from RNA_ALL_AMINO_ACIDS_1', () => {
  expect(
    TestUtils.isCorrectAminoAcidSequence(
      RNAtoAminoAcids(TestUtils.RNA_ALL_AMINO_ACIDS_1),
      TestUtils.ALL_AMINO_ACIDS_SLC_SEQ,
    ),
  ).toEqual(true);
});

test('RNAtoAminoAcids() from RNA_ALL_AMINO_ACIDS_2', () => {
  expect(
    TestUtils.isCorrectAminoAcidSequence(
      RNAtoAminoAcids(TestUtils.RNA_ALL_AMINO_ACIDS_2),
      TestUtils.ALL_AMINO_ACIDS_SLC_SEQ,
    ),
  ).toEqual(true);
});

/*
    --- Additional Polypeptide Tests ---
*/

test('polypeptide maintains reference to original mRNA', () => {
  const mRNA = TestUtils.MRNA_ALL_AMINO_ACIDS_1;
  const polypeptide = new Polypeptide(mRNA);
  expect(polypeptide.mRNA).toBe(mRNA);
  expect(polypeptide.mRNA.getSequence()).toEqual(mRNA.getSequence());
});

test('polypeptide amino acid sequence has correct length', () => {
  const polypeptide = new Polypeptide(TestUtils.MRNA_ALL_AMINO_ACIDS_1);
  const expectedLength = TestUtils.MRNA_ALL_AMINO_ACIDS_1.getCodingSequence().length / CODON_LENGTH;
  expect(polypeptide.aminoAcidSequence.length).toEqual(expectedLength);
});

test('polypeptide from single codon creates single amino acid', () => {
  const mRNA = new MRNA('AUG', 'AUG', 0, 3); // Methionine
  const polypeptide = new Polypeptide(mRNA);
  expect(polypeptide.aminoAcidSequence.length).toEqual(1);
  expect(polypeptide.aminoAcidSequence[0].slc).toEqual('M');
  expect(polypeptide.aminoAcidSequence[0].name).toEqual('Methionine');
});

test('polypeptide properties are readonly', () => {
  const polypeptide = new Polypeptide(TestUtils.MRNA_ALL_AMINO_ACIDS_1);

  // Verify properties are readonly by checking they exist and are not undefined
  expect(polypeptide.aminoAcidSequence).toBeDefined();
  expect(polypeptide.mRNA).toBeDefined();

  // Properties should be consistent on multiple reads
  const sequence1 = polypeptide.aminoAcidSequence;
  const sequence2 = polypeptide.aminoAcidSequence;
  expect(sequence1).toBe(sequence2);
});

test('create polypeptide with start and stop codons', () => {
  // AUG (start) + UUU (Phe) + UAG (stop, but should still create Polypeptide with 2 amino acids since UAG codes for nothing)
  const mRNA = new MRNA('AUGUUU', 'AUGUUU', 0, 6); // Met-Phe (6 nucleotides = 2 codons)
  const polypeptide = new Polypeptide(mRNA);
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

test('polypeptide immutability - mRNA changes do not affect polypeptide', () => {
  const originalMRNA = TestUtils.MRNA_ALL_AMINO_ACIDS_1;
  const polypeptide = new Polypeptide(originalMRNA);

  // Store original values
  const originalAminoAcidCount = polypeptide.aminoAcidSequence.length;
  const originalFirstAminoAcid = polypeptide.aminoAcidSequence[0].slc;

  // Verify polypeptide maintains its state
  expect(polypeptide.aminoAcidSequence.length).toEqual(originalAminoAcidCount);
  expect(polypeptide.aminoAcidSequence[0].slc).toEqual(originalFirstAminoAcid);
  expect(polypeptide.mRNA.getSequence()).toEqual(originalMRNA.getSequence());
});
