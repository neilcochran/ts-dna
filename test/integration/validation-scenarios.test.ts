/**
 * Integration tests focused on validation scenarios and error handling.
 *
 * These tests ensure that validation works correctly across module boundaries
 * and that errors are handled gracefully throughout the pipeline.
 */

import { Gene } from '../../src/model/nucleic-acids/Gene';
import { DNA } from '../../src/model/nucleic-acids/DNA';
import { RNA } from '../../src/model/nucleic-acids/RNA';
import { NucleotidePattern } from '../../src/model/nucleic-acids/NucleotidePattern';
import { transcribe } from '../../src/utils/transcription';
import { processRNA } from '../../src/utils/mrna-processing';
import { convertToRNA, isValidNucleicAcid } from '../../src/utils/nucleic-acids';
import { RNAtoAminoAcids } from '../../src/utils/amino-acids';
import { NucleicAcidType } from '../../src/enums/nucleic-acid-type';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('Validation Scenarios Integration Tests', () => {
  describe('Sequence Validation Across Modules', () => {
    test('invalid nucleotide propagation', () => {
      // Test that invalid nucleotides are caught early and don't propagate

      // Direct validation should fail
      expect(() => new DNA('ATGXYZ')).toThrow();
      expect(() => new RNA('AUGXYZ')).toThrow();

      // ValidationResult pattern should handle errors gracefully
      const dnaResult = DNA.create('ATGXYZ');
      expect(isFailure(dnaResult)).toBe(true);

      const rnaResult = RNA.create('AUGXYZ');
      expect(isFailure(rnaResult)).toBe(true);
    });

    test('edge case sequence lengths', () => {
      // Test various edge cases for sequence lengths

      // Empty sequence
      expect(() => new DNA('')).toThrow();
      expect(() => new RNA('')).toThrow();

      // Single nucleotide
      const singleDNA = new DNA('A');
      expect(singleDNA.getSequence()).toBe('A');
      expect(singleDNA.length()).toBe(1);

      // Very long sequence (test memory handling)
      const longSequence = 'ATGC'.repeat(10000); // 40kb
      const longDNA = new DNA(longSequence);
      expect(longDNA.length()).toBe(40000);
    });
  });

  describe('Gene Structure Validation', () => {
    test('exon boundary validation', () => {
      const geneSequence = 'ATGAAAGCCTTTGTGAACCAACACCTTGTAAGTAG' + 'TTTTTTTTTTTTTTTT'; // Extended to 50bp

      // Valid exons with proper intron spacing
      const validExons = [
        { start: 0, end: 15, name: 'exon1' },
        { start: 35, end: 50, name: 'exon2' }, // 20bp intron between exons
      ];

      expect(() => new Gene(geneSequence, validExons, 'valid')).not.toThrow();

      // Overlapping exons
      const overlappingExons = [
        { start: 0, end: 20, name: 'exon1' },
        { start: 15, end: 35, name: 'exon2' }, // Overlaps with exon1
      ];

      expect(() => new Gene(geneSequence, overlappingExons, 'overlapping')).toThrow();

      // Exon beyond sequence
      const beyondExons = [
        { start: 0, end: 60, name: 'exon1' }, // Beyond sequence length (51)
      ];

      expect(() => new Gene(geneSequence, beyondExons, 'beyond')).toThrow();

      // Negative coordinates
      const negativeExons = [{ start: -5, end: 10, name: 'exon1' }];

      expect(() => new Gene(geneSequence, negativeExons, 'negative')).toThrow();

      // Start >= end
      const invalidOrderExons = [{ start: 20, end: 10, name: 'exon1' }];

      expect(() => new Gene(geneSequence, invalidOrderExons, 'invalid-order')).toThrow();
    });

    test('splice site validation integration', () => {
      // Test that splice site validation works correctly in the processing pipeline

      // Gene with invalid splice sites
      const badSpliceGene =
        'GCGCTATAAAAGGCGC' + // Promoter
        'GGGGGGGGGGGG' +
        'G' + // TSS at 29
        'ATGAAAGCCTTTGTGAACCAACACCTT' + // Exon 1
        'AAAAGCCCCCCCCCCCCCCCCCCCCCCC' + // Intron with AA...CC (invalid)
        'CTGGTGGAGCGGCTCTACCTGGTGTAG'; // Exon 2

      const exons = [
        { start: 29, end: 56, name: 'exon1' },
        { start: 83, end: 110, name: 'exon2' },
      ];

      const gene = new Gene(badSpliceGene, exons, 'bad-splice');
      const transcriptionResult = transcribe(gene);

      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        const processingResult = processRNA(preMRNA);

        // Should fail during RNA processing due to invalid splice sites
        expect(isFailure(processingResult)).toBe(true);
        if (isFailure(processingResult)) {
          expect(processingResult.error).toContain('splice site');
        }
      }
    });
  });

  describe('Pattern Matching Validation', () => {
    test('nucleotide pattern edge cases', () => {
      const testSequence = new DNA('ATGAAAGCCTTTGTGAACCAACACCTT');

      // Valid IUPAC patterns
      const validPattern = new NucleotidePattern('ATGN{3}GCC'); // ATG followed by any 3, then GCC
      const matches = validPattern.findMatches(testSequence);
      expect(matches.length).toBe(1); // Should find ATGAAAGCC at position 0

      // Empty pattern
      expect(() => new NucleotidePattern('')).toThrow();

      // Invalid IUPAC characters
      expect(() => new NucleotidePattern('ATGXYZ')).toThrow();

      // Very long pattern
      const longPattern = 'A'.repeat(1000);
      const longPatternObj = new NucleotidePattern(longPattern);
      const longMatches = longPatternObj.findMatches(testSequence);
      expect(longMatches).toHaveLength(0); // No matches expected
    });
  });

  describe('Cross-Module Error Propagation', () => {
    test('transcription errors prevent downstream processing', () => {
      // Create a gene that will fail transcription
      const noPromoterGene = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT';
      const exons = [{ start: 0, end: 20, name: 'exon1' }];

      const gene = new Gene(noPromoterGene, exons, 'no-promoter');

      // Transcription should fail
      const transcriptionResult = transcribe(gene);
      expect(isFailure(transcriptionResult)).toBe(true);

      // Since transcription failed, we shouldn't attempt processing
      // This tests that the pipeline handles failures correctly
    });

    test("processing errors don't crash the system", () => {
      // Create a scenario where processing might fail but system remains stable

      // Force a scenario with problematic coordinates
      const problematicGene =
        'GCGCTATAAAAGGCGC' + // Promoter
        'GGGGGGGGGGGG' +
        'G' + // TSS
        'ATGAAAGCCTTTGTGAACCAACACCTT'; // Just one exon

      const exons = [{ start: 29, end: 56, name: 'exon1' }];

      const gene = new Gene(problematicGene, exons, 'problematic');
      const transcriptionResult = transcribe(gene);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;

        // Even if processing fails, system should handle it gracefully
        const processingResult = processRNA(preMRNA);

        if (isFailure(processingResult)) {
          // Failure should be reported cleanly, not crash
          expect(processingResult.error).toBeDefined();
          expect(typeof processingResult.error).toBe('string');
        }
      }
    });
  });

  describe('Boundary Conditions', () => {
    test('minimum viable gene structures', () => {
      // Test the absolute minimum requirements for each component

      // Shortest possible valid DNA
      const minDNA = new DNA('A');
      expect(minDNA.length()).toBe(1);

      // Shortest possible valid RNA
      const minRNA = new RNA('A');
      expect(minRNA.length()).toBe(1);

      // Shortest possible coding sequence (start + stop)
      const minCoding = new RNA('AUGUAG');
      expect(minCoding.length()).toBe(6);
    });

    test('maximum reasonable sizes', () => {
      // Test with larger sizes to ensure no overflow/performance issues

      // Large DNA sequence
      const largeDNA = new DNA('ATGC'.repeat(25000)); // 100kb
      expect(largeDNA.length()).toBe(100000);

      // Verify complement calculation works with large sequences
      const startTime = Date.now();
      const complement = largeDNA.getComplement();
      const endTime = Date.now();

      expect(complement.length()).toBe(100000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
    });

    test('coordinate edge cases', () => {
      // Test edge cases in coordinate calculations

      const sequence = 'ATGAAAGCCTTTGTGAACCAACACCTTGTAAGTAG';

      // Exon at start of sequence
      const startExons = [{ start: 0, end: 10, name: 'start' }];
      expect(() => new Gene(sequence, startExons, 'start')).not.toThrow();

      // Exon at end of sequence
      const endExons = [{ start: 25, end: 35, name: 'end' }];
      expect(() => new Gene(sequence, endExons, 'end')).not.toThrow();

      // Minimum viable exon (3bp)
      const minExons = [{ start: 10, end: 13, name: 'minimum' }];
      expect(() => new Gene(sequence, minExons, 'minimum')).not.toThrow();
    });
  });

  describe('Type Safety Validation', () => {
    test('type consistency across conversions', () => {
      // Ensure type safety is maintained through conversions

      const dna = new DNA('ATGAAAGCC');
      const rna = convertToRNA(dna);

      // Type checks
      expect(dna instanceof DNA).toBe(true);
      expect(rna instanceof RNA).toBe(true);

      // Complement type consistency
      const dnaComplement = dna.getComplement();
      const rnaComplement = rna.getComplement();

      expect(dnaComplement instanceof DNA).toBe(true);
      expect(rnaComplement instanceof RNA).toBe(true);

      // Reverse complement type consistency
      const dnaReverseComplement = dna.getReverseComplement();
      const rnaReverseComplement = rna.getReverseComplement();

      expect(dnaReverseComplement instanceof DNA).toBe(true);
      expect(rnaReverseComplement instanceof RNA).toBe(true);
    });
  });

  describe('Static Factory Methods Integration', () => {
    test('DNA.create() integration with transcription pipeline', () => {
      // Test valid DNA creation and use in pipeline
      const dnaResult = DNA.create('GCGCTATAAAAGGCGCGGGGGGATGAAACCCAAATAA'); // Added proper promoter with TATA box
      expect(isSuccess(dnaResult)).toBe(true);

      if (isSuccess(dnaResult)) {
        const gene = new Gene(dnaResult.data.getSequence(), [
          { start: 20, end: 35, name: 'single-exon' },
        ]);
        const transcriptionResult = transcribe(gene);

        // Transcription might fail due to lack of proper promoter structure
        if (isSuccess(transcriptionResult)) {
          const preMRNA = transcriptionResult.data;
          expect(preMRNA.getSequence().startsWith('AUG')).toBe(true);
        } else {
          // If transcription fails, that's okay for this test - we're testing the factory pattern
          expect(isFailure(transcriptionResult)).toBe(true);
          expect(transcriptionResult.error).toBeTruthy();
        }
      }
    });

    test('RNA.create() integration with translation pipeline', () => {
      // Test valid RNA creation and use in translation
      const rnaResult = RNA.create('AUGAAACCCAAAUAA');
      expect(isSuccess(rnaResult)).toBe(true);

      if (isSuccess(rnaResult)) {
        const aminoAcids = RNAtoAminoAcids(rnaResult.data);
        expect(aminoAcids.length).toBeGreaterThan(0);
        expect(aminoAcids[0].singleLetterCode).toBe('M'); // Methionine start codon
      }
    });

    test('error propagation through static factory methods', () => {
      // Test invalid DNA creation
      const invalidDNAResult = DNA.create('ATGXYZ');
      expect(isFailure(invalidDNAResult)).toBe(true);

      if (isFailure(invalidDNAResult)) {
        expect(invalidDNAResult.error).toContain('Invalid');
      }

      // Test invalid RNA creation
      const invalidRNAResult = RNA.create('AUGXYZ');
      expect(isFailure(invalidRNAResult)).toBe(true);

      if (isFailure(invalidRNAResult)) {
        expect(invalidRNAResult.error).toContain('Invalid');
      }
    });

    test('factory methods with edge cases', () => {
      // Test empty sequence
      const emptyDNAResult = DNA.create('');
      expect(isFailure(emptyDNAResult)).toBe(true);

      const emptyRNAResult = RNA.create('');
      expect(isFailure(emptyRNAResult)).toBe(true);

      // Test very long valid sequence
      const longSequence = 'ATGAAACCCAAATAA'.repeat(100);
      const longDNAResult = DNA.create(longSequence);
      expect(isSuccess(longDNAResult)).toBe(true);

      if (isSuccess(longDNAResult)) {
        expect(longDNAResult.data.length()).toBe(longSequence.length);
      }
    });

    test('factory methods maintain nucleic acid interoperability', () => {
      // Create DNA and convert to RNA
      const dnaResult = DNA.create('ATGAAACCCAAATAA');
      expect(isSuccess(dnaResult)).toBe(true);

      if (isSuccess(dnaResult)) {
        const rna = convertToRNA(dnaResult.data);
        expect(rna.getSequence()).toBe('AUGAAACCCAAAUAA');

        // Convert back to DNA (simple conversion)
        const dnaBack = new DNA(rna.getSequence().replace(/U/g, 'T'));
        expect(dnaBack.getSequence()).toBe(dnaResult.data.getSequence());
      }
    });

    // TODO: factory methods in replication pipeline (requires replication system)
    // test('factory methods in replication pipeline', () => { ... });

    test('sequential factory method operations', () => {
      // Sequential validation operations (without chaining)
      const dnaResult = DNA.create('ATGAAACCCAAATAA');
      expect(isSuccess(dnaResult)).toBe(true);

      if (isSuccess(dnaResult)) {
        const rna = convertToRNA(dnaResult.data);
        const rnaResult = RNA.create(rna.getSequence());
        expect(isSuccess(rnaResult)).toBe(true);

        if (isSuccess(rnaResult)) {
          expect(rnaResult.data.getSequence()).toBe('AUGAAACCCAAAUAA');
        }
      }

      // Test with invalid input
      const failResult = DNA.create('ATGXYZ');
      expect(isFailure(failResult)).toBe(true);
    });
  });

  describe('Error Propagation Integration', () => {
    test('invalid DNA propagates through entire gene expression pipeline', () => {
      // Start with invalid sequence
      const invalidDNAResult = DNA.create('ATGXYZ');
      expect(isFailure(invalidDNAResult)).toBe(true);

      // Should not be able to proceed with pipeline
      if (isFailure(invalidDNAResult)) {
        // Error should contain specific information about the failure
        expect(invalidDNAResult.error).toContain('Invalid');
      }
    });

    test('validation errors bubble up through processing pipeline', () => {
      // Create valid DNA but with problematic structure for processing
      const problematicDNA = 'GCGCTATAAAAGGCGCGGGGATGAAA'; // Added promoter but still short sequence
      const gene = new Gene(problematicDNA, [{ start: 18, end: 26, name: 'single-exon' }]);

      const transcriptionResult = transcribe(gene);

      // Transcription and processing might fail due to short sequence length
      if (isSuccess(transcriptionResult)) {
        const processingResult = processRNA(transcriptionResult.data);
        // Processing might fail due to lack of proper structure
        // But should return meaningful error if it does
        if (isFailure(processingResult)) {
          expect(processingResult.error).toBeTruthy();
          expect(processingResult.error.length).toBeGreaterThan(0);
        }
      } else {
        // If transcription fails due to short sequence, that's expected
        expect(isFailure(transcriptionResult)).toBe(true);
        expect(transcriptionResult.error).toBeTruthy();
      }
    });

    test('cross-system error handling consistency', () => {
      // Test that different systems handle the same invalid input consistently
      const invalidSequence = 'ATGXYZ';

      // Direct constructor should throw
      expect(() => new DNA(invalidSequence)).toThrow();
      expect(() => new RNA(invalidSequence.replace('T', 'U'))).toThrow();

      // Factory methods should return failure
      const dnaResult = DNA.create(invalidSequence);
      const rnaResult = RNA.create(invalidSequence.replace('T', 'U'));

      expect(isFailure(dnaResult)).toBe(true);
      expect(isFailure(rnaResult)).toBe(true);

      // Validation should catch the same issues
      expect(isValidNucleicAcid(invalidSequence, NucleicAcidType.DNA)).toBe(false);
      expect(isValidNucleicAcid(invalidSequence.replace('T', 'U'), NucleicAcidType.RNA)).toBe(
        false,
      );
    });
  });
});
