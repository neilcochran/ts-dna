import { DNA } from '../../../src/model/nucleic-acids/DNA.js';
import {
  replicateDNA,
  replicateDNASimple,
  SimpleReplicationOptions,
} from '../../../src/utils/replication/simple-replication.js';
import { E_COLI, HUMAN } from '../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('Simple DNA Replication', () => {
  describe('replicateDNA', () => {
    test('replicates simple DNA sequence with default options', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNA(dna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { replicatedStrands, steps, eventCount, completionPercentage, basePairsProcessed } =
          result.data;

        expect(replicatedStrands).toHaveLength(2);
        expect(replicatedStrands[0]).toBeInstanceOf(DNA);
        expect(replicatedStrands[1]).toBeInstanceOf(DNA);
        expect(replicatedStrands[0].getSequence()).toBe('ATGCGATCGTAGCTACGT');
        expect(replicatedStrands[1].getSequence()).toBe('ATGCGATCGTAGCTACGT');

        expect(steps).toBeGreaterThan(0);
        expect(eventCount).toBeGreaterThan(0);
        expect(completionPercentage).toBe(100);
        expect(basePairsProcessed).toBe(dna.getSequence().length);
      }
    });

    test('replicates with E. coli organism profile', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGTGCTAGCTA');
      const result = replicateDNA(dna, { organism: E_COLI });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.replicatedStrands).toHaveLength(2);
        expect(result.data.completionPercentage).toBe(100);
      }
    });

    test('replicates with human organism profile', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGTGCTAGCTA');
      const result = replicateDNA(dna, { organism: HUMAN });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.replicatedStrands).toHaveLength(2);
        expect(result.data.completionPercentage).toBe(100);
      }
    });

    test('replicates with custom start position', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGTGCTAGCTA');
      const result = replicateDNA(dna, { startPosition: 5 });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.replicatedStrands).toHaveLength(2);
        expect(result.data.basePairsProcessed).toBe(dna.getSequence().length);
      }
    });

    test('replicates with detailed logging enabled', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNA(dna, { enableDetailedLogging: true });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.eventCount).toBeGreaterThan(0);
      }
    });

    test('replicates with custom max steps', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT'); // 18bp
      const result = replicateDNA(dna, { maxSteps: 1000 });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        // For 18bp: stepSize = max(1, floor(18/100)) = 1, so exactly 18 steps expected
        expect(result.data.steps).toBe(18);
        expect(result.data.steps).toBeLessThanOrEqual(1000); // Within maxSteps limit

        // Events should be tracked separately and may be higher than steps
        expect(result.data.eventCount).toBeGreaterThanOrEqual(result.data.steps);
      }
    });

    test('reported steps accurately reflect actual steps taken', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGTAAGGCCTTTAAA'); // 30bp

      // Test with a limit that should allow completion
      const resultSuccess = replicateDNA(dna, { maxSteps: 100 });
      expect(isSuccess(resultSuccess)).toBe(true);
      if (isSuccess(resultSuccess)) {
        // For 30bp: stepSize = max(1, floor(30/100)) = 1, so exactly 30 steps expected
        expect(resultSuccess.data.steps).toBe(30);
        expect(resultSuccess.data.steps).toBeLessThanOrEqual(100); // Within maxSteps limit

        // Events should be separate from steps and typically higher
        expect(resultSuccess.data.eventCount).toBeGreaterThanOrEqual(resultSuccess.data.steps);
      }

      // Test with a very small limit that should be enforced
      const resultFail = replicateDNA(dna, { maxSteps: 5 });
      expect(isSuccess(resultFail)).toBe(false);
      if (!isSuccess(resultFail)) {
        expect(resultFail.error).toContain('did not complete within 5 steps');
      }
    });

    test('handles longer sequences correctly', () => {
      const longSequence = 'ATGCGATCGTAGCTACGT'.repeat(50); // 900 bp
      const dna = new DNA(longSequence);
      const result = replicateDNA(dna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.replicatedStrands[0].getSequence()).toBe(longSequence);
        expect(result.data.replicatedStrands[1].getSequence()).toBe(longSequence);
        expect(result.data.basePairsProcessed).toBe(longSequence.length);

        // For 900bp: stepSize = max(1, floor(900/100)) = 9, steps = ceil(900/9) = 100
        expect(result.data.steps).toBe(100);
      }
    });

    test('fails with invalid start position (negative)', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNA(dna, { startPosition: -1 });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid start position: -1');
      }
    });

    test('fails with invalid start position (too large)', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNA(dna, { startPosition: 100 });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid start position: 100');
      }
    });

    test('fails with invalid max steps (zero)', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNA(dna, { maxSteps: 0 });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid maxSteps: 0');
      }
    });

    test('fails with invalid max steps (negative)', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNA(dna, { maxSteps: -5 });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid maxSteps: -5');
      }
    });

    test('handles empty options object', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNA(dna, {});

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.replicatedStrands).toHaveLength(2);
      }
    });

    test('applies all default values correctly when no options provided', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result1 = replicateDNA(dna);
      const result2 = replicateDNA(dna, {
        organism: E_COLI,
        startPosition: 0,
        maxSteps: 10000,
        enableDetailedLogging: false,
      });

      expect(isSuccess(result1)).toBe(true);
      expect(isSuccess(result2)).toBe(true);

      if (isSuccess(result1) && isSuccess(result2)) {
        // Results should be similar (though not identical due to potential randomness)
        expect(result1.data.replicatedStrands[0].getSequence()).toBe(
          result2.data.replicatedStrands[0].getSequence(),
        );
      }
    });
  });

  describe('replicateDNASimple', () => {
    test('replicates DNA with default organism', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNASimple(dna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const [strand1, strand2] = result.data;
        expect(strand1).toBeInstanceOf(DNA);
        expect(strand2).toBeInstanceOf(DNA);
        expect(strand1.getSequence()).toBe('ATGCGATCGTAGCTACGT');
        expect(strand2.getSequence()).toBe('ATGCGATCGTAGCTACGT');
      }
    });

    test('replicates DNA with E. coli organism', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNASimple(dna, E_COLI);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].getSequence()).toBe(dna.getSequence());
        expect(result.data[1].getSequence()).toBe(dna.getSequence());
      }
    });

    test('replicates DNA with human organism', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const result = replicateDNASimple(dna, HUMAN);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].getSequence()).toBe(dna.getSequence());
        expect(result.data[1].getSequence()).toBe(dna.getSequence());
      }
    });

    test('handles longer sequences', () => {
      const longSequence = 'ATGCGATCGTAGCTACGT'.repeat(25); // 450 bp
      const dna = new DNA(longSequence);
      const result = replicateDNASimple(dna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data[0].getSequence()).toBe(longSequence);
        expect(result.data[1].getSequence()).toBe(longSequence);
      }
    });

    test('propagates errors from underlying replication', () => {
      // Create a DNA with invalid content by mocking
      const dna = new DNA('ATGCGATCGTAGCTACGT');

      // Mock getSequence to return something that would cause an error
      const originalGetSequence = dna.getSequence;
      dna.getSequence = jest.fn().mockReturnValue('');

      const result = replicateDNASimple(dna);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBeTruthy();
      }

      // Restore original method
      dna.getSequence = originalGetSequence;
    });
  });

  describe('SimpleReplicationOptions interface', () => {
    test('accepts all valid option combinations', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');

      const options: SimpleReplicationOptions[] = [
        {},
        { organism: E_COLI },
        { organism: HUMAN },
        { startPosition: 0 },
        { startPosition: 5 },
        { maxSteps: 100 },
        { maxSteps: 5000 },
        { enableDetailedLogging: true },
        { enableDetailedLogging: false },
        {
          organism: HUMAN,
          startPosition: 2,
          maxSteps: 500,
          enableDetailedLogging: true,
        },
      ];

      for (const option of options) {
        const result = replicateDNA(dna, option);
        expect(isSuccess(result)).toBe(true);
      }
    });
  });

  describe('error handling and edge cases', () => {
    test('handles very short sequences', () => {
      const dna = new DNA('AT');
      const result = replicateDNA(dna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.replicatedStrands[0].getSequence()).toBe('AT');
      }
    });

    test('handles single nucleotide sequence', () => {
      const dna = new DNA('A');
      const result = replicateDNA(dna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.replicatedStrands[0].getSequence()).toBe('A');
      }
    });

    test('handles boundary start position (last valid position)', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGT');
      const lastPosition = dna.getSequence().length - 1;
      const result = replicateDNA(dna, { startPosition: lastPosition });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.basePairsProcessed).toBe(dna.getSequence().length);
      }
    });

    test('handles maximum boundary start position correctly', () => {
      const dna = new DNA('ATGC');
      const result = replicateDNA(dna, { startPosition: 3 }); // Last valid index

      expect(isSuccess(result)).toBe(true);
    });

    test('rejects start position equal to sequence length', () => {
      const dna = new DNA('ATGC');
      const result = replicateDNA(dna, { startPosition: 4 }); // Equal to length

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid start position: 4');
      }
    });
  });

  describe('biological accuracy', () => {
    test('replication maintains sequence integrity', () => {
      const originalSequence = 'ATGCGATCGTAGCTACGTGCTAGCTAACCGGTTA';
      const dna = new DNA(originalSequence);
      const result = replicateDNA(dna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const [strand1, strand2] = result.data.replicatedStrands;
        expect(strand1.getSequence()).toBe(originalSequence);
        expect(strand2.getSequence()).toBe(originalSequence);
        expect(strand1.getSequence().length).toBe(originalSequence.length);
        expect(strand2.getSequence().length).toBe(originalSequence.length);
      }
    });

    test('different organisms produce same sequence but potentially different statistics', () => {
      const dna = new DNA('ATGCGATCGTAGCTACGTGCTAGCTA');

      const eColiResult = replicateDNA(dna, { organism: E_COLI });
      const humanResult = replicateDNA(dna, { organism: HUMAN });

      expect(isSuccess(eColiResult)).toBe(true);
      expect(isSuccess(humanResult)).toBe(true);

      if (isSuccess(eColiResult) && isSuccess(humanResult)) {
        // Sequences should be identical
        expect(eColiResult.data.replicatedStrands[0].getSequence()).toBe(
          humanResult.data.replicatedStrands[0].getSequence(),
        );

        // But organisms may have different biological characteristics
        // (This test ensures the API works correctly with different organisms)
        expect(eColiResult.data.completionPercentage).toBe(100);
        expect(humanResult.data.completionPercentage).toBe(100);
      }
    });
  });
});
