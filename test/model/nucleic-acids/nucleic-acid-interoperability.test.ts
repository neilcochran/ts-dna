/**
 * Tests for nucleic acid interoperability - constructing any nucleic acid from any other
 */

import { DNA } from '../../../src/model/nucleic-acids/DNA';
import { RNA } from '../../../src/model/nucleic-acids/RNA';
import { isSuccess } from '../../../src/types/validation-result';

describe('Nucleic Acid Interoperability', () => {
  const testDNASequence = 'ATCGATCG';
  const testRNASequence = 'AUCGAUCG';

  describe('DNA Constructor Interoperability', () => {
    test('DNA from string', () => {
      const dna = new DNA(testDNASequence);
      expect(dna.getSequence()).toBe(testDNASequence);
    });

    test('DNA from RNA (U→T conversion)', () => {
      const rna = new RNA(testRNASequence);
      const dna = new DNA(rna);
      expect(dna.getSequence()).toBe(testDNASequence); // U converted to T
    });

    test('DNA from DNA (copy)', () => {
      const originalDNA = new DNA(testDNASequence);
      const copiedDNA = new DNA(originalDNA);
      expect(copiedDNA.getSequence()).toBe(testDNASequence);
      expect(copiedDNA).not.toBe(originalDNA); // Different instances
    });

    test('DNA.create from string', () => {
      const result = DNA.create(testDNASequence);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(testDNASequence);
      }
    });

    test('DNA.create from RNA', () => {
      const rna = new RNA(testRNASequence);
      const result = DNA.create(rna);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(testDNASequence);
      }
    });

    test('DNA.create from DNA', () => {
      const originalDNA = new DNA(testDNASequence);
      const result = DNA.create(originalDNA);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(testDNASequence);
      }
    });
  });

  describe('RNA Constructor Interoperability', () => {
    test('RNA from string', () => {
      const rna = new RNA(testRNASequence);
      expect(rna.getSequence()).toBe(testRNASequence);
    });

    test('RNA from DNA (T→U conversion)', () => {
      const dna = new DNA(testDNASequence);
      const rna = new RNA(dna);
      expect(rna.getSequence()).toBe(testRNASequence); // T converted to U
    });

    test('RNA from RNA (copy)', () => {
      const originalRNA = new RNA(testRNASequence);
      const copiedRNA = new RNA(originalRNA);
      expect(copiedRNA.getSequence()).toBe(testRNASequence);
      expect(copiedRNA).not.toBe(originalRNA); // Different instances
    });

    test('RNA.create from string', () => {
      const result = RNA.create(testRNASequence);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(testRNASequence);
      }
    });

    test('RNA.create from DNA', () => {
      const dna = new DNA(testDNASequence);
      const result = RNA.create(dna);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(testRNASequence);
      }
    });

    test('RNA.create from RNA', () => {
      const originalRNA = new RNA(testRNASequence);
      const result = RNA.create(originalRNA);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(testRNASequence);
      }
    });
  });

  describe('Bidirectional Conversion Consistency', () => {
    test('DNA → RNA → DNA round trip', () => {
      const originalDNA = new DNA(testDNASequence);
      const rna = new RNA(originalDNA);
      const roundTripDNA = new DNA(rna);

      expect(roundTripDNA.getSequence()).toBe(originalDNA.getSequence());
    });

    test('RNA → DNA → RNA round trip', () => {
      const originalRNA = new RNA(testRNASequence);
      const dna = new DNA(originalRNA);
      const roundTripRNA = new RNA(dna);

      expect(roundTripRNA.getSequence()).toBe(originalRNA.getSequence());
    });

    test('Multiple conversions maintain sequence integrity', () => {
      const original = 'ATCGATCGATCG';

      // Chain of conversions
      const dna1 = new DNA(original);
      const rna1 = new RNA(dna1);
      const dna2 = new DNA(rna1);
      const rna2 = new RNA(dna2);
      const dna3 = new DNA(rna2);

      expect(dna3.getSequence()).toBe(original);
      expect(rna2.getSequence()).toBe(original.replaceAll('T', 'U'));
    });
  });

  describe('Complex Sequence Handling', () => {
    test('handles long sequences correctly', () => {
      const longDNASequence = 'ATCG'.repeat(100); // 400bp
      const longRNASequence = 'AUCG'.repeat(100); // 400bp

      const dnaFromRNA = new DNA(new RNA(longRNASequence));
      const rnaFromDNA = new RNA(new DNA(longDNASequence));

      expect(dnaFromRNA.getSequence()).toBe(longDNASequence);
      expect(rnaFromDNA.getSequence()).toBe(longRNASequence);
    });

    test('handles all nucleotide combinations', () => {
      const dnaWithAllBases = 'ATCGATCGATCGATCG';
      const rnaWithAllBases = 'AUCGAUCGAUCGAUCG';

      const rnaConverted = new RNA(new DNA(dnaWithAllBases));
      const dnaConverted = new DNA(new RNA(rnaWithAllBases));

      expect(rnaConverted.getSequence()).toBe(rnaWithAllBases);
      expect(dnaConverted.getSequence()).toBe(dnaWithAllBases);
    });

    test('maintains case normalization', () => {
      const lowercaseDNA = 'atcgatcg';
      const lowercaseRNA = 'aucgaucg';

      const dna = new DNA(lowercaseDNA);
      const rnaFromDNA = new RNA(dna);
      const rna = new RNA(lowercaseRNA);
      const dnaFromRNA = new DNA(rna);

      expect(rnaFromDNA.getSequence()).toBe(testRNASequence.toUpperCase());
      expect(dnaFromRNA.getSequence()).toBe(testDNASequence.toUpperCase());
    });
  });

  describe('Error Handling with Invalid Sequences', () => {
    test('invalid DNA sequence throws when creating RNA', () => {
      expect(() => new DNA('ATCGX')).toThrow();
    });

    test('invalid RNA sequence throws when creating DNA', () => {
      expect(() => new RNA('AUCGX')).toThrow();
    });

    test('DNA with T converted to RNA with U', () => {
      // This should work - T in DNA becomes U in RNA
      const dnaWithT = new DNA('ATCG');
      const rnaFromDNA = new RNA(dnaWithT);
      expect(rnaFromDNA.getSequence()).toBe('AUCG');
    });

    test('RNA with U converted to DNA with T', () => {
      // This should work - U in RNA becomes T in DNA
      const rnaWithU = new RNA('AUCG');
      const dnaFromRNA = new DNA(rnaWithU);
      expect(dnaFromRNA.getSequence()).toBe('ATCG');
    });
  });

  describe('Type Safety and Polymorphism', () => {
    test('maintains correct nucleic acid types after conversion', () => {
      const dna = new DNA(testDNASequence);
      const rna = new RNA(testRNASequence);

      const dnaFromRNA = new DNA(rna);
      const rnaFromDNA = new RNA(dna);

      expect(dnaFromRNA.nucleicAcidType).toBe(dna.nucleicAcidType);
      expect(rnaFromDNA.nucleicAcidType).toBe(rna.nucleicAcidType);
    });

    test('polymorphic function accepts any nucleic acid for conversion', () => {
      function convertToRNA(source: string | any): RNA {
        return new RNA(source);
      }

      const dna = new DNA(testDNASequence);
      const existingRNA = new RNA(testRNASequence);

      const rnaFromString = convertToRNA(testRNASequence);
      const rnaFromDNA = convertToRNA(dna);
      const rnaFromRNA = convertToRNA(existingRNA);

      expect(rnaFromString.getSequence()).toBe(testRNASequence);
      expect(rnaFromDNA.getSequence()).toBe(testRNASequence);
      expect(rnaFromRNA.getSequence()).toBe(testRNASequence);
    });
  });
});
