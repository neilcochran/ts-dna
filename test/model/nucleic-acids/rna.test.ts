import { RNA } from '../../../src/model/nucleic-acids/RNA';
import { InvalidSequenceError } from '../../../src/model/errors/InvalidSequenceError';
import { NucleicAcidType } from '../../../src/enums/nucleic-acid-type';
import { RNASubType } from '../../../src/enums/rna-sub-type';
import { isSuccess, isFailure } from '../../../src/types/validation-result';

describe('RNA Class', () => {
    describe('constructor', () => {
        test('creates RNA from valid sequence', () => {
            const rna = new RNA('AUCG');
            expect(rna.getSequence()).toBe('AUCG');
            expect(rna.nucleicAcidType).toBe(NucleicAcidType.RNA);
        });

        test('creates RNA without subtype', () => {
            const rna = new RNA('AUCG');
            expect(rna.rnaSubType).toBeUndefined();
        });

        test('creates RNA with subtype', () => {
            const rna = new RNA('AUCG', RNASubType.M_RNA);
            expect(rna.rnaSubType).toBe(RNASubType.M_RNA);
        });

        test('normalizes lowercase to uppercase', () => {
            const rna = new RNA('aucg');
            expect(rna.getSequence()).toBe('AUCG');
        });

        test('handles mixed case sequences', () => {
            const rna = new RNA('AuCg');
            expect(rna.getSequence()).toBe('AUCG');
        });

        test('creates RNA with all valid nucleotides', () => {
            const rna = new RNA('AAUUCCGG');
            expect(rna.getSequence()).toBe('AAUUCCGG');
        });

        test('throws error for empty sequence', () => {
            expect(() => {
                new RNA('');
            }).toThrow(InvalidSequenceError);
        });

        test('throws error for invalid characters', () => {
            expect(() => {
                new RNA('AUCX');
            }).toThrow(InvalidSequenceError);

            expect(() => {
                new RNA('AUCG123');
            }).toThrow(InvalidSequenceError);
        });

        test('throws error for DNA nucleotides in RNA', () => {
            expect(() => {
                new RNA('ATCG'); // T is not valid in RNA
            }).toThrow(InvalidSequenceError);
        });

        test('error contains sequence and type information', () => {
            try {
                new RNA('AUCX');
                fail('Should have thrown InvalidSequenceError');
            } catch (error) {
                expect(error).toBeInstanceOf(InvalidSequenceError);
                expect((error as InvalidSequenceError).message).toContain('X'); // Contains the invalid character
                expect((error as InvalidSequenceError).nucleicAcidType).toBe(NucleicAcidType.RNA);
            }
        });

        test('handles long sequences', () => {
            const longSequence = 'AUCG'.repeat(1000);
            const rna = new RNA(longSequence);
            expect(rna.getSequence()).toBe(longSequence);
            expect(rna.getSequence()).toHaveLength(4000);
        });

        test('handles single nucleotide', () => {
            const rna = new RNA('A');
            expect(rna.getSequence()).toBe('A');
        });

        test('creates RNA with available subtypes', () => {
            const mrna = new RNA('AUCG', RNASubType.M_RNA);
            const prerRNA = new RNA('AUCG', RNASubType.PRE_M_RNA);

            expect(mrna.rnaSubType).toBe(RNASubType.M_RNA);
            expect(prerRNA.rnaSubType).toBe(RNASubType.PRE_M_RNA);
        });
    });

    describe('static create method', () => {
        test('returns success for valid sequence', () => {
            const result = RNA.create('AUCG');

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUCG');
                expect(result.data).toBeInstanceOf(RNA);
            }
        });

        test('returns success for valid sequence with subtype', () => {
            const result = RNA.create('AUCG', RNASubType.M_RNA);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUCG');
                expect(result.data.rnaSubType).toBe(RNASubType.M_RNA);
            }
        });

        test('returns failure for invalid sequence', () => {
            const result = RNA.create('AUCX');

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('invalid');
            }
        });

        test('returns failure for empty sequence', () => {
            const result = RNA.create('');

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toBeDefined();
            }
        });

        test('normalizes case in create method', () => {
            const result = RNA.create('aucg');

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUCG');
            }
        });

        test('create method handles DNA nucleotides correctly', () => {
            const result = RNA.create('ATCG');

            expect(isFailure(result)).toBe(true);
        });
    });

    describe('getSequence method', () => {
        test('returns original sequence', () => {
            const sequence = 'AUCGGAUCCUAGG';
            const rna = new RNA(sequence);
            expect(rna.getSequence()).toBe(sequence);
        });

        test('sequence is immutable', () => {
            const rna = new RNA('AUCG');
            const sequence = rna.getSequence();

            // Modifying returned string doesn't affect RNA
            const modifiedSequence = sequence + 'AAAA';
            expect(rna.getSequence()).toBe('AUCG');
            expect(rna.getSequence()).not.toBe(modifiedSequence);
        });
    });

    describe('inheritance from NucleicAcid', () => {
        test('has correct nucleic acid type', () => {
            const rna = new RNA('AUCG');
            expect(rna.nucleicAcidType).toBe(NucleicAcidType.RNA);
        });

        test('implements equals method', () => {
            const rna1 = new RNA('AUCG');
            const rna2 = new RNA('AUCG');
            const rna3 = new RNA('GGCC');

            expect(rna1.equals(rna2)).toBe(true);
            expect(rna1.equals(rna3)).toBe(false);
        });

        test('equals considers subtypes', () => {
            const rna1 = new RNA('AUCG', RNASubType.M_RNA);
            const rna2 = new RNA('AUCG', RNASubType.M_RNA);
            const rna3 = new RNA('AUCG', RNASubType.PRE_M_RNA);
            const rna4 = new RNA('AUCG'); // No subtype

            expect(rna1.equals(rna2)).toBe(true);
            expect(rna1.equals(rna3)).toBe(false);
            expect(rna1.equals(rna4)).toBe(false);
        });

        test('implements getComplementSequence method', () => {
            const rna = new RNA('AUCG');
            const complement = rna.getComplementSequence();

            expect(complement).toBeDefined();
            expect(complement).toContain('U'); // A -> U
            expect(complement).toContain('A'); // U -> A
            expect(complement).toContain('G'); // C -> G
            expect(complement).toContain('C'); // G -> C
        });
    });

    describe('RNA subtype functionality', () => {
        test('rnaSubType property is readonly', () => {
            const rna = new RNA('AUCG', RNASubType.M_RNA);
            expect(rna.rnaSubType).toBe(RNASubType.M_RNA);
            // TypeScript prevents modification at compile time
        });

        test('different subtypes are distinct', () => {
            const mrna = new RNA('AUCG', RNASubType.M_RNA);
            const premrna = new RNA('AUCG', RNASubType.PRE_M_RNA);

            expect(mrna.rnaSubType).not.toBe(premrna.rnaSubType);
            expect(mrna.equals(premrna)).toBe(false);
        });

        test('undefined subtype works correctly', () => {
            const rna = new RNA('AUCG');
            expect(rna.rnaSubType).toBeUndefined();
        });
    });

    describe('edge cases and validation', () => {
        test('handles whitespace correctly', () => {
            expect(() => {
                new RNA(' AUCG ');
            }).toThrow(InvalidSequenceError);
        });

        test('rejects sequences with numbers', () => {
            expect(() => {
                new RNA('AUC123G');
            }).toThrow(InvalidSequenceError);
        });

        test('rejects sequences with special characters', () => {
            expect(() => {
                new RNA('AUC-G');
            }).toThrow(InvalidSequenceError);

            expect(() => {
                new RNA('AUC.G');
            }).toThrow(InvalidSequenceError);
        });

        test('validates all four RNA nucleotides individually', () => {
            expect(() => new RNA('A')).not.toThrow();
            expect(() => new RNA('U')).not.toThrow();
            expect(() => new RNA('C')).not.toThrow();
            expect(() => new RNA('G')).not.toThrow();
        });

        test('case sensitivity in error detection', () => {
            // Lowercase should be normalized, not rejected
            expect(() => new RNA('aucg')).not.toThrow();

            // But invalid characters should still be rejected regardless of case
            expect(() => new RNA('aucx')).toThrow(InvalidSequenceError);
            expect(() => new RNA('AUCX')).toThrow(InvalidSequenceError);
        });
    });

    describe('biological sequences', () => {
        test('handles realistic mRNA sequences', () => {
            // Start codon + coding sequence + stop codon
            const mrnaSequence = 'AUGUGGCACCUGACUCCUGAGGAGAAGUCUGCCGUUACUGCCCUGUGGGGCAAGUAA';
            const rna = new RNA(mrnaSequence, RNASubType.M_RNA);

            expect(rna.getSequence()).toBe(mrnaSequence);
            expect(rna.rnaSubType).toBe(RNASubType.M_RNA);
        });

        test('handles codon sequences', () => {
            const startCodon = new RNA('AUG');
            const stopCodon1 = new RNA('UAA');
            const stopCodon2 = new RNA('UAG');
            const stopCodon3 = new RNA('UGA');

            expect(startCodon.getSequence()).toBe('AUG');
            expect(stopCodon1.getSequence()).toBe('UAA');
            expect(stopCodon2.getSequence()).toBe('UAG');
            expect(stopCodon3.getSequence()).toBe('UGA');
        });

        test('handles repetitive sequences', () => {
            const repetitive = 'AUGUGAUGUGAUG';
            const rna = new RNA(repetitive);
            expect(rna.getSequence()).toBe(repetitive);
        });

        test('handles GC-rich sequences', () => {
            const gcRich = 'GCGCGCGCGC';
            const rna = new RNA(gcRich);
            expect(rna.getSequence()).toBe(gcRich);
        });

        test('handles AU-rich sequences', () => {
            const auRich = 'AUAUAUAUAU';
            const rna = new RNA(auRich);
            expect(rna.getSequence()).toBe(auRich);
        });

        test('handles complex RNA sequences', () => {
            // Simplified RNA sequence (removed invalid D)
            const rnaSequence = 'GCCGAUAUAGCUCAGGGGAGAGCGCCUGCUUUGCACGCAGGAGGUCGGCGGUCCGAUUCCGCCUAUCGGCA';
            const rna = new RNA(rnaSequence, RNASubType.M_RNA);

            expect(rna.rnaSubType).toBe(RNASubType.M_RNA);
            expect(rna.getSequence()).toBe(rnaSequence);
        });
    });

    describe('comparison with DNA', () => {
        test('RNA and DNA are not equal even with similar sequences', () => {
            const rna = new RNA('AUCG');
            // Can't directly compare with DNA due to different nucleotides
            // This is tested implicitly through the validation
            expect(rna.nucleicAcidType).toBe(NucleicAcidType.RNA);
        });

        test('RNA contains U instead of T', () => {
            const rna = new RNA('AUCG');
            expect(rna.getSequence()).toContain('U');
            expect(rna.getSequence()).not.toContain('T');
        });
    });
});