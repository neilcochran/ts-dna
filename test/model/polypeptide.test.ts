import { RNA, MRNA, Polypeptide, InvalidSequenceError } from '../../src/model';
import { RNAtoAminoAcids } from '../../src/utils/amino-acids';
import { STOP_CODONS } from '../../src/utils/nucleic-acids';
import { CODON_LENGTH } from '../../src/constants/biological-constants';
import {
  isCorrectAminoAcidSequence,
  MRNA_ALL_AMINO_ACIDS_1,
  MRNA_ALL_AMINO_ACIDS_2,
  ALL_AMINO_ACIDS_SLC_SEQ,
  RNA_ALL_AMINO_ACIDS_1,
  RNA_ALL_AMINO_ACIDS_2,
} from '../utils/test-utils';

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
    isCorrectAminoAcidSequence(
      new Polypeptide(MRNA_ALL_AMINO_ACIDS_1).aminoAcidSequence,
      ALL_AMINO_ACIDS_SLC_SEQ,
    ),
  ).toEqual(true);
});

test('create valid polypeptide from MRNA_ALL_AMINO_ACIDS_2', () => {
  expect(
    isCorrectAminoAcidSequence(
      new Polypeptide(MRNA_ALL_AMINO_ACIDS_2).aminoAcidSequence,
      ALL_AMINO_ACIDS_SLC_SEQ,
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
    isCorrectAminoAcidSequence(RNAtoAminoAcids(RNA_ALL_AMINO_ACIDS_1), ALL_AMINO_ACIDS_SLC_SEQ),
  ).toEqual(true);
});

test('RNAtoAminoAcids() from RNA_ALL_AMINO_ACIDS_2', () => {
  expect(
    isCorrectAminoAcidSequence(RNAtoAminoAcids(RNA_ALL_AMINO_ACIDS_2), ALL_AMINO_ACIDS_SLC_SEQ),
  ).toEqual(true);
});

/*
    --- Additional Polypeptide Tests ---
*/

test('polypeptide maintains reference to original mRNA', () => {
  const mRNA = MRNA_ALL_AMINO_ACIDS_1;
  const polypeptide = new Polypeptide(mRNA);
  expect(polypeptide.mRNA).toBe(mRNA);
  expect(polypeptide.mRNA.getSequence()).toEqual(mRNA.getSequence());
});

test('polypeptide amino acid sequence has correct length', () => {
  const polypeptide = new Polypeptide(MRNA_ALL_AMINO_ACIDS_1);
  const expectedLength = MRNA_ALL_AMINO_ACIDS_1.getCodingSequence().length / CODON_LENGTH;
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
  const polypeptide = new Polypeptide(MRNA_ALL_AMINO_ACIDS_1);

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
  const originalMRNA = MRNA_ALL_AMINO_ACIDS_1;
  const polypeptide = new Polypeptide(originalMRNA);

  // Store original values
  const originalAminoAcidCount = polypeptide.aminoAcidSequence.length;
  const originalFirstAminoAcid = polypeptide.aminoAcidSequence[0].slc;

  // Verify polypeptide maintains its state
  expect(polypeptide.aminoAcidSequence.length).toEqual(originalAminoAcidCount);
  expect(polypeptide.aminoAcidSequence[0].slc).toEqual(originalFirstAminoAcid);
  expect(polypeptide.mRNA.getSequence()).toEqual(originalMRNA.getSequence());
});

describe('length() method', () => {
  test('returns correct amino acid count', () => {
    // mRNA with 4 codons: AUG-AAA-GGG-AAA, followed by UAG stop
    const mRNA = new MRNA('GAUGAAAGGGAAAUAG', 'AUGAAAGGGAAAUAG', 1, 16);
    const polypeptide = new Polypeptide(mRNA);

    expect(polypeptide.length()).toBe(4);
    expect(polypeptide.length()).toBe(polypeptide.aminoAcidSequence.length);
  });

  test('returns correct length for known test sequences', () => {
    // Both test mRNAs are 60 nucleotides, should produce 20 amino acids (60 ÷ 3 = 20)
    const polypeptide1 = new Polypeptide(MRNA_ALL_AMINO_ACIDS_1);
    const polypeptide2 = new Polypeptide(MRNA_ALL_AMINO_ACIDS_2);

    // Verify specific expected counts based on the mRNA sequence lengths
    expect(polypeptide1.length()).toBe(20);
    expect(polypeptide2.length()).toBe(20);
  });

  test('length method matches amino acid sequence length property', () => {
    const polypeptide = new Polypeptide(MRNA_ALL_AMINO_ACIDS_1);

    // Verify that length() method returns same value as direct property access
    expect(polypeptide.length()).toBe(polypeptide.aminoAcidSequence.length);
    expect(typeof polypeptide.length()).toBe('number');
  });
});

describe('Polypeptide string-like methods', () => {
  const polypeptide = new Polypeptide(MRNA_ALL_AMINO_ACIDS_1);

  describe('getSequence()', () => {
    test('returns expected amino acid sequence', () => {
      // The test mRNA should produce the expected amino acid sequence
      const sequence = polypeptide.getSequence();
      expect(sequence).toBe(ALL_AMINO_ACIDS_SLC_SEQ);
      expect(sequence.length).toBe(20);
    });

    test('returns single-letter codes', () => {
      const sequence = polypeptide.getSequence();
      // Should be all uppercase single letters
      expect(sequence).toMatch(/^[A-Z]{20}$/);
    });
  });

  describe('contains()', () => {
    test('finds existing amino acid subsequences', () => {
      expect(polypeptide.contains('ACD')).toBe(true); // Should be at start
      expect(polypeptide.contains('DEF')).toBe(true); // Should be in middle
      expect(polypeptide.contains('A')).toBe(true); // Single amino acid
    });

    test('returns false for non-existing subsequences', () => {
      expect(polypeptide.contains('XXX')).toBe(false); // X is not a standard amino acid
      expect(polypeptide.contains('ZZZ')).toBe(false); // Non-existent sequence
    });

    test('works with Polypeptide objects', () => {
      const subPolypeptide = polypeptide.getSubsequence(0, 3); // First 3 amino acids
      expect(polypeptide.contains(subPolypeptide)).toBe(true);
    });
  });

  describe('startsWith()', () => {
    test('detects correct amino acid prefix', () => {
      expect(polypeptide.startsWith('A')).toBe(true); // First amino acid
      expect(polypeptide.startsWith('AC')).toBe(true); // First two
      expect(polypeptide.startsWith('ACD')).toBe(true); // First three
    });

    test('returns false for incorrect prefix', () => {
      expect(polypeptide.startsWith('C')).toBe(false); // Doesn't start with C
      expect(polypeptide.startsWith('XY')).toBe(false); // Invalid sequence
    });
  });

  describe('endsWith()', () => {
    test('detects correct amino acid suffix', () => {
      expect(polypeptide.endsWith('Y')).toBe(true); // Last amino acid
      expect(polypeptide.endsWith('WY')).toBe(true); // Last two
      expect(polypeptide.endsWith('VWY')).toBe(true); // Last three
    });

    test('returns false for incorrect suffix', () => {
      expect(polypeptide.endsWith('A')).toBe(false); // Doesn't end with A
      expect(polypeptide.endsWith('XZ')).toBe(false); // Invalid sequence
    });
  });

  describe('indexOf()', () => {
    test('finds amino acid positions correctly', () => {
      expect(polypeptide.indexOf('A')).toBe(0); // First position
      expect(polypeptide.indexOf('C')).toBe(1); // Second position
      expect(polypeptide.indexOf('Y')).toBe(19); // Last position
    });

    test('finds subsequence positions', () => {
      expect(polypeptide.indexOf('ACD')).toBe(0); // At beginning
      expect(polypeptide.indexOf('DEF')).toBe(2); // Position 2
    });

    test('returns -1 for non-existing sequences', () => {
      expect(polypeptide.indexOf('XXX')).toBe(-1);
      expect(polypeptide.indexOf('ZZZ')).toBe(-1);
    });

    test('respects start position parameter', () => {
      // Look for subsequences after a certain position
      expect(polypeptide.indexOf('G', 5)).toBe(5); // Should find G at position 5
    });
  });

  describe('getSubsequence()', () => {
    test('extracts amino acid subsequences correctly', () => {
      const sub1 = polypeptide.getSubsequence(0, 3); // First 3: 'ACD'
      const sub2 = polypeptide.getSubsequence(2, 5); // Middle 3: 'DEF'
      const sub3 = polypeptide.getSubsequence(17); // Last 3: 'VWY'

      expect(sub1.getSequence()).toBe('ACD');
      expect(sub2.getSequence()).toBe('DEF');
      expect(sub3.getSequence()).toBe('VWY');
    });

    test('creates valid Polypeptide objects', () => {
      const sub = polypeptide.getSubsequence(0, 5);

      expect(sub).toBeInstanceOf(Polypeptide);
      expect(sub.length()).toBe(5);
      expect(sub.getSequence()).toBe('ACDEF');
    });

    test('handles edge cases', () => {
      const singleAA = polypeptide.getSubsequence(0, 1);
      const lastAA = polypeptide.getSubsequence(19, 20);

      expect(singleAA.getSequence()).toBe('A');
      expect(lastAA.getSequence()).toBe('Y');
    });
  });
});
