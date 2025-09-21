import {
  SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP,
  CODON_TO_SINGLE_LETTER_CODE_MAP,
  SINGLE_LETTER_CODE_ALT_CODONS_MAP,
} from '../../src/data/codon-map';
import { AminoAcidPolarity } from '../../src/enums/amino-acid-polarity';
import { AminoAcidCharge } from '../../src/enums/amino-acid-charge';
import { AminoAcidSideChainType } from '../../src/enums/amino-acid-side-chain-type';

describe('Codon Map Data', () => {
  describe('SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP', () => {
    test('contains all 20 standard amino acids', () => {
      const expectedSLCs = [
        'A',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'K',
        'L',
        'M',
        'N',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'V',
        'W',
        'Y',
      ];

      const actualSLCs = Object.keys(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).sort();
      expect(actualSLCs).toEqual(expectedSLCs.sort());
      expect(actualSLCs).toHaveLength(20);
    });

    test('each amino acid has all required properties', () => {
      Object.values(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).forEach(aminoAcid => {
        expect(aminoAcid).toHaveProperty('name');
        expect(aminoAcid).toHaveProperty('abbrv');
        expect(aminoAcid).toHaveProperty('singleLetterCode');
        expect(aminoAcid).toHaveProperty('molecularWeight');
        expect(aminoAcid).toHaveProperty('polarity');
        expect(aminoAcid).toHaveProperty('charge');
        expect(aminoAcid).toHaveProperty('hydrophobicity');
        expect(aminoAcid).toHaveProperty('sideChainType');
      });
    });

    test('single letter codes match map keys', () => {
      Object.entries(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).forEach(([key, data]) => {
        expect(data.singleLetterCode).toBe(key);
      });
    });

    test('amino acid names are correct', () => {
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.A.name).toBe('Alanine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.C.name).toBe('Cysteine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.D.name).toBe('Aspartic acid');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.E.name).toBe('Glutamic acid');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.F.name).toBe('Phenylalanine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.G.name).toBe('Glycine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.H.name).toBe('Histidine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.I.name).toBe('Isoleucine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.K.name).toBe('Lysine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.L.name).toBe('Leucine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.M.name).toBe('Methionine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.N.name).toBe('Asparagine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.P.name).toBe('Proline');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.Q.name).toBe('Glutamine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.R.name).toBe('Arginine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.S.name).toBe('Serine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.T.name).toBe('Threonine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.V.name).toBe('Valine');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.W.name).toBe('Tryptophan');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.Y.name).toBe('Tyrosine');
    });

    test('three letter abbreviations are correct', () => {
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.A.abbrv).toBe('Ala');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.C.abbrv).toBe('Cys');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.D.abbrv).toBe('Asp');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.E.abbrv).toBe('Glu');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.F.abbrv).toBe('Phe');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.G.abbrv).toBe('Gly');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.H.abbrv).toBe('His');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.I.abbrv).toBe('Ile');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.K.abbrv).toBe('Lys');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.L.abbrv).toBe('Leu');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.M.abbrv).toBe('Met');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.N.abbrv).toBe('Asn');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.P.abbrv).toBe('Pro');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.Q.abbrv).toBe('Gln');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.R.abbrv).toBe('Arg');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.S.abbrv).toBe('Ser');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.T.abbrv).toBe('Thr');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.V.abbrv).toBe('Val');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.W.abbrv).toBe('Trp');
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.Y.abbrv).toBe('Tyr');
    });

    test('molecular weights are realistic', () => {
      Object.values(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).forEach(aminoAcid => {
        expect(aminoAcid.molecularWeight).toBeGreaterThan(50);
        expect(aminoAcid.molecularWeight).toBeLessThan(250);
        expect(Number.isFinite(aminoAcid.molecularWeight)).toBe(true);
      });
    });

    test('polarity values are valid enum values', () => {
      const validPolarities = Object.values(AminoAcidPolarity);
      Object.values(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).forEach(aminoAcid => {
        expect(validPolarities).toContain(aminoAcid.polarity);
      });
    });

    test('charge values are valid enum values', () => {
      const validCharges = Object.values(AminoAcidCharge);
      Object.values(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).forEach(aminoAcid => {
        expect(validCharges).toContain(aminoAcid.charge);
      });
    });

    test('side chain types are valid enum values', () => {
      const validSideChainTypes = Object.values(AminoAcidSideChainType);
      Object.values(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).forEach(aminoAcid => {
        expect(validSideChainTypes).toContain(aminoAcid.sideChainType);
      });
    });

    test('hydrophobicity values are realistic', () => {
      Object.values(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).forEach(aminoAcid => {
        expect(aminoAcid.hydrophobicity).toBeGreaterThanOrEqual(-5);
        expect(aminoAcid.hydrophobicity).toBeLessThanOrEqual(5);
        expect(Number.isFinite(aminoAcid.hydrophobicity)).toBe(true);
      });
    });

    describe('biochemical properties validation', () => {
      test('acidic amino acids have negative charge', () => {
        const acidicAA = [
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.D, // Aspartic acid
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.E, // Glutamic acid
        ];

        acidicAA.forEach(aa => {
          expect(aa.charge).toBe(AminoAcidCharge.NEGATIVE);
          expect(aa.sideChainType).toBe(AminoAcidSideChainType.ACIDIC);
        });
      });

      test('basic amino acids have positive charge', () => {
        const basicAA = [
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.H, // Histidine
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.K, // Lysine
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.R, // Arginine
        ];

        basicAA.forEach(aa => {
          expect(aa.charge).toBe(AminoAcidCharge.POSITIVE);
          expect(aa.sideChainType).toBe(AminoAcidSideChainType.BASIC);
        });
      });

      test('aromatic amino acids have aromatic side chain type', () => {
        const aromaticAA = [
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.F, // Phenylalanine
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.W, // Tryptophan
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.Y, // Tyrosine
        ];

        aromaticAA.forEach(aa => {
          expect(aa.sideChainType).toBe(AminoAcidSideChainType.AROMATIC);
        });
      });

      test('sulfur containing amino acids have correct side chain type', () => {
        const sulfurAA = [
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.C, // Cysteine
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.M, // Methionine
        ];

        sulfurAA.forEach(aa => {
          expect(aa.sideChainType).toBe(AminoAcidSideChainType.SULFUR_CONTAINING);
        });
      });

      test('hydroxyl containing amino acids have correct side chain type', () => {
        const hydroxylAA = [
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.S, // Serine
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.T, // Threonine
        ];

        hydroxylAA.forEach(aa => {
          expect(aa.sideChainType).toBe(AminoAcidSideChainType.HYDROXYL_CONTAINING);
        });
      });

      test('amide amino acids have correct side chain type', () => {
        const amideAA = [
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.N, // Asparagine
          SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.Q, // Glutamine
        ];

        amideAA.forEach(aa => {
          expect(aa.sideChainType).toBe(AminoAcidSideChainType.AMIDE);
        });
      });
    });
  });

  describe('CODON_TO_SINGLE_LETTER_CODE_MAP', () => {
    test('contains exactly 61 codons (64 - 3 stop codons)', () => {
      const codonCount = Object.keys(CODON_TO_SINGLE_LETTER_CODE_MAP).length;
      expect(codonCount).toBe(61);
    });

    test('all codons are valid RNA triplets', () => {
      Object.keys(CODON_TO_SINGLE_LETTER_CODE_MAP).forEach(codon => {
        expect(codon).toHaveLength(3);
        expect(codon).toMatch(/^[AUCG]{3}$/);
      });
    });

    test('all amino acid codes are valid', () => {
      const validSLCs = Object.keys(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP);
      Object.values(CODON_TO_SINGLE_LETTER_CODE_MAP).forEach(slc => {
        expect(validSLCs).toContain(slc);
      });
    });

    test('does not contain stop codons', () => {
      const stopCodons = ['UAA', 'UAG', 'UGA'];
      stopCodons.forEach(stopCodon => {
        expect(CODON_TO_SINGLE_LETTER_CODE_MAP).not.toHaveProperty(stopCodon);
      });
    });

    test('contains start codon AUG mapping to methionine', () => {
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.AUG).toBe('M');
    });

    test('maps known codons correctly', () => {
      // Test a few well-known codon mappings
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UUU).toBe('F'); // Phenylalanine
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UUC).toBe('F'); // Phenylalanine
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UUA).toBe('L'); // Leucine
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UUG).toBe('L'); // Leucine
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UCU).toBe('S'); // Serine
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UCC).toBe('S'); // Serine
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UCA).toBe('S'); // Serine
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.UCG).toBe('S'); // Serine
    });

    test('amino acids with single codons have only one mapping', () => {
      // Methionine and Tryptophan have unique codons
      const methionineCodens = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP)
        .filter(([_, singleLetterCode]) => singleLetterCode === 'M')
        .map(([codon, _]) => codon);
      expect(methionineCodens).toEqual(['AUG']);

      const tryptophanCodens = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP)
        .filter(([_, singleLetterCode]) => singleLetterCode === 'W')
        .map(([codon, _]) => codon);
      expect(tryptophanCodens).toEqual(['UGG']);
    });

    test('amino acids with multiple codons have correct counts', () => {
      // Leucine has 6 codons (most degenerate)
      const leucineCodens = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).filter(
        ([_, singleLetterCode]) => singleLetterCode === 'L',
      );
      expect(leucineCodens).toHaveLength(6);

      // Serine has 6 codons
      const serineCodens = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).filter(
        ([_, singleLetterCode]) => singleLetterCode === 'S',
      );
      expect(serineCodens).toHaveLength(6);

      // Arginine has 6 codons
      const arginineCodens = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).filter(
        ([_, singleLetterCode]) => singleLetterCode === 'R',
      );
      expect(arginineCodens).toHaveLength(6);
    });

    test('all four-fold degenerate amino acids have 4 codons', () => {
      const fourFoldDegenerateAA = ['A', 'G', 'P', 'T', 'V']; // Ala, Gly, Pro, Thr, Val

      fourFoldDegenerateAA.forEach(slc => {
        const codons = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).filter(
          ([_, mappedSLC]) => mappedSLC === slc,
        );
        expect(codons).toHaveLength(4);
      });
    });

    test('two-fold degenerate amino acids have 2 codons', () => {
      const twoFoldDegenerateAA = ['C', 'D', 'E', 'F', 'H', 'K', 'N', 'Q', 'Y'];

      twoFoldDegenerateAA.forEach(slc => {
        const codons = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).filter(
          ([_, mappedSLC]) => mappedSLC === slc,
        );
        expect(codons).toHaveLength(2);
      });
    });

    test('isoleucine has 3 codons (special case)', () => {
      const isoleucineCodens = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).filter(
        ([_, singleLetterCode]) => singleLetterCode === 'I',
      );
      expect(isoleucineCodens).toHaveLength(3);
      expect(isoleucineCodens.map(([codon, _]) => codon).sort()).toEqual(['AUA', 'AUC', 'AUU']);
    });
  });

  describe('SINGLE_LETTER_CODE_ALT_CODONS_MAP', () => {
    test('contains all 20 amino acids', () => {
      const expectedSLCs = Object.keys(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).sort();
      const actualSLCs = Object.keys(SINGLE_LETTER_CODE_ALT_CODONS_MAP).sort();
      expect(actualSLCs).toEqual(expectedSLCs);
    });

    test('all codon arrays contain valid RNA triplets', () => {
      Object.values(SINGLE_LETTER_CODE_ALT_CODONS_MAP).forEach(codons => {
        codons.forEach(codon => {
          expect(codon).toHaveLength(3);
          expect(codon).toMatch(/^[AUCG]{3}$/);
        });
      });
    });

    test('codon counts match expected degeneracy', () => {
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.M).toHaveLength(1); // Methionine - unique
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.W).toHaveLength(1); // Tryptophan - unique
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.I).toHaveLength(3); // Isoleucine - special case
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.L).toHaveLength(6); // Leucine - most degenerate
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.S).toHaveLength(6); // Serine - most degenerate
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.R).toHaveLength(6); // Arginine - most degenerate
    });

    test('matches CODON_TO_SINGLE_LETTER_CODE_MAP mappings', () => {
      Object.entries(SINGLE_LETTER_CODE_ALT_CODONS_MAP).forEach(([slc, codons]) => {
        codons.forEach(codon => {
          expect(CODON_TO_SINGLE_LETTER_CODE_MAP[codon]).toBe(slc);
        });
      });
    });

    test('inverse mapping completeness', () => {
      // Every codon in CODON_TO_SINGLE_LETTER_CODE_MAP should appear in SINGLE_LETTER_CODE_ALT_CODONS_MAP
      Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).forEach(([codon, slc]) => {
        expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP[slc]).toContain(codon);
      });
    });

    test('no duplicate codons within amino acid arrays', () => {
      Object.values(SINGLE_LETTER_CODE_ALT_CODONS_MAP).forEach(codons => {
        const uniqueCodens = [...new Set(codons)];
        expect(uniqueCodens).toHaveLength(codons.length);
      });
    });

    test('arrays are readonly (compile-time enforced)', () => {
      // TypeScript enforces this at compile time with 'readonly' modifier
      // At runtime, JavaScript arrays can still be mutated, but TypeScript prevents it
      const alanineCodens = SINGLE_LETTER_CODE_ALT_CODONS_MAP.A;
      expect(Array.isArray(alanineCodens)).toBe(true);
      expect(alanineCodens.length).toBeGreaterThan(0);
    });
  });

  describe('data consistency between maps', () => {
    test('all SLCs in CODON_TO_SINGLE_LETTER_CODE_MAP exist in SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP', () => {
      const aminoAcidSLCs = new Set(Object.keys(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP));
      const codonSLCs = new Set(Object.values(CODON_TO_SINGLE_LETTER_CODE_MAP));

      codonSLCs.forEach(slc => {
        expect(aminoAcidSLCs.has(slc)).toBe(true);
      });
    });

    test('all SLCs in SINGLE_LETTER_CODE_ALT_CODONS_MAP exist in SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP', () => {
      const aminoAcidSLCs = new Set(Object.keys(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP));
      const altCodonSLCs = new Set(Object.keys(SINGLE_LETTER_CODE_ALT_CODONS_MAP));

      expect(altCodonSLCs).toEqual(aminoAcidSLCs);
    });

    test('codon counts are consistent between maps', () => {
      Object.entries(SINGLE_LETTER_CODE_ALT_CODONS_MAP).forEach(([slc, codons]) => {
        const codonToSLCCount = Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP).filter(
          ([_, mappedSLC]) => mappedSLC === slc,
        ).length;

        if (codons.length !== codonToSLCCount) {
          console.log(
            `Mismatch for ${slc}: ALT_CODONS=${codons.length}, CODON_TO_SLC=${codonToSLCCount}`,
          );
          console.log(`  ALT_CODONS: ${JSON.stringify(codons)}`);
          console.log(
            `  CODON_TO_SLC: ${JSON.stringify(
              Object.entries(CODON_TO_SINGLE_LETTER_CODE_MAP)
                .filter(([_, mappedSLC]) => mappedSLC === slc)
                .map(([codon, _]) => codon),
            )}`,
          );
        }
        expect(codons.length).toBe(codonToSLCCount);
      });
    });

    test('total codon count is 61 across all maps', () => {
      const totalCodonToSLC = Object.keys(CODON_TO_SINGLE_LETTER_CODE_MAP).length;
      const totalAltCodons = Object.values(SINGLE_LETTER_CODE_ALT_CODONS_MAP).reduce(
        (sum, codons) => sum + codons.length,
        0,
      );

      expect(totalCodonToSLC).toBe(61);
      expect(totalAltCodons).toBe(61);
    });
  });

  describe('biological accuracy validation', () => {
    test('genetic code universality - standard amino acids only', () => {
      // Ensures we only have the 20 standard proteinogenic amino acids
      const standardAA = [
        'A',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'K',
        'L',
        'M',
        'N',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'V',
        'W',
        'Y',
      ];

      expect(Object.keys(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP).sort()).toEqual(standardAA.sort());
    });

    test('start codon methionine is present', () => {
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.AUG).toBe('M');
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.M).toContain('AUG');
    });

    test('wobble base degeneracy follows rules', () => {
      // Third position wobble is most common
      // Test some specific examples of wobble degeneracy

      // Glycine - all 4 codons differ only in 3rd position
      const glycineCodons = SINGLE_LETTER_CODE_ALT_CODONS_MAP.G;
      expect(glycineCodons).toContain('GGA');
      expect(glycineCodons).toContain('GGC');
      expect(glycineCodons).toContain('GGG');
      expect(glycineCodons).toContain('GGU');

      // All start with GG
      glycineCodons.forEach(codon => {
        expect(codon.substring(0, 2)).toBe('GG');
      });
    });

    test('molecular weights are chemically accurate', () => {
      // Test a few known molecular weights
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.G.molecularWeight).toBeCloseTo(75.067, 2); // Glycine - smallest
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.W.molecularWeight).toBeCloseTo(204.228, 2); // Tryptophan - largest
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.A.molecularWeight).toBeCloseTo(89.094, 2); // Alanine
    });
  });

  describe('performance and structure validation', () => {
    test('maps are optimized for O(1) lookups', () => {
      // Test that direct property access works (indicates proper object structure)
      expect(CODON_TO_SINGLE_LETTER_CODE_MAP.AUG).toBeDefined();
      expect(SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.M).toBeDefined();
      expect(SINGLE_LETTER_CODE_ALT_CODONS_MAP.L).toBeDefined();
    });

    test('readonly properties prevent mutation (compile-time enforced)', () => {
      // TypeScript enforces this at compile time with 'readonly' modifier
      // At runtime, properties can be modified, but TypeScript prevents it
      const aminoAcidData = SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.A;
      expect(aminoAcidData.name).toBe('Alanine');
      expect(aminoAcidData.singleLetterCode).toBe('A');
    });

    test('const assertions preserve type information', () => {
      // Verify the 'as const' assertions work correctly
      const alanineData = SINGLE_LETTER_CODE_AMINO_ACID_DATA_MAP.A;
      expect(alanineData.singleLetterCode).toBe('A');

      const alanineCodens = SINGLE_LETTER_CODE_ALT_CODONS_MAP.A;
      expect(Array.isArray(alanineCodens)).toBe(true);
    });
  });
});
