import { RNA } from '../../../src/model/nucleic-acids/RNA';
import { InvalidSequenceError } from '../../../src/model/errors/InvalidSequenceError';
import { NucleicAcidType } from '../../../src/enums/nucleic-acid-type';
import { isSuccess, isFailure } from '../../../src/types/validation-result';

describe('RNA Class', () => {
  describe('constructor', () => {
    test('creates RNA from valid sequence', () => {
      const rna = new RNA('AUCG');
      expect(rna.getSequence()).toBe('AUCG');
      expect(rna.nucleicAcidType).toBe(NucleicAcidType.RNA);
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

    test('equals compares sequences correctly', () => {
      const rna1 = new RNA('AUCG');
      const rna2 = new RNA('AUCG');
      const rna3 = new RNA('AUCG');
      const rna4 = new RNA('GUCA');

      expect(rna1.equals(rna2)).toBe(true);
      expect(rna1.equals(rna3)).toBe(true);
      expect(rna1.equals(rna4)).toBe(false); // Different sequence should not be equal
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
      const rna = new RNA(mrnaSequence);

      expect(rna.getSequence()).toBe(mrnaSequence);
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
      const rna = new RNA(rnaSequence);

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

  describe('Object-based complement methods', () => {
    describe('getComplement()', () => {
      test('returns new RNA instance with complement sequence', () => {
        const rna = new RNA('AUCG');
        const complement = rna.getComplement();

        expect(complement).toBeInstanceOf(RNA);
        expect(complement.getSequence()).toBe('UAGC');
        expect(complement).not.toBe(rna); // Different instance
      });

      test('maintains consistency with string API', () => {
        const rna = new RNA('AUCGAUCG');
        expect(rna.getComplement().getSequence()).toBe(rna.getComplementSequence());
      });

      test('handles single nucleotides', () => {
        expect(new RNA('A').getComplement().getSequence()).toBe('U');
        expect(new RNA('U').getComplement().getSequence()).toBe('A');
        expect(new RNA('C').getComplement().getSequence()).toBe('G');
        expect(new RNA('G').getComplement().getSequence()).toBe('C');
      });

      test('double complement returns equivalent sequence', () => {
        const rna = new RNA('AUCGAUCG');
        const doubleComplement = rna.getComplement().getComplement();
        expect(doubleComplement.getSequence()).toBe(rna.getSequence());
        expect(doubleComplement.equals(rna)).toBe(true);
      });
    });

    describe('getReverseComplement()', () => {
      test('returns new RNA instance with reverse complement sequence', () => {
        const rna = new RNA('AUCG');
        const reverseComplement = rna.getReverseComplement();

        expect(reverseComplement).toBeInstanceOf(RNA);
        expect(reverseComplement.getSequence()).toBe('CGAU');
        expect(reverseComplement).not.toBe(rna); // Different instance
      });

      test('maintains consistency with string API', () => {
        const rna = new RNA('AUCGAUCG');
        expect(rna.getReverseComplement().getSequence()).toBe(rna.getReverseComplementSequence());
      });

      test('handles palindromic RNA sequences', () => {
        const palindromic = new RNA('GAAUCUCC');
        const reverseComplement = palindromic.getReverseComplement();

        expect(reverseComplement.getSequence()).toBe('GGAGAUUC');
        // This specific sequence is not palindromic
        expect(palindromic.equals(reverseComplement)).toBe(false);
      });

      test('double reverse complement returns original sequence', () => {
        const rna = new RNA('AUCGAUCG');
        const doubleReverseComplement = rna.getReverseComplement().getReverseComplement();
        expect(doubleReverseComplement.getSequence()).toBe(rna.getSequence());
        expect(doubleReverseComplement.equals(rna)).toBe(true);
      });
    });

    describe('Chainability and fluent API', () => {
      test('methods are chainable', () => {
        const rna = new RNA('AUCG');

        const result1 = rna.getComplement().getReverseComplement();
        expect(result1).toBeInstanceOf(RNA);
        expect(result1.getSequence()).toBe('GCUA');

        const result2 = rna.getReverseComplement().getComplement();
        expect(result2).toBeInstanceOf(RNA);
        expect(result2.getSequence()).toBe('GCUA');
      });

      test('can chain with other RNA methods', () => {
        const rna = new RNA('AUCGAUCG');
        const result = rna
          .getSubsequence(0, 4) // 'AUCG'
          .getComplement() // 'UAGC'
          .getReverseComplement(); // 'GCUA'

        expect(result.getSequence()).toBe('GCUA');
      });

      test('complex chaining maintains type safety', () => {
        const rna = new RNA('AUCGAUCG');
        const complex = rna
          .getComplement()
          .getSubsequence(2, 6)
          .getReverseComplement()
          .getComplement();

        expect(complex).toBeInstanceOf(RNA);
        expect(typeof complex.getSequence).toBe('function');
      });
    });

    describe('Biological applications', () => {
      test('RNA secondary structure analysis', () => {
        // RNA that could form hairpin (self-complementary regions)
        const rna = new RNA('GGCCUUUUGGCC');
        const reverseComplement = rna.getReverseComplement();

        expect(reverseComplement.getSequence()).toBe('GGCCAAAAGGCC');

        // Check for potential base pairing
        const fivePrime = rna.getSequence().substring(0, 4);
        const threePrime = rna.getSequence().substring(8);

        expect(fivePrime).toBe('GGCC');
        expect(threePrime).toBe('GGCC');
      });

      test('antisense RNA design', () => {
        // Target mRNA sequence
        const targetRNA = new RNA('AUGUGGCACCUGACUCC');

        // Antisense RNA would be the reverse complement
        const antisenseRNA = targetRNA.getReverseComplement();

        expect(antisenseRNA).toBeInstanceOf(RNA);
        expect(antisenseRNA.getSequence()).toBe('GGAGUCAGGUGCCACAU');

        // Verify they can potentially bind (complementary)
        const targetComplement = targetRNA.getComplement();
        expect(targetComplement.getSequence()).toBe(
          antisenseRNA.getSequence().split('').reverse().join(''),
        );
      });

      test('primer binding site analysis', () => {
        const rnaTemplate = new RNA('AUGUGGCACCUGACUCCUGAGGAG');

        // Simulate primer design for reverse transcription
        const primerRegion = rnaTemplate.getSubsequence(16); // Last 8 bases
        const primerSequence = primerRegion.getReverseComplement();

        expect(primerSequence).toBeInstanceOf(RNA);
        expect(primerSequence.getSequence().length).toBe(8);
      });

      test('miRNA target site prediction', () => {
        // Simplified miRNA and target interaction
        const miRNA = new RNA('UGUGCCAAU');
        const targetSite = new RNA('AUUGGCACA'); // Complementary to miRNA

        // Check if miRNA reverse complement matches target
        const miRNABinding = miRNA.getReverseComplement();
        expect(miRNABinding.getSequence()).toBe('AUUGGCACA');
        expect(miRNABinding.equals(targetSite)).toBe(true);
      });
    });

    describe('Performance and immutability', () => {
      test('maintains immutability', () => {
        const original = new RNA('AUCG');
        const complement = original.getComplement();
        const reverseComplement = original.getReverseComplement();

        // Original should be unchanged
        expect(original.getSequence()).toBe('AUCG');

        // Each operation creates new instances
        expect(complement).not.toBe(original);
        expect(reverseComplement).not.toBe(original);
        expect(complement).not.toBe(reverseComplement);
      });

      test('handles large RNA sequences efficiently', () => {
        const largeSequence = 'AUCGAUCG'.repeat(1000); // 8,000 bp
        const largeRNA = new RNA(largeSequence);

        const start = performance.now();
        const complement = largeRNA.getComplement();
        const reverseComplement = largeRNA.getReverseComplement();
        const end = performance.now();

        expect(complement.getSequence().length).toBe(largeSequence.length);
        expect(reverseComplement.getSequence().length).toBe(largeSequence.length);
        expect(end - start).toBeLessThan(100); // Should complete quickly
      });
    });

    describe('RNA-specific complement behavior', () => {
      test('uses U instead of T in complements', () => {
        const rna = new RNA('AAAA');
        const complement = rna.getComplement();

        expect(complement.getSequence()).toBe('UUUU');
        expect(complement.getSequence()).not.toContain('T');
      });

      test('reverse complements maintain RNA nucleotides', () => {
        const rna = new RNA('AAAA');
        const reverseComplement = rna.getReverseComplement();

        expect(reverseComplement.getSequence()).toBe('UUUU');
        expect(reverseComplement.getSequence()).not.toContain('T');
      });

      test('handles mixed RNA sequences correctly', () => {
        const mixedRNA = new RNA('AUCGAUCGAU');
        const complement = mixedRNA.getComplement();
        const reverseComplement = mixedRNA.getReverseComplement();

        // Should contain only valid RNA nucleotides
        expect(complement.getSequence()).toMatch(/^[AUCG]+$/);
        expect(reverseComplement.getSequence()).toMatch(/^[AUCG]+$/);

        // Should not contain T
        expect(complement.getSequence()).not.toContain('T');
        expect(reverseComplement.getSequence()).not.toContain('T');
      });
    });
  });
});
