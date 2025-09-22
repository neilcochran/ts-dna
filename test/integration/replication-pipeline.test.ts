/**
 * Integration tests for DNA replication pipeline
 *
 * These tests validate the complete replication workflow and catch integration issues
 * between different replication components and real biological constraints.
 */

import { DNA } from '../../src/model/nucleic-acids/DNA';
import { replicateDNA } from '../../src/utils/replication/simple-replication';
import { E_COLI, HUMAN } from '../../src/types/replication-types';
import { isSuccess } from '../../src/types/validation-result';

describe('DNA Replication Pipeline Integration', () => {
  describe('Complete Replication Process', () => {
    test('simple bacterial plasmid replication', () => {
      // Test with realistic bacterial plasmid sequence
      const plasmidSequence = 'ATGAAAGCCTTTGTGAACCAACACCTTCTGGTGGAGCGGCTCTACCTGGTGTGCGGCTCGCTGTAG';
      const plasmid = new DNA(plasmidSequence);

      const replicationResult = replicateDNA(plasmid);
      expect(isSuccess(replicationResult)).toBe(true);

      if (isSuccess(replicationResult)) {
        const { replicatedStrands, steps: _steps, eventCount } = replicationResult.data;
        const [strand1, strand2] = replicatedStrands;

        // Verify both strands are identical to original
        expect(strand1.getSequence()).toBe(plasmidSequence);
        expect(strand2.getSequence()).toBe(plasmidSequence);

        // Verify replication actually occurred (realistic event counts)
        expect(_steps).toBeGreaterThanOrEqual(10); // Meaningful minimum steps for replication
        expect(eventCount).toBeGreaterThanOrEqual(5); // Meaningful minimum events

        // Verify biological realism - replication is a complex process with many steps
        expect(_steps).toBeLessThan(plasmidSequence.length * 10); // Allow for detailed simulation complexity
      }
    });

    test('complete replication with fragment coordination', () => {
      // Test sequence that requires Okazaki fragment coordination
      const testSequence = 'ATG' + 'GCTA'.repeat(100) + 'TAG'; // 406bp sequence
      const dna = new DNA(testSequence);

      const replicationResult = replicateDNA(dna, { organism: E_COLI });
      expect(isSuccess(replicationResult)).toBe(true);

      if (isSuccess(replicationResult)) {
        const { replicatedStrands, steps: _steps, eventCount } = replicationResult.data;
        const [strand1, strand2] = replicatedStrands;

        // Both strands should be complete and identical
        expect(strand1.getSequence()).toBe(testSequence);
        expect(strand2.getSequence()).toBe(testSequence);
        expect(strand1.length()).toBe(dna.length());

        // Should have required coordination for fragment processing
        expect(eventCount).toBeGreaterThan(10); // Multiple synthesis and coordination events
      }
    });
  });

  describe('Organism-Specific Replication Differences', () => {
    test('E. coli vs human replication parameters', () => {
      const testSequence = 'ATG' + 'AACCGGTT'.repeat(50) + 'TAG'; // 408bp sequence
      const dna = new DNA(testSequence);

      const ecoliResult = replicateDNA(dna, { organism: E_COLI });
      const humanResult = replicateDNA(dna, { organism: HUMAN });

      expect(isSuccess(ecoliResult)).toBe(true);
      expect(isSuccess(humanResult)).toBe(true);

      if (isSuccess(ecoliResult) && isSuccess(humanResult)) {
        const [ecoliStrand1, ecoliStrand2] = ecoliResult.data.replicatedStrands;
        const [humanStrand1, humanStrand2] = humanResult.data.replicatedStrands;

        // Both should produce identical DNA sequences
        expect(ecoliStrand1.getSequence()).toBe(testSequence);
        expect(humanStrand1.getSequence()).toBe(testSequence);
        expect(ecoliStrand2.getSequence()).toBe(testSequence);
        expect(humanStrand2.getSequence()).toBe(testSequence);

        // Both should complete successfully with different organism parameters
        expect(ecoliResult.data.completionPercentage).toBe(100);
        expect(humanResult.data.completionPercentage).toBe(100);
      }
    });

    test('replication with challenging GC-rich sequences', () => {
      // Test sequences that might cause issues: high GC content
      const highGCSequence = 'ATGCCCGGGCCCGGGCCCGGGCCCGGGCCCGGGCCCGGGCCCGGGCCCGGGCCCGGGCCCGGGTAG';
      const highGCDNA = new DNA(highGCSequence);

      const result = replicateDNA(highGCDNA);
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const [strand1, strand2] = result.data.replicatedStrands;

        // Should still replicate correctly despite challenging sequence
        expect(strand1.getSequence()).toBe(highGCSequence);
        expect(strand2.getSequence()).toBe(highGCSequence);

        // Should complete successfully with realistic metrics
        expect(result.data.completionPercentage).toBe(100);
        expect(result.data.steps).toBeGreaterThanOrEqual(15); // Meaningful minimum for GC-rich sequence
        expect(result.data.eventCount).toBeGreaterThanOrEqual(8); // Meaningful minimum events
      }
    });
  });

  describe('Error Handling in Replication', () => {
    test('handles extremely short sequences', () => {
      const shortDNA = new DNA('ATG'); // Minimal sequence
      const result = replicateDNA(shortDNA);

      // Should either succeed or fail gracefully
      if (isSuccess(result)) {
        const [strand1, strand2] = result.data.replicatedStrands;
        expect(strand1.getSequence()).toBe('ATG');
        expect(strand2.getSequence()).toBe('ATG');
      } else {
        expect(typeof result.error).toBe('string');
        expect(result.error).toMatch(/short|length|invalid|sequence/i);
      }
    });

    test('handles edge case sequences', () => {
      // Test with homopolymer sequence
      const edgeCaseSequence = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'; // All T's
      const edgeDNA = new DNA(edgeCaseSequence);

      const result = replicateDNA(edgeDNA);
      // Should either replicate correctly or fail with meaningful error
      if (isSuccess(result)) {
        const [strand1, strand2] = result.data.replicatedStrands;
        expect(strand1.getSequence()).toBe(edgeCaseSequence);
        expect(strand2.getSequence()).toBe(edgeCaseSequence);
      } else {
        expect(typeof result.error).toBe('string');
        expect(result.error).toMatch(/short|length|invalid|sequence/i);
      }
    });
  });

  describe('Performance and Scale', () => {
    test('handles medium-sized sequences efficiently', () => {
      // Test with ~1kb sequence (realistic gene size)
      const mediumSequence = 'ATG' + 'AACCGGTTAACCGGTT'.repeat(62) + 'TAG'; // 999bp
      const mediumDNA = new DNA(mediumSequence);

      const startTime = Date.now();
      const result = replicateDNA(mediumDNA);
      const endTime = Date.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds

      if (isSuccess(result)) {
        const [strand1, strand2] = result.data.replicatedStrands;
        expect(strand1.getSequence()).toBe(mediumSequence);
        expect(strand2.getSequence()).toBe(mediumSequence);

        // Should have processed significant amount of data
        expect(result.data.basePairsProcessed).toBe(mediumSequence.length);
        expect(result.data.eventCount).toBeGreaterThanOrEqual(20); // Meaningful minimum for 999bp
      }
    });
  });
});
