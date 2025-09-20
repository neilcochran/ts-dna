import { RNA, AminoAcid, InvalidCodonError } from '../../src/model';
import {
  getAminoAcidByCodon,
  getAminoAcidDataByCodon,
  RNAtoAminoAcids,
  SLC_ALT_CODONS_MAP,
  SLC_AMINO_ACID_DATA_MAP,
} from '../../src/utils/amino-acids';
import {
  STOP_CODON_UAA,
  STOP_CODON_UAG,
  STOP_CODON_UGA,
  STOP_CODONS,
} from '../../src/utils/nucleic-acids';
import { AminoAcidPolarity, AminoAcidCharge, AminoAcidSideChainType } from '../../src';
import * as TestUtils from './test-utils';

/*
    --- AminoAcid from RNA ---
*/

test('create AminoAcid (Alanine) from valid RNA codon', () => {
  expect(
    TestUtils.isCorrectAminoAcid(
      new AminoAcid(TestUtils.ALANINE_RNA_CODON_1),
      SLC_AMINO_ACID_DATA_MAP['A'],
    ),
  ).toEqual(true);
});

test('create invalid AminoAcid from RNA with wrong length', () => {
  expect(() => new AminoAcid(new RNA('AU'))).toThrowError(InvalidCodonError);
});

test('create invalid AminoAcid (Alanine) from too long RNA', () => {
  expect(() => new AminoAcid(new RNA('AUCG'))).toThrowError(InvalidCodonError);
});

test('create invalid AminoAcid from stop codon UAA', () => {
  expect(() => new AminoAcid(new RNA(STOP_CODON_UAA))).toThrowError(InvalidCodonError);
});

test('create invalid AminoAcid from stop codon UAG', () => {
  expect(() => new AminoAcid(new RNA(STOP_CODON_UAG))).toThrowError(InvalidCodonError);
});

test('create invalid AminoAcid from stop codon UGA', () => {
  expect(() => new AminoAcid(new RNA(STOP_CODON_UGA))).toThrowError(InvalidCodonError);
});

test('getAminoAcidByCodon returns undefined for all stop codons', () => {
  for (const stopCodon of STOP_CODONS) {
    expect(getAminoAcidByCodon(new RNA(stopCodon))).toBeUndefined();
  }
});

test('getAminoAcidDataByCodon returns undefined for all stop codons', () => {
  for (const stopCodon of STOP_CODONS) {
    expect(getAminoAcidDataByCodon(new RNA(stopCodon))).toBeUndefined();
  }
});

test('get all AminoAcid (Alanine) alternate codons', () => {
  const expectedCodons = SLC_ALT_CODONS_MAP['A'].map(codonStr => new RNA(codonStr));
  expect(new AminoAcid(TestUtils.ALANINE_RNA_CODON_2).getAllAlternateCodons()).toEqual(
    expectedCodons,
  );
});

test('ensure alternate AminoAcids (Alanine) return the same alternate RNA codons', () => {
  expect(new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).getAllAlternateCodons()).toEqual(
    new AminoAcid(TestUtils.ALANINE_RNA_CODON_2).getAllAlternateCodons(),
  );
});

test('RNA AminoAcids (Alanine) is equal', () => {
  expect(
    new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).equals(
      new AminoAcid(TestUtils.ALANINE_RNA_CODON_1),
    ),
  ).toEqual(true);
});

test('RNA AminoAcids (Alanine) is not equal', () => {
  expect(
    new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).equals(
      new AminoAcid(TestUtils.ALANINE_RNA_CODON_2),
    ),
  ).toEqual(false);
});

test('RNA AminoAcids (Alanine) are alternates', () => {
  expect(
    new AminoAcid(TestUtils.ALANINE_RNA_CODON_1).isAlternateOf(
      new AminoAcid(TestUtils.ALANINE_RNA_CODON_2),
    ),
  ).toEqual(true);
});

/*
    --- Bulk AminoAcid creation and retrieval
*/

test('testing creation of all codon variations for each amino acid', () => {
  let slc: keyof typeof SLC_AMINO_ACID_DATA_MAP;
  for (slc in SLC_AMINO_ACID_DATA_MAP) {
    const aminoAcidData = SLC_AMINO_ACID_DATA_MAP[slc];
    for (const codonStr of SLC_ALT_CODONS_MAP[slc]) {
      const codon = new RNA(codonStr);
      expect(TestUtils.isCorrectAminoAcid(new AminoAcid(codon), aminoAcidData)).toEqual(true);
    }
  }
});

test('testing AminoAcid retrieval via getAminoAcidByCodon() using all codon variations for each amino acid', () => {
  let slc: keyof typeof SLC_AMINO_ACID_DATA_MAP;
  for (slc in SLC_AMINO_ACID_DATA_MAP) {
    const aminoAcidData = SLC_AMINO_ACID_DATA_MAP[slc];
    for (const codonStr of SLC_ALT_CODONS_MAP[slc]) {
      const codon = new RNA(codonStr);
      const aminoAcid = getAminoAcidByCodon(codon);
      if (aminoAcid) {
        expect(TestUtils.isCorrectAminoAcid(aminoAcid, aminoAcidData)).toEqual(true);
      } else {
        throw new Error(`Invalid codon sequence did not return an AminoAcid: ${codonStr}`);
      }
    }
  }
});

/*
    --- Amino Acid Properties Tests ---
*/

test('AminoAcid has correct molecular weight for Alanine', () => {
  const alanine = new AminoAcid(new RNA('GCA'));
  expect(alanine.molecularWeight).toBe(89.094);
});

test('AminoAcid has correct polarity for Alanine (nonpolar)', () => {
  const alanine = new AminoAcid(new RNA('GCA'));
  expect(alanine.polarity).toBe(AminoAcidPolarity.NONPOLAR);
});

test('AminoAcid has correct charge for Alanine (neutral)', () => {
  const alanine = new AminoAcid(new RNA('GCA'));
  expect(alanine.charge).toBe(AminoAcidCharge.NEUTRAL);
});

test('AminoAcid has correct hydrophobicity for Alanine', () => {
  const alanine = new AminoAcid(new RNA('GCA'));
  expect(alanine.hydrophobicity).toBe(1.8);
});

test('AminoAcid has correct side chain type for Alanine (aliphatic)', () => {
  const alanine = new AminoAcid(new RNA('GCA'));
  expect(alanine.sideChainType).toBe(AminoAcidSideChainType.ALIPHATIC);
});

test('AminoAcid properties for charged amino acids - Lysine (positive)', () => {
  const lysine = new AminoAcid(new RNA('AAA'));
  expect(lysine.charge).toBe(AminoAcidCharge.POSITIVE);
  expect(lysine.polarity).toBe(AminoAcidPolarity.POLAR);
  expect(lysine.sideChainType).toBe(AminoAcidSideChainType.BASIC);
  expect(lysine.molecularWeight).toBe(146.189);
  expect(lysine.hydrophobicity).toBe(-3.9);
});

test('AminoAcid properties for charged amino acids - Aspartic acid (negative)', () => {
  const asparticAcid = new AminoAcid(new RNA('GAC'));
  expect(asparticAcid.charge).toBe(AminoAcidCharge.NEGATIVE);
  expect(asparticAcid.polarity).toBe(AminoAcidPolarity.POLAR);
  expect(asparticAcid.sideChainType).toBe(AminoAcidSideChainType.ACIDIC);
  expect(asparticAcid.molecularWeight).toBe(133.104);
  expect(asparticAcid.hydrophobicity).toBe(-3.5);
});

test('AminoAcid properties for aromatic amino acids - Phenylalanine', () => {
  const phenylalanine = new AminoAcid(new RNA('UUC'));
  expect(phenylalanine.charge).toBe(AminoAcidCharge.NEUTRAL);
  expect(phenylalanine.polarity).toBe(AminoAcidPolarity.NONPOLAR);
  expect(phenylalanine.sideChainType).toBe(AminoAcidSideChainType.AROMATIC);
  expect(phenylalanine.molecularWeight).toBe(165.192);
  expect(phenylalanine.hydrophobicity).toBe(2.8);
});

test('AminoAcid properties for sulfur-containing amino acids - Cysteine', () => {
  const cysteine = new AminoAcid(new RNA('UGC'));
  expect(cysteine.charge).toBe(AminoAcidCharge.NEUTRAL);
  expect(cysteine.polarity).toBe(AminoAcidPolarity.POLAR);
  expect(cysteine.sideChainType).toBe(AminoAcidSideChainType.SULFUR_CONTAINING);
  expect(cysteine.molecularWeight).toBe(121.154);
  expect(cysteine.hydrophobicity).toBe(2.5);
});

test('AminoAcid properties for imino acid - Proline', () => {
  const proline = new AminoAcid(new RNA('CCA'));
  expect(proline.charge).toBe(AminoAcidCharge.NEUTRAL);
  expect(proline.polarity).toBe(AminoAcidPolarity.NONPOLAR);
  expect(proline.sideChainType).toBe(AminoAcidSideChainType.IMINO);
  expect(proline.molecularWeight).toBe(115.132);
  expect(proline.hydrophobicity).toBe(-1.6);
});

test('AminoAcid properties consistent across alternate codons - Leucine', () => {
  const leucine1 = new AminoAcid(new RNA('UUA'));
  const leucine2 = new AminoAcid(new RNA('CUG'));

  expect(leucine1.molecularWeight).toBe(leucine2.molecularWeight);
  expect(leucine1.polarity).toBe(leucine2.polarity);
  expect(leucine1.charge).toBe(leucine2.charge);
  expect(leucine1.hydrophobicity).toBe(leucine2.hydrophobicity);
  expect(leucine1.sideChainType).toBe(leucine2.sideChainType);
});

test('all amino acids have valid properties from data map', () => {
  let slc: keyof typeof SLC_AMINO_ACID_DATA_MAP;
  for (slc in SLC_AMINO_ACID_DATA_MAP) {
    const data = SLC_AMINO_ACID_DATA_MAP[slc];

    expect(typeof data.molecularWeight).toBe('number');
    expect(data.molecularWeight).toBeGreaterThan(0);

    expect(Object.values(AminoAcidPolarity)).toContain(data.polarity);
    expect(Object.values(AminoAcidCharge)).toContain(data.charge);
    expect(Object.values(AminoAcidSideChainType)).toContain(data.sideChainType);

    expect(typeof data.hydrophobicity).toBe('number');
  }
});

test('getAminoAcidDataByCodon returns undefined for invalid codon length', () => {
  // Test line 56: sequence.length !== CODON_LENGTH
  const shortCodon = new RNA('AU'); // Too short
  const longCodon = new RNA('AUGC'); // Too long

  expect(getAminoAcidDataByCodon(shortCodon)).toBeUndefined();
  expect(getAminoAcidDataByCodon(longCodon)).toBeUndefined();
});

test('getAminoAcidDataByCodon returns undefined for invalid codon sequence', () => {
  // Test line 61: !slc check - need a 3-nucleotide sequence that's not in the codon map
  // This is tricky because the codon map should cover all valid RNA codons
  // Let's create a mock RNA that returns an invalid sequence
  const mockRNA = {
    getSequence: () => 'XXX', // Invalid nucleotides
  } as any;

  expect(getAminoAcidDataByCodon(mockRNA)).toBeUndefined();
});

// Tests for RNAtoAminoAcids function
describe('RNAtoAminoAcids', () => {
  test('converts valid RNA sequence to amino acids', () => {
    // Test basic functionality - already covered indirectly but make explicit
    const rna = new RNA('AUGAAACCC'); // Met-Lys-Pro
    const aminoAcids = RNAtoAminoAcids(rna);

    expect(aminoAcids).toHaveLength(3);
    expect(aminoAcids[0].slc).toBe('M');
    expect(aminoAcids[1].slc).toBe('K');
    expect(aminoAcids[2].slc).toBe('P');
  });

  test('throws error for RNA sequence length not divisible by 3', () => {
    // Test line 90-96: Invalid codon length
    const rna = new RNA('AUGAA'); // 5 nucleotides - not divisible by 3

    expect(() => RNAtoAminoAcids(rna)).toThrow('Invalid codon');
    expect(() => RNAtoAminoAcids(rna)).toThrow('The RNA sequence length must be divisible by 3');
  });

  test('stops translation at stop codon', () => {
    // Test line 103-105: Stop codon handling
    const rna = new RNA('AUGAAAUAGCCC'); // Met-Lys-STOP-Pro
    const aminoAcids = RNAtoAminoAcids(rna);

    expect(aminoAcids).toHaveLength(2); // Only Met and Lys, stops at UAG
    expect(aminoAcids[0].slc).toBe('M');
    expect(aminoAcids[1].slc).toBe('K');
  });

  test('throws error for invalid codon encountered', () => {
    // Test line 109-111: Invalid codon error
    // Since all valid RNA codons are mapped to amino acids or stop codons,
    // we need to create a scenario where getAminoAcidByCodon returns null
    // We'll mock the codon map lookup to return null for a specific codon
    const originalGetAminoAcid = getAminoAcidByCodon;

    // Create a spy that returns null for a specific codon
    const getAminoAcidSpy = jest.fn(rna => {
      if (rna.getSequence() === 'CCC') {
        return null; // Mock this codon as unmapped
      }
      return originalGetAminoAcid(rna);
    });

    // Replace the function temporarily
    const aminoAcidsModule = require('../../src/utils/amino-acids');
    aminoAcidsModule.getAminoAcidByCodon = getAminoAcidSpy;

    const rna = new RNA('AUGAAACCC'); // Met-Lys-MockInvalid

    expect(() => RNAtoAminoAcids(rna)).toThrow('Invalid codon encountered: CCC');

    // Restore original function
    aminoAcidsModule.getAminoAcidByCodon = originalGetAminoAcid;
  });

  test('handles empty sequence after stop codon removal', () => {
    // Test edge case: sequence that starts with stop codon
    const rna = new RNA('UAGAAACCC'); // STOP-Lys-Pro
    const aminoAcids = RNAtoAminoAcids(rna);

    expect(aminoAcids).toHaveLength(0); // No amino acids, immediate stop
  });

  test('handles all three stop codons correctly', () => {
    // Test all stop codons terminate translation
    const testCases = [
      { seq: 'AUGAAAUAA', stopCodon: 'UAA' },
      { seq: 'AUGAAAUAG', stopCodon: 'UAG' },
      { seq: 'AUGAAAUGA', stopCodon: 'UGA' },
    ];

    testCases.forEach(({ seq, stopCodon }) => {
      const rna = new RNA(seq);
      const aminoAcids = RNAtoAminoAcids(rna);

      expect(aminoAcids).toHaveLength(2); // Met-Lys, then stop
      expect(aminoAcids[0].slc).toBe('M');
      expect(aminoAcids[1].slc).toBe('K');
    });
  });
});
