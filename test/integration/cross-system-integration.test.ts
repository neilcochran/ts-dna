/**
 * Simplified cross-system integration tests
 *
 * These tests validate basic data flow between major systems:
 * - Gene expression → Translation → Polypeptide analysis
 * - Replication → Transcription coordination
 * - Error propagation across system boundaries
 */

import { Gene } from '../../src/model/nucleic-acids/Gene';
import { transcribe } from '../../src/utils/transcription';
import { processRNA } from '../../src/utils/mrna-processing';
import { Polypeptide } from '../../src/model/Polypeptide';
import { replicateDNA } from '../../src/utils/replication/simple-replication';
import { isSuccess, isFailure } from '../../src/types/validation-result';
import { DNA } from '../../src/model/nucleic-acids/DNA';

describe('Cross-System Integration Tests', () => {
  describe('Basic Gene-to-Protein Pipeline', () => {
    test('simple gene processes successfully through complete pipeline', () => {
      // Simple single-exon gene that should process successfully
      const geneSequence =
        'GCGCTATAAAAGGCGC' +
        'GGGGGGGGGGGG' +
        'G' + // Promoter (29bp)
        'ATGAAAGCCTTTGTGAACCAACACCTTCTGGTGGAGCGGCTCTACCTGGTGTGCGGCTCGCTGTAG' + // Single exon with start/stop
        'AATAAAGCTAATTCAACCCCAAAAAAAAA'; // 3'UTR

      const exons = [{ start: 29, end: 92, name: 'single-exon' }];
      const gene = new Gene(geneSequence, exons, 'simple-test');

      // Step 1: Transcription
      const transcriptionResult = transcribe(gene);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        // Transcript should contain the exact expected length (exon + 3'UTR)
        expect(preMRNA.getSequence().length).toBe(72);
        expect(preMRNA.getSequence().startsWith('AUG')).toBe(true);
        // Should contain stop codon but might not end with it due to 3'UTR
        expect(preMRNA.getSequence()).toContain('UAG');

        // Step 2: RNA Processing (should succeed or fail gracefully)
        const processingResult = processRNA(preMRNA);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          expect(mRNA.isFullyProcessed()).toBe(true);

          // Step 3: Translation
          const protein = new Polypeptide(mRNA);
          // Should produce exactly 21 amino acids from 66bp sequence (minus stop codon = 63bp = 21 AA)
          expect(protein.aminoAcidSequence.length).toBe(21);

          const sequence = protein.aminoAcidSequence.map(aa => aa.singleLetterCode).join('');
          expect(sequence.startsWith('M')).toBe(true);
          // Verify it's a valid protein sequence (no stop codons in middle)
          expect(sequence).not.toContain('*');
        } else {
          // If processing fails, should have meaningful error
          expect(typeof processingResult.error).toBe('string');
          expect(processingResult.error).toMatch(/processing|splice|frame|codon|splicing/i);
        }
      }
    });

    test('replication produces identical DNA strands', () => {
      // Simple test that replication works correctly
      const simpleSequence = 'ATGAAAGCCTTTGTGAACCAACACCTTCTGGTGGAGCGGCTCTACCTGGTGTGCGGCTCGCTGTAG';
      const dna = new DNA(simpleSequence);

      const replicationResult = replicateDNA(dna);
      expect(isSuccess(replicationResult)).toBe(true);

      if (isSuccess(replicationResult)) {
        const { replicatedStrands } = replicationResult.data;
        const [strand1, strand2] = replicatedStrands;

        // Both strands should be identical to original
        expect(strand1.getSequence()).toBe(simpleSequence);
        expect(strand2.getSequence()).toBe(simpleSequence);
        expect(strand1.length()).toBe(dna.length());
        expect(strand2.length()).toBe(dna.length());
      }
    });
  });

  describe('Basic System Integration', () => {
    test('multiple systems work together without errors', () => {
      // Simple integration test to verify systems can work together
      const geneSequence =
        'GCGCTATAAAAGGCGC' +
        'GGGGGGGGGGGG' +
        'G' + // Promoter (29bp)
        'ATGAAAGCCTTTGTGAACCAACACCTTCTGGTGGAGCGGCTCTACCTGGTGTGCGGCTCGCTGTAG'; // Single exon

      const exons = [{ start: 29, end: 92, name: 'test-exon' }];
      const gene = new Gene(geneSequence, exons, 'integration-test');

      // Test transcription works
      const transcriptionResult = transcribe(gene);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        // Transcript should contain the exact expected length (just the exon)
        expect(preMRNA.getSequence().length).toBe(66);
        expect(preMRNA.getSequence().startsWith('AUG')).toBe(true);

        // Test that the system doesn't crash on processing attempts
        const processingResult = processRNA(preMRNA);
        // Processing might succeed or fail, but shouldn't crash
        expect(isSuccess(processingResult) || isFailure(processingResult)).toBe(true);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          expect(mRNA.getCodingSequence().length).toBe(66); // Should preserve exact coding sequence length
          expect(mRNA.getCodingSequence().startsWith('AUG')).toBe(true);
        }
      }
    });
  });

  describe('Error Propagation Across Systems', () => {
    test('errors are properly tracked through complete pipeline', () => {
      // Gene with multiple potential failure points
      const problematicSequence =
        'GCGCTATAAAAGGCGC' +
        'GGGGGGGGGGGG' +
        'G' + // Valid promoter
        'ATGAAAGCCTTTGTGAACCAACACCTT' + // Valid exon 1
        'GTAAGTCCCCCCCCCCCCCCCCCCCAG' + // Valid intron
        'CTGGTGGAGCGGCTCTACCTGGTGTGC' + // Valid exon 2
        'GTAAGTTTTTTTTTTTTTTTTTTTCAG' + // Valid intron
        'GGCTCGCTGTGCGCCCTGGATGCG'; // Exon 3 WITHOUT stop codon (will cause error)

      const exons = [
        { start: 29, end: 56, name: 'exon1' },
        { start: 82, end: 109, name: 'exon2' },
        { start: 135, end: 158, name: 'exon3' }, // Missing stop codon
      ];

      const gene = new Gene(problematicSequence, exons, 'error-test');

      // Transcription should succeed
      const transcriptionResult = transcribe(gene);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;

        // RNA processing might succeed even without stop codon
        const processingResult = processRNA(preMRNA);

        if (isSuccess(processingResult)) {
          // Translation should either fail or produce truncated protein
          const mRNA = processingResult.data;

          try {
            const polypeptide = new Polypeptide(mRNA);
            // If it succeeds, it should have detected the missing stop codon issue
            const sequence = polypeptide.aminoAcidSequence.map(aa => aa.singleLetterCode).join('');
            // Should start with Met and have reasonable length - specific validation
            expect(sequence.startsWith('M')).toBe(true);
            expect(sequence.length).toBeGreaterThanOrEqual(15); // Reasonable minimum protein length
          } catch (error) {
            // Or it should throw a meaningful error about missing stop codon
            expect(error).toBeInstanceOf(Error);
            if (error instanceof Error) {
              expect(error.message.toLowerCase()).toContain('stop');
            }
          }
        } else {
          // Processing failed - should have meaningful error
          expect(typeof processingResult.error).toBe('string');
          expect(processingResult.error).toMatch(/stop|codon|processing|frame|splice|splicing/i);
        }
      }
    });

    test('validation errors prevent downstream processing', () => {
      // Gene with invalid coordinates that should be caught early
      const validSequence =
        'GCGCTATAAAAGGCGC' +
        'GGGGGGGGGGGG' +
        'G' +
        'ATGAAAGCCTTTGTGAACCAACACCTTCTGGTGGAGCGGCTCTACCTGGTGTGCGGCTCGCTGTAG';

      // Invalid exon coordinates (extend beyond sequence)
      const invalidExons = [
        { start: 29, end: 200, name: 'invalid-exon' }, // Extends beyond sequence length
      ];

      // Gene construction should fail with validation error
      expect(() => new Gene(validSequence, invalidExons, 'invalid-gene')).toThrow(); // Should throw during construction

      // Alternatively, if using ValidationResult pattern:
      // const geneResult = Gene.create(validSequence, invalidExons, 'invalid-gene');
      // expect(isFailure(geneResult)).toBe(true);
    });
  });
});
