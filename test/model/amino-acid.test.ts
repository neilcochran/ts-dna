import { AminoAcid } from '../../src/model/AminoAcid';
import { RNA } from '../../src/model/nucleic-acids/RNA';
import { AminoAcidPolarity } from '../../src/enums/amino-acid-polarity';
import { AminoAcidCharge } from '../../src/enums/amino-acid-charge';
import { AminoAcidSideChainType } from '../../src/enums/amino-acid-side-chain-type';
import { NucleicAcidType } from '../../src/enums/nucleic-acid-type';
import { AminoAcidData } from '../../src/types/amino-acid-data';
import { SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP } from '../../src/data/codon-map';
import { InvalidCodonError } from '../../src/model/errors/InvalidCodonError';

describe('AminoAcid Class', () => {
  describe('constructor', () => {
    test('creates amino acid from valid codon', () => {
      const codon = new RNA('AUG'); // Methionine start codon
      const aminoAcid = new AminoAcid(codon);

      expect(aminoAcid.name).toBe('Methionine');
      expect(aminoAcid.singleLetterCode).toBe('M');
      expect(aminoAcid.abbrv).toBe('Met');
      expect(aminoAcid.codon).toBe(codon);
      expect(aminoAcid.acidType).toBe(NucleicAcidType.RNA);
    });

    test('creates amino acid with correct molecular properties', () => {
      const codon = new RNA('AUG'); // Methionine
      const aminoAcid = new AminoAcid(codon);

      expect(aminoAcid.molecularWeight).toBe(149.208); // Methionine molecular weight
      expect(aminoAcid.polarity).toBeDefined();
      expect(aminoAcid.charge).toBeDefined();
      expect(aminoAcid.hydrophobicity).toBeDefined();
      expect(aminoAcid.sideChainType).toBeDefined();
    });

    test('creates different amino acids correctly', () => {
      // Test a few key amino acids
      const metCodon = new RNA('AUG'); // Methionine
      const pheCodon = new RNA('UUU'); // Phenylalanine
      const lysCodon = new RNA('AAA'); // Lysine

      const met = new AminoAcid(metCodon);
      const phe = new AminoAcid(pheCodon);
      const lys = new AminoAcid(lysCodon);

      expect(met.name).toBe('Methionine');
      expect(met.singleLetterCode).toBe('M');

      expect(phe.name).toBe('Phenylalanine');
      expect(phe.singleLetterCode).toBe('F');

      expect(lys.name).toBe('Lysine');
      expect(lys.singleLetterCode).toBe('K');
    });

    test('throws error for invalid codon length', () => {
      const shortCodon = new RNA('AU'); // Too short
      expect(() => new AminoAcid(shortCodon)).toThrow(InvalidCodonError);
      expect(() => new AminoAcid(shortCodon)).toThrow('Invalid codon length');

      const longCodon = new RNA('AUGG'); // Too long
      expect(() => new AminoAcid(longCodon)).toThrow(InvalidCodonError);
      expect(() => new AminoAcid(longCodon)).toThrow('Invalid codon length');
    });

    test('throws error for stop codons', () => {
      const stopCodons = ['UAA', 'UAG', 'UGA'];

      stopCodons.forEach(stopCodon => {
        const codon = new RNA(stopCodon);
        expect(() => new AminoAcid(codon)).toThrow(InvalidCodonError);
        expect(() => new AminoAcid(codon)).toThrow('No amino acid is associated with the codon');
        expect(() => new AminoAcid(codon)).toThrow(stopCodon);
      });
    });

    test('error messages include codon sequence', () => {
      const codon = new RNA('UAA');
      expect(() => new AminoAcid(codon)).toThrow('UAA');
    });
  });

  describe('getCodonSequence', () => {
    test('returns codon sequence', () => {
      const codon = new RNA('AUG');
      const aminoAcid = new AminoAcid(codon);
      expect(aminoAcid.getCodonSequence()).toBe('AUG');
    });

    test('returns different codon sequences correctly', () => {
      const metCodon = new RNA('AUG');
      const pheCodon = new RNA('UUU');

      const met = new AminoAcid(metCodon);
      const phe = new AminoAcid(pheCodon);

      expect(met.getCodonSequence()).toBe('AUG');
      expect(phe.getCodonSequence()).toBe('UUU');
    });
  });

  describe('getAllAlternateCodons', () => {
    test('returns all codons for amino acid', () => {
      const codon = new RNA('UUU'); // Phenylalanine
      const aminoAcid = new AminoAcid(codon);
      const alternateCodons = aminoAcid.getAllAlternateCodons();

      expect(alternateCodons).toHaveLength(2); // Phe has UUU and UUC
      expect(alternateCodons.map((codon: RNA) => codon.getSequence())).toContain('UUU');
      expect(alternateCodons.map((codon: RNA) => codon.getSequence())).toContain('UUC');
    });

    test('returns single codon for methionine (no alternatives)', () => {
      const codon = new RNA('AUG'); // Methionine
      const aminoAcid = new AminoAcid(codon);
      const alternateCodons = aminoAcid.getAllAlternateCodons();

      expect(alternateCodons).toHaveLength(1);
      expect(alternateCodons[0].getSequence()).toBe('AUG');
    });

    test('returns multiple codons for leucine (6 codons)', () => {
      const codon = new RNA('UUA'); // Leucine
      const aminoAcid = new AminoAcid(codon);
      const alternateCodons = aminoAcid.getAllAlternateCodons();

      expect(alternateCodons.length).toBeGreaterThan(4); // Leucine has 6 codons
      expect(alternateCodons.every(codon => codon instanceof RNA)).toBe(true);
    });

    test('all returned codons are valid RNA objects', () => {
      const codon = new RNA('GCA'); // Alanine
      const aminoAcid = new AminoAcid(codon);
      const alternateCodons = aminoAcid.getAllAlternateCodons();

      alternateCodons.forEach(codon => {
        expect(codon).toBeInstanceOf(RNA);
        expect(codon.getSequence()).toHaveLength(3);
        expect(codon.nucleicAcidType).toBe(NucleicAcidType.RNA);
      });
    });
  });

  describe('isAlternateOf', () => {
    test('returns false for same amino acid with same codon', () => {
      const amino1Codon = new RNA('GCG'); // Alanine
      const amino2Codon = new RNA('GCG'); // Same Alanine, same codon

      const amino1 = new AminoAcid(amino1Codon);
      const amino2 = new AminoAcid(amino2Codon);
      expect(amino1.isAlternateOf(amino2)).toBe(false);
    });

    test('returns true for same amino acid with different codon', () => {
      const amino1Codon = new RNA('GCA'); // Alanine - GCA
      const amino2Codon = new RNA('GCC'); // Alanine - GCC

      const amino1 = new AminoAcid(amino1Codon);
      const amino2 = new AminoAcid(amino2Codon);
      expect(amino1.isAlternateOf(amino2)).toBe(true);
      expect(amino2.isAlternateOf(amino1)).toBe(true);
    });

    test('returns false for different amino acids', () => {
      const metCodon = new RNA('AUG'); // Methionine
      const pheCodon = new RNA('UUU'); // Phenylalanine

      const met = new AminoAcid(metCodon);
      const phe = new AminoAcid(pheCodon);
      expect(met.isAlternateOf(phe)).toBe(false);
      expect(phe.isAlternateOf(met)).toBe(false);
    });

    test('works with all alanine codons', () => {
      const ala1Codon = new RNA('GCA');
      const ala2Codon = new RNA('GCC');
      const ala3Codon = new RNA('GCG');
      const ala4Codon = new RNA('GCU');

      const ala1 = new AminoAcid(ala1Codon);
      const ala2 = new AminoAcid(ala2Codon);
      const ala3 = new AminoAcid(ala3Codon);
      const ala4 = new AminoAcid(ala4Codon);

      // All should be alternates of each other
      expect(ala1.isAlternateOf(ala2)).toBe(true);
      expect(ala1.isAlternateOf(ala3)).toBe(true);
      expect(ala1.isAlternateOf(ala4)).toBe(true);
      expect(ala2.isAlternateOf(ala3)).toBe(true);
    });
  });

  describe('equals', () => {
    test('returns true for identical amino acids', () => {
      const amino1Codon = new RNA('GCG');
      const amino2Codon = new RNA('GCG');

      const amino1 = new AminoAcid(amino1Codon);
      const amino2 = new AminoAcid(amino2Codon);

      expect(amino1.equals(amino2)).toBe(true);
    });

    test('returns false for same amino acid with different codon', () => {
      const amino1Codon = new RNA('GCA'); // Alanine - GCA
      const amino2Codon = new RNA('GCC'); // Alanine - GCC

      const amino1 = new AminoAcid(amino1Codon);
      const amino2 = new AminoAcid(amino2Codon);
      expect(amino1.equals(amino2)).toBe(false);
    });

    test('returns false for different amino acids', () => {
      const metCodon = new RNA('AUG'); // Methionine
      const pheCodon = new RNA('UUU'); // Phenylalanine

      const met = new AminoAcid(metCodon);
      const phe = new AminoAcid(pheCodon);
      expect(met.equals(phe)).toBe(false);
    });

    test('equality is reflexive', () => {
      const codon = new RNA('AUG');
      const amino = new AminoAcid(codon);
      expect(amino.equals(amino)).toBe(true);
    });

    test('equality is symmetric', () => {
      const amino1Codon = new RNA('UUU');
      const amino2Codon = new RNA('UUU');

      const amino1 = new AminoAcid(amino1Codon);
      const amino2 = new AminoAcid(amino2Codon);
      expect(amino1.equals(amino2)).toBe(amino2.equals(amino1));
    });
  });

  describe('amino acid properties', () => {
    test('methionine has correct properties', () => {
      const codon = new RNA('AUG');
      const met = new AminoAcid(codon);
      expect(met.name).toBe('Methionine');
      expect(met.singleLetterCode).toBe('M');
      expect(met.abbrv).toBe('Met');
      expect(met.sideChainType).toBe(AminoAcidSideChainType.SULFUR_CONTAINING);
    });

    test('lysine has positive charge', () => {
      const codon = new RNA('AAA');
      const lys = new AminoAcid(codon);

      expect(lys.name).toBe('Lysine');
      expect(lys.charge).toBe(AminoAcidCharge.POSITIVE);
      expect(lys.sideChainType).toBe(AminoAcidSideChainType.BASIC);
    });

    test('aspartic acid has negative charge', () => {
      const codon = new RNA('GAU');
      const asp = new AminoAcid(codon);
      expect(asp.name).toBe('Aspartic acid');
      expect(asp.charge).toBe(AminoAcidCharge.NEGATIVE);
      expect(asp.sideChainType).toBe(AminoAcidSideChainType.ACIDIC);
    });

    test('alanine has neutral charge', () => {
      const codon = new RNA('GCA');
      const ala = new AminoAcid(codon);
      expect(ala.name).toBe('Alanine');
      expect(ala.charge).toBe(AminoAcidCharge.NEUTRAL);
      expect(ala.polarity).toBe(AminoAcidPolarity.NONPOLAR);
    });

    test('serine has polar properties', () => {
      const codon = new RNA('UCU');
      const ser = new AminoAcid(codon);
      expect(ser.name).toBe('Serine');
      expect(ser.polarity).toBe(AminoAcidPolarity.POLAR);
      expect(ser.sideChainType).toBe(AminoAcidSideChainType.HYDROXYL_CONTAINING);
    });

    test('all amino acids have valid molecular weights', () => {
      const codons = ['AUG', 'UUU', 'UUC', 'UUA', 'GCA', 'AAA', 'GAU'];

      codons.forEach(codonSeq => {
        const codon = new RNA(codonSeq);
        const amino = new AminoAcid(codon);
        expect(amino.molecularWeight).toBeGreaterThan(0);
        expect(amino.molecularWeight).toBeLessThan(1000); // Reasonable upper bound
      });
    });

    test('hydrophobicity values are in reasonable range', () => {
      const codons = ['AUG', 'UUU', 'UUC', 'UUA', 'GCA', 'AAA', 'GAU'];

      codons.forEach(codonSeq => {
        const codon = new RNA(codonSeq);
        const amino = new AminoAcid(codon);
        expect(amino.hydrophobicity).toBeGreaterThan(-10);
        expect(amino.hydrophobicity).toBeLessThan(10);
      });
    });
  });

  describe('immutability', () => {
    test('amino acid properties are readonly', () => {
      const codon = new RNA('AUG');
      const amino = new AminoAcid(codon);
      // These should be readonly (TypeScript compile-time check)
      expect(amino.name).toBe('Methionine');
      expect(amino.singleLetterCode).toBe('M');
      expect(amino.codon.getSequence()).toBe('AUG');
    });

    test('codon reference is preserved', () => {
      const codon = new RNA('AUG');
      const amino = new AminoAcid(codon);
      expect(amino.codon).toBe(codon); // Same reference
    });
  });

  describe('AminoAcidData interface implementation', () => {
    test('implements AminoAcidData interface correctly', () => {
      const codon = new RNA('AUG'); // Methionine
      const amino = new AminoAcid(codon);
      // Check that amino acid instance has all AminoAcidData properties
      const aminoAsData: AminoAcidData = amino;
      expect(aminoAsData.name).toBe('Methionine');
      expect(aminoAsData.abbrv).toBe('Met');
      expect(aminoAsData.singleLetterCode).toBe('M');
      expect(aminoAsData.molecularWeight).toBe(149.208);
      expect(aminoAsData.polarity).toBe(AminoAcidPolarity.NONPOLAR);
      expect(aminoAsData.charge).toBe(AminoAcidCharge.NEUTRAL);
      expect(aminoAsData.hydrophobicity).toBe(1.9);
      expect(aminoAsData.sideChainType).toBe(AminoAcidSideChainType.SULFUR_CONTAINING);
    });

    test('amino acid properties match data map exactly', () => {
      const testCases = [
        { codon: 'AUG', singleLetterCode: 'M' }, // Methionine
        { codon: 'UUU', singleLetterCode: 'F' }, // Phenylalanine
        { codon: 'AAA', singleLetterCode: 'K' }, // Lysine
        { codon: 'GAU', singleLetterCode: 'D' }, // Aspartic acid
        { codon: 'GCA', singleLetterCode: 'A' }, // Alanine
      ];

      testCases.forEach(({ codon, singleLetterCode }) => {
        const rnaCodon = new RNA(codon);
        const amino = new AminoAcid(rnaCodon);
        const dataMapEntry = SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP[singleLetterCode];

        expect(amino.name).toBe(dataMapEntry.name);
        expect(amino.abbrv).toBe(dataMapEntry.abbrv);
        expect(amino.singleLetterCode).toBe(dataMapEntry.singleLetterCode);
        expect(amino.molecularWeight).toBe(dataMapEntry.molecularWeight);
        expect(amino.polarity).toBe(dataMapEntry.polarity);
        expect(amino.charge).toBe(dataMapEntry.charge);
        expect(amino.hydrophobicity).toBe(dataMapEntry.hydrophobicity);
        expect(amino.sideChainType).toBe(dataMapEntry.sideChainType);
      });
    });

    test('all properties are populated from data map', () => {
      // Test all 20 amino acids have complete data
      const testCodons = [
        'GCA',
        'UGU',
        'GAU',
        'GAA',
        'UUU',
        'GGA',
        'CAU',
        'AUU',
        'AAA',
        'UUA',
        'AUG',
        'AAU',
        'CCA',
        'CAA',
        'AGA',
        'UCU',
        'ACU',
        'GUU',
        'UGG',
        'UAU',
      ];

      testCodons.forEach(codonSeq => {
        const codon = new RNA(codonSeq);
        const amino = new AminoAcid(codon);
        expect(amino.name).toBeDefined();
        expect(amino.name).not.toBe('');
        expect(amino.abbrv).toBeDefined();
        expect(amino.abbrv).not.toBe('');
        expect(amino.singleLetterCode).toBeDefined();
        expect(amino.singleLetterCode).not.toBe('');
        expect(amino.molecularWeight).toBeGreaterThan(0);
        expect(amino.polarity).toBeDefined();
        expect(amino.charge).toBeDefined();
        expect(typeof amino.hydrophobicity).toBe('number');
        expect(amino.sideChainType).toBeDefined();
      });
    });
  });

  describe('data mapping consistency', () => {
    test('alternate codons for same amino acid have identical properties', () => {
      // Test alanine codons (GCA, GCC, GCG, GCU)
      const alanineCodens = ['GCA', 'GCC', 'GCG', 'GCU'];
      const alanines: AminoAcid[] = [];

      alanineCodens.forEach(codon => {
        const rnaCodon = new RNA(codon);
        const amino = new AminoAcid(rnaCodon);
        alanines.push(amino);
      });

      expect(alanines.length).toBe(4);

      // All should have identical properties except codon
      for (let i = 1; i < alanines.length; i++) {
        expect(alanines[i].name).toBe(alanines[0].name);
        expect(alanines[i].abbrv).toBe(alanines[0].abbrv);
        expect(alanines[i].singleLetterCode).toBe(alanines[0].singleLetterCode);
        expect(alanines[i].molecularWeight).toBe(alanines[0].molecularWeight);
        expect(alanines[i].polarity).toBe(alanines[0].polarity);
        expect(alanines[i].charge).toBe(alanines[0].charge);
        expect(alanines[i].hydrophobicity).toBe(alanines[0].hydrophobicity);
        expect(alanines[i].sideChainType).toBe(alanines[0].sideChainType);

        // But different codons
        expect(alanines[i].codon.getSequence()).not.toBe(alanines[0].codon.getSequence());
      }
    });

    test('leucine codons have consistent properties', () => {
      // Leucine has 6 codons: UUA, UUG, CUA, CUC, CUG, CUU
      const leucineCodens = ['UUA', 'UUG', 'CUA', 'CUC', 'CUG', 'CUU'];
      const leucines: AminoAcid[] = [];

      leucineCodens.forEach(codon => {
        const rnaCodon = new RNA(codon);
        const amino = new AminoAcid(rnaCodon);
        leucines.push(amino);
      });

      expect(leucines.length).toBe(6);

      // All should be leucine with same properties
      leucines.forEach(leu => {
        expect(leu.name).toBe('Leucine');
        expect(leu.singleLetterCode).toBe('L');
        expect(leu.abbrv).toBe('Leu');
        expect(leu.sideChainType).toBe(AminoAcidSideChainType.ALIPHATIC);
      });
    });

    test('properties come from single source of truth', () => {
      const codon = new RNA('UUU'); // Phenylalanine
      const amino = new AminoAcid(codon);
      const dataMapEntry = SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP['F'];

      // Verify the instance gets its data from the map
      expect(amino.name).toBe(dataMapEntry.name);
      expect(amino.molecularWeight).toBe(dataMapEntry.molecularWeight);

      // Should be same reference for the properties (not just equal values)
      expect(amino.polarity).toBe(dataMapEntry.polarity);
      expect(amino.charge).toBe(dataMapEntry.charge);
      expect(amino.sideChainType).toBe(dataMapEntry.sideChainType);
    });
  });

  describe('biochemical property validation', () => {
    test('charged amino acids have correct charges', () => {
      // Positive
      const lysCodon = new RNA('AAA'); // Lysine
      const argCodon = new RNA('AGA'); // Arginine
      const hisCodon = new RNA('CAU'); // Histidine

      const lys = new AminoAcid(lysCodon);
      const arg = new AminoAcid(argCodon);
      const his = new AminoAcid(hisCodon);

      expect(lys.charge).toBe(AminoAcidCharge.POSITIVE);
      expect(arg.charge).toBe(AminoAcidCharge.POSITIVE);
      expect(his.charge).toBe(AminoAcidCharge.POSITIVE);

      // Negative
      const aspCodon = new RNA('GAU'); // Aspartic acid
      const gluCodon = new RNA('GAA'); // Glutamic acid

      const asp = new AminoAcid(aspCodon);
      const glu = new AminoAcid(gluCodon);

      expect(asp.charge).toBe(AminoAcidCharge.NEGATIVE);
      expect(glu.charge).toBe(AminoAcidCharge.NEGATIVE);
    });

    test('hydrophobic amino acids have positive hydrophobicity', () => {
      const hydrophobicCodons = ['UUU', 'AUU', 'UUA', 'GUU', 'GCA']; // Phe, Ile, Leu, Val, Ala

      hydrophobicCodons.forEach(codon => {
        const rnaCodon = new RNA(codon);
        const amino = new AminoAcid(rnaCodon);
        expect(amino.hydrophobicity).toBeGreaterThan(0);
        expect(amino.polarity).toBe(AminoAcidPolarity.NONPOLAR);
      });
    });

    test('polar amino acids have appropriate properties', () => {
      const polarCodons = ['UCU', 'ACU', 'UAU', 'AAU', 'CAA']; // Ser, Thr, Tyr, Asn, Gln

      polarCodons.forEach(codon => {
        const rnaCodon = new RNA(codon);
        const amino = new AminoAcid(rnaCodon);
        expect(amino.polarity).toBe(AminoAcidPolarity.POLAR);
      });
    });

    test('aromatic amino acids have correct side chain type', () => {
      const aromaticCodons = ['UUU', 'UAU', 'UGG']; // Phe, Tyr, Trp

      aromaticCodons.forEach(codon => {
        const rnaCodon = new RNA(codon);
        const amino = new AminoAcid(rnaCodon);
        expect(amino.sideChainType).toBe(AminoAcidSideChainType.AROMATIC);
      });
    });
  });

  describe('edge cases', () => {
    test('handles all 61 coding codons', () => {
      // This ensures all valid codons can create amino acids
      const validCodons = [
        'UUU',
        'UUC',
        'UUA',
        'UUG',
        'UCU',
        'UCC',
        'UCA',
        'UCG',
        'UAU',
        'UAC',
        'UGU',
        'UGC',
        'UGG',
        'CUU',
        'CUC',
        'CUA',
        'CUG',
        'CCU',
        'CCC',
        'CCA',
        'CCG',
        'CAU',
        'CAC',
        'CAA',
        'CAG',
        'CGU',
        'CGC',
        'CGA',
        'CGG',
        'AUU',
        'AUC',
        'AUA',
        'AUG',
        'ACU',
        'ACC',
        'ACA',
        'ACG',
        'AAU',
        'AAC',
        'AAA',
        'AAG',
        'AGU',
        'AGC',
        'AGA',
        'AGG',
        'GUU',
        'GUC',
        'GUA',
        'GUG',
        'GCU',
        'GCC',
        'GCA',
        'GCG',
        'GAU',
        'GAC',
        'GAA',
        'GAG',
        'GGU',
        'GGC',
        'GGA',
        'GGG',
      ];

      validCodons.forEach(codonSeq => {
        const codon = new RNA(codonSeq);
        const amino = new AminoAcid(codon);
        expect(amino.name).toBeDefined();
        expect(amino.singleLetterCode).toBeDefined();
      });
    });

    test('rejects all 3 stop codons', () => {
      const stopCodons = ['UAA', 'UAG', 'UGA'];

      stopCodons.forEach(codonSeq => {
        const codon = new RNA(codonSeq);
        expect(() => new AminoAcid(codon)).toThrow(InvalidCodonError);
        expect(() => new AminoAcid(codon)).toThrow('No amino acid is associated with the codon');
      });
    });
  });
});
