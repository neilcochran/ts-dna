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
import { convertToRNA } from '../../src/utils/nucleic-acids';
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
});
