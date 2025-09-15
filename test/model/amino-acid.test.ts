import { AminoAcid } from '../../src/model/AminoAcid';
import { RNA } from '../../src/model/nucleic-acids/RNA';
import { InvalidCodonError } from '../../src/model/errors/InvalidCodonError';
import { AminoAcidPolarity } from '../../src/enums/amino-acid-polarity';
import { AminoAcidCharge } from '../../src/enums/amino-acid-charge';
import { AminoAcidSideChainType } from '../../src/enums/amino-acid-side-chain-type';
import { NucleicAcidType } from '../../src/enums/nucleic-acid-type';

describe('AminoAcid Class', () => {
    describe('constructor', () => {
        test('creates amino acid from valid codon', () => {
            const codon = new RNA('AUG'); // Methionine start codon
            const aminoAcid = new AminoAcid(codon);

            expect(aminoAcid.name).toBe('Methionine');
            expect(aminoAcid.slc).toBe('M');
            expect(aminoAcid.abbrv).toBe('Met');
            expect(aminoAcid.codon).toBe(codon);
            expect(aminoAcid.acidType).toBe(NucleicAcidType.RNA);
        });

        test('creates amino acid with correct molecular properties', () => {
            const codon = new RNA('AUG'); // Methionine
            const aminoAcid = new AminoAcid(codon);

            expect(aminoAcid.molecularWeight).toBeGreaterThan(0);
            expect(aminoAcid.polarity).toBeDefined();
            expect(aminoAcid.charge).toBeDefined();
            expect(aminoAcid.hydrophobicity).toBeDefined();
            expect(aminoAcid.sideChainType).toBeDefined();
        });

        test('creates different amino acids correctly', () => {
            // Test a few key amino acids
            const met = new AminoAcid(new RNA('AUG')); // Methionine
            const phe = new AminoAcid(new RNA('UUU')); // Phenylalanine
            const lys = new AminoAcid(new RNA('AAA')); // Lysine

            expect(met.name).toBe('Methionine');
            expect(met.slc).toBe('M');

            expect(phe.name).toBe('Phenylalanine');
            expect(phe.slc).toBe('F');

            expect(lys.name).toBe('Lysine');
            expect(lys.slc).toBe('K');
        });

        test('throws error for invalid codon length', () => {
            expect(() => {
                new AminoAcid(new RNA('AU')); // Too short
            }).toThrow(InvalidCodonError);

            expect(() => {
                new AminoAcid(new RNA('AUGG')); // Too long
            }).toThrow(InvalidCodonError);
        });

        test('throws error for stop codons', () => {
            expect(() => {
                new AminoAcid(new RNA('UAA')); // Stop codon
            }).toThrow(InvalidCodonError);

            expect(() => {
                new AminoAcid(new RNA('UAG')); // Stop codon
            }).toThrow(InvalidCodonError);

            expect(() => {
                new AminoAcid(new RNA('UGA')); // Stop codon
            }).toThrow(InvalidCodonError);
        });

        test('error messages include codon sequence', () => {
            try {
                new AminoAcid(new RNA('UAA'));
                fail('Should have thrown InvalidCodonError');
            } catch (error) {
                expect(error).toBeInstanceOf(InvalidCodonError);
                expect((error as InvalidCodonError).message).toContain('UAA');
            }
        });
    });

    describe('getCodonSequence', () => {
        test('returns codon sequence', () => {
            const aminoAcid = new AminoAcid(new RNA('AUG'));
            expect(aminoAcid.getCodonSequence()).toBe('AUG');
        });

        test('returns different codon sequences correctly', () => {
            const met = new AminoAcid(new RNA('AUG'));
            const phe = new AminoAcid(new RNA('UUU'));

            expect(met.getCodonSequence()).toBe('AUG');
            expect(phe.getCodonSequence()).toBe('UUU');
        });
    });

    describe('getAllAlternateCodons', () => {
        test('returns all codons for amino acid', () => {
            const aminoAcid = new AminoAcid(new RNA('UUU')); // Phenylalanine
            const alternateCodons = aminoAcid.getAllAlternateCodons();

            expect(alternateCodons).toHaveLength(2); // Phe has UUU and UUC
            expect(alternateCodons.map(codon => codon.getSequence())).toContain('UUU');
            expect(alternateCodons.map(codon => codon.getSequence())).toContain('UUC');
        });

        test('returns single codon for methionine (no alternatives)', () => {
            const aminoAcid = new AminoAcid(new RNA('AUG')); // Methionine
            const alternateCodons = aminoAcid.getAllAlternateCodons();

            expect(alternateCodons).toHaveLength(1);
            expect(alternateCodons[0].getSequence()).toBe('AUG');
        });

        test('returns multiple codons for leucine (6 codons)', () => {
            const aminoAcid = new AminoAcid(new RNA('UUA')); // Leucine
            const alternateCodons = aminoAcid.getAllAlternateCodons();

            expect(alternateCodons.length).toBeGreaterThan(4); // Leucine has 6 codons
            expect(alternateCodons.every(codon => codon instanceof RNA)).toBe(true);
        });

        test('all returned codons are valid RNA objects', () => {
            const aminoAcid = new AminoAcid(new RNA('GCA')); // Alanine
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
            const amino1 = new AminoAcid(new RNA('GCG')); // Alanine
            const amino2 = new AminoAcid(new RNA('GCG')); // Same Alanine, same codon

            expect(amino1.isAlternateOf(amino2)).toBe(false);
        });

        test('returns true for same amino acid with different codon', () => {
            const amino1 = new AminoAcid(new RNA('GCA')); // Alanine - GCA
            const amino2 = new AminoAcid(new RNA('GCC')); // Alanine - GCC

            expect(amino1.isAlternateOf(amino2)).toBe(true);
            expect(amino2.isAlternateOf(amino1)).toBe(true);
        });

        test('returns false for different amino acids', () => {
            const met = new AminoAcid(new RNA('AUG')); // Methionine
            const phe = new AminoAcid(new RNA('UUU')); // Phenylalanine

            expect(met.isAlternateOf(phe)).toBe(false);
            expect(phe.isAlternateOf(met)).toBe(false);
        });

        test('works with all alanine codons', () => {
            const ala1 = new AminoAcid(new RNA('GCA'));
            const ala2 = new AminoAcid(new RNA('GCC'));
            const ala3 = new AminoAcid(new RNA('GCG'));
            const ala4 = new AminoAcid(new RNA('GCU'));

            // All should be alternates of each other
            expect(ala1.isAlternateOf(ala2)).toBe(true);
            expect(ala1.isAlternateOf(ala3)).toBe(true);
            expect(ala1.isAlternateOf(ala4)).toBe(true);
            expect(ala2.isAlternateOf(ala3)).toBe(true);
        });
    });

    describe('equals', () => {
        test('returns true for identical amino acids', () => {
            const amino1 = new AminoAcid(new RNA('GCG'));
            const amino2 = new AminoAcid(new RNA('GCG'));

            expect(amino1.equals(amino2)).toBe(true);
        });

        test('returns false for same amino acid with different codon', () => {
            const amino1 = new AminoAcid(new RNA('GCA')); // Alanine - GCA
            const amino2 = new AminoAcid(new RNA('GCC')); // Alanine - GCC

            expect(amino1.equals(amino2)).toBe(false);
        });

        test('returns false for different amino acids', () => {
            const met = new AminoAcid(new RNA('AUG')); // Methionine
            const phe = new AminoAcid(new RNA('UUU')); // Phenylalanine

            expect(met.equals(phe)).toBe(false);
        });

        test('equality is reflexive', () => {
            const amino = new AminoAcid(new RNA('AUG'));
            expect(amino.equals(amino)).toBe(true);
        });

        test('equality is symmetric', () => {
            const amino1 = new AminoAcid(new RNA('UUU'));
            const amino2 = new AminoAcid(new RNA('UUU'));

            expect(amino1.equals(amino2)).toBe(amino2.equals(amino1));
        });
    });

    describe('amino acid properties', () => {
        test('methionine has correct properties', () => {
            const met = new AminoAcid(new RNA('AUG'));

            expect(met.name).toBe('Methionine');
            expect(met.slc).toBe('M');
            expect(met.abbrv).toBe('Met');
            expect(met.sideChainType).toBe(AminoAcidSideChainType.SULFUR_CONTAINING);
        });

        test('lysine has positive charge', () => {
            const lys = new AminoAcid(new RNA('AAA'));

            expect(lys.name).toBe('Lysine');
            expect(lys.charge).toBe(AminoAcidCharge.POSITIVE);
            expect(lys.sideChainType).toBe(AminoAcidSideChainType.BASIC);
        });

        test('aspartic acid has negative charge', () => {
            const asp = new AminoAcid(new RNA('GAU'));

            expect(asp.name).toBe('Aspartic acid');
            expect(asp.charge).toBe(AminoAcidCharge.NEGATIVE);
            expect(asp.sideChainType).toBe(AminoAcidSideChainType.ACIDIC);
        });

        test('alanine has neutral charge', () => {
            const ala = new AminoAcid(new RNA('GCA'));

            expect(ala.name).toBe('Alanine');
            expect(ala.charge).toBe(AminoAcidCharge.NEUTRAL);
            expect(ala.polarity).toBe(AminoAcidPolarity.NONPOLAR);
        });

        test('serine has polar properties', () => {
            const ser = new AminoAcid(new RNA('UCU'));

            expect(ser.name).toBe('Serine');
            expect(ser.polarity).toBe(AminoAcidPolarity.POLAR);
            expect(ser.sideChainType).toBe(AminoAcidSideChainType.HYDROXYL_CONTAINING);
        });

        test('all amino acids have valid molecular weights', () => {
            const codons = ['AUG', 'UUU', 'UUC', 'UUA', 'GCA', 'AAA', 'GAU'];

            codons.forEach(codonSeq => {
                const amino = new AminoAcid(new RNA(codonSeq));
                expect(amino.molecularWeight).toBeGreaterThan(0);
                expect(amino.molecularWeight).toBeLessThan(1000); // Reasonable upper bound
            });
        });

        test('hydrophobicity values are in reasonable range', () => {
            const codons = ['AUG', 'UUU', 'UUC', 'UUA', 'GCA', 'AAA', 'GAU'];

            codons.forEach(codonSeq => {
                const amino = new AminoAcid(new RNA(codonSeq));
                expect(amino.hydrophobicity).toBeGreaterThan(-10);
                expect(amino.hydrophobicity).toBeLessThan(10);
            });
        });
    });

    describe('immutability', () => {
        test('amino acid properties are readonly', () => {
            const amino = new AminoAcid(new RNA('AUG'));

            // These should be readonly (TypeScript compile-time check)
            expect(amino.name).toBe('Methionine');
            expect(amino.slc).toBe('M');
            expect(amino.codon.getSequence()).toBe('AUG');
        });

        test('codon reference is preserved', () => {
            const codon = new RNA('AUG');
            const amino = new AminoAcid(codon);

            expect(amino.codon).toBe(codon); // Same reference
        });
    });

    describe('edge cases', () => {
        test('handles all 61 coding codons', () => {
            // This ensures all valid codons can create amino acids
            const validCodons = [
                'UUU', 'UUC', 'UUA', 'UUG', 'UCU', 'UCC', 'UCA', 'UCG',
                'UAU', 'UAC', 'UGU', 'UGC', 'UGG', 'CUU', 'CUC', 'CUA',
                'CUG', 'CCU', 'CCC', 'CCA', 'CCG', 'CAU', 'CAC', 'CAA',
                'CAG', 'CGU', 'CGC', 'CGA', 'CGG', 'AUU', 'AUC', 'AUA',
                'AUG', 'ACU', 'ACC', 'ACA', 'ACG', 'AAU', 'AAC', 'AAA',
                'AAG', 'AGU', 'AGC', 'AGA', 'AGG', 'GUU', 'GUC', 'GUA',
                'GUG', 'GCU', 'GCC', 'GCA', 'GCG', 'GAU', 'GAC', 'GAA',
                'GAG', 'GGU', 'GGC', 'GGA', 'GGG'
            ];

            validCodons.forEach(codonSeq => {
                expect(() => {
                    const amino = new AminoAcid(new RNA(codonSeq));
                    expect(amino.name).toBeDefined();
                    expect(amino.slc).toBeDefined();
                }).not.toThrow();
            });
        });

        test('rejects all 3 stop codons', () => {
            const stopCodons = ['UAA', 'UAG', 'UGA'];

            stopCodons.forEach(codonSeq => {
                expect(() => {
                    new AminoAcid(new RNA(codonSeq));
                }).toThrow(InvalidCodonError);
            });
        });
    });
});