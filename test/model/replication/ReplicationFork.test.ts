import { ReplicationFork } from '../../../src/model/replication/ReplicationFork.js';
import { E_COLI, HUMAN } from '../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('ReplicationFork', () => {
  describe('constructor', () => {
    test('creates valid fork with correct parameters', () => {
      const fork = new ReplicationFork(100, 5000, E_COLI);

      expect(fork.position).toBe(100);
      expect(fork.dnaLength).toBe(5000);
      expect(fork.organism).toBe(E_COLI);
    });

    test('accepts default position of 0', () => {
      const fork = new ReplicationFork(undefined, 1000, HUMAN);
      expect(fork.position).toBe(0);
    });

    test('throws error for negative position', () => {
      expect(() => new ReplicationFork(-1, 1000, E_COLI)).toThrow(
        'Position must be non-negative. Provided: -1',
      );
    });

    test('throws error for non-positive DNA length', () => {
      expect(() => new ReplicationFork(0, 0, E_COLI)).toThrow(
        'DNA length must be positive. Provided: 0',
      );

      expect(() => new ReplicationFork(0, -100, E_COLI)).toThrow(
        'DNA length must be positive. Provided: -100',
      );
    });

    test('throws error when position exceeds DNA length', () => {
      expect(() => new ReplicationFork(1001, 1000, E_COLI)).toThrow(
        'Position (1001) cannot exceed DNA length (1000)',
      );
    });

    test('throws error for invalid organism', () => {
      expect(() => new ReplicationFork(0, 1000, null as any)).toThrow(
        'Organism profile is required',
      );
    });

    test('throws error for invalid polymerase speed', () => {
      const invalidOrganism = { ...E_COLI, polymeraseSpeed: 0 };
      expect(() => new ReplicationFork(0, 1000, invalidOrganism)).toThrow(
        'Polymerase speed must be positive. Provided: 0',
      );
    });
  });

  describe('create static method', () => {
    test('successfully creates valid fork', () => {
      const result = ReplicationFork.create(50, 2000, HUMAN);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.position).toBe(50);
        expect(result.data.dnaLength).toBe(2000);
        expect(result.data.organism).toBe(HUMAN);
      }
    });

    test('fails for invalid parameters', () => {
      const result1 = ReplicationFork.create(-1, 1000, E_COLI);
      expect(isFailure(result1)).toBe(true);
      if (isFailure(result1)) {
        expect(result1.error).toContain('Position must be non-negative');
      }

      const result2 = ReplicationFork.create(0, 0, E_COLI);
      expect(isFailure(result2)).toBe(true);
      if (isFailure(result2)) {
        expect(result2.error).toContain('DNA length must be positive');
      }

      const result3 = ReplicationFork.create(500, 100, E_COLI);
      expect(isFailure(result3)).toBe(true);
      if (isFailure(result3)) {
        expect(result3.error).toContain('Position (500) cannot exceed DNA length (100)');
      }
    });
  });

  describe('progress tracking', () => {
    let fork: ReplicationFork;

    beforeEach(() => {
      fork = new ReplicationFork(200, 1000, E_COLI);
    });

    test('getCompletionPercentage calculates correctly', () => {
      expect(fork.getCompletionPercentage()).toBe(20); // 200/1000 * 100

      fork.position = 500;
      expect(fork.getCompletionPercentage()).toBe(50);

      fork.position = 1000;
      expect(fork.getCompletionPercentage()).toBe(100);
    });

    test('getCompletionPercentage handles edge cases', () => {
      const zeroLengthFork = new ReplicationFork(0, 1, E_COLI);
      zeroLengthFork.position = 0;
      expect(zeroLengthFork.getCompletionPercentage()).toBe(0);

      zeroLengthFork.position = 1;
      expect(zeroLengthFork.getCompletionPercentage()).toBe(100);
    });

    test('canAdvance returns correct values', () => {
      expect(fork.canAdvance()).toBe(true);

      fork.position = 999;
      expect(fork.canAdvance()).toBe(true);

      fork.position = 1000;
      expect(fork.canAdvance()).toBe(false);
    });

    test('isComplete returns correct values', () => {
      expect(fork.isComplete()).toBe(false);

      fork.position = 999;
      expect(fork.isComplete()).toBe(false);

      fork.position = 1000;
      expect(fork.isComplete()).toBe(true);
    });

    test('getRemainingDistance calculates correctly', () => {
      expect(fork.getRemainingDistance()).toBe(800); // 1000 - 200

      fork.position = 900;
      expect(fork.getRemainingDistance()).toBe(100);

      fork.position = 1000;
      expect(fork.getRemainingDistance()).toBe(0);
    });
  });

  describe('fork advancement', () => {
    let fork: ReplicationFork;

    beforeEach(() => {
      fork = new ReplicationFork(100, 1000, E_COLI);
    });

    test('advance moves fork forward correctly', () => {
      const newPosition = fork.advance(50);

      expect(newPosition).toBe(150);
      expect(fork.position).toBe(150);
    });

    test('advance throws error for negative advancement', () => {
      expect(() => fork.advance(-10)).toThrow('Cannot advance by negative amount: -10');
    });

    test('advance throws error when exceeding DNA length', () => {
      expect(() => fork.advance(1000)).toThrow('Advancement would exceed DNA length: 1100 > 1000');
    });

    test('safeAdvance caps at DNA length', () => {
      const actualAdvancement = fork.safeAdvance(1000);

      expect(actualAdvancement).toBe(900); // 1000 - 100
      expect(fork.position).toBe(1000);
    });

    test('safeAdvance handles normal advancement', () => {
      const actualAdvancement = fork.safeAdvance(50);

      expect(actualAdvancement).toBe(50);
      expect(fork.position).toBe(150);
    });

    test('safeAdvance handles zero remaining distance', () => {
      fork.position = 1000;
      const actualAdvancement = fork.safeAdvance(50);

      expect(actualAdvancement).toBe(0);
      expect(fork.position).toBe(1000);
    });
  });

  describe('biological parameters', () => {
    test('getExpectedFragmentSize returns E. coli range', () => {
      const fork = new ReplicationFork(0, 5000, E_COLI);

      for (let i = 0; i < 20; i++) {
        const size = fork.getExpectedFragmentSize();
        expect(size).toBeGreaterThanOrEqual(1000);
        expect(size).toBeLessThanOrEqual(2000);
      }
    });

    test('getExpectedFragmentSize returns human range', () => {
      const fork = new ReplicationFork(0, 5000, HUMAN);

      for (let i = 0; i < 20; i++) {
        const size = fork.getExpectedFragmentSize();
        expect(size).toBeGreaterThanOrEqual(100);
        expect(size).toBeLessThanOrEqual(200);
      }
    });

    test('getExpectedPrimerLength returns valid range', () => {
      const fork = new ReplicationFork(0, 5000, E_COLI);

      for (let i = 0; i < 20; i++) {
        const length = fork.getExpectedPrimerLength();
        expect(length).toBeGreaterThanOrEqual(3);
        expect(length).toBeLessThanOrEqual(10);
      }
    });

    test('getExpectedFragmentSize generates variety', () => {
      const fork = new ReplicationFork(0, 5000, E_COLI);
      const sizes = Array.from({ length: 50 }, () => fork.getExpectedFragmentSize());
      const uniqueSizes = new Set(sizes);

      // Should have variety in sizes, not all the same
      expect(uniqueSizes.size).toBeGreaterThan(5);
    });

    test('getCurrentSpeed returns organism speed', () => {
      const ecoliFork = new ReplicationFork(0, 1000, E_COLI);
      expect(ecoliFork.getCurrentSpeed()).toBe(1000);

      const humanFork = new ReplicationFork(0, 1000, HUMAN);
      expect(humanFork.getCurrentSpeed()).toBe(50);
    });
  });

  describe('time calculations', () => {
    test('getEstimatedCompletionTime calculates correctly', () => {
      const fork = new ReplicationFork(0, 1000, E_COLI);
      const estimatedTime = fork.getEstimatedCompletionTime();

      expect(estimatedTime).toBe(1); // 1000 bp / 1000 bp/s = 1 second

      fork.position = 500;
      const remainingTime = fork.getEstimatedCompletionTime();
      expect(remainingTime).toBe(0.5); // 500 bp / 1000 bp/s = 0.5 seconds
    });

    test('getEstimatedCompletionTime handles human speeds', () => {
      const fork = new ReplicationFork(0, 1000, HUMAN);
      const estimatedTime = fork.getEstimatedCompletionTime();

      expect(estimatedTime).toBe(20); // 1000 bp / 50 bp/s = 20 seconds
    });
  });

  describe('fragment count estimation', () => {
    test('getExpectedFragmentCount estimates E. coli fragments', () => {
      const fork = new ReplicationFork(0, 15000, E_COLI);
      const fragmentCount = fork.getExpectedFragmentCount();

      // 15000 bp / 1500 bp avg fragment = 10 fragments
      expect(fragmentCount).toBeGreaterThanOrEqual(7);
      expect(fragmentCount).toBeLessThanOrEqual(15);
    });

    test('getExpectedFragmentCount estimates human fragments', () => {
      const fork = new ReplicationFork(0, 3000, HUMAN);
      const fragmentCount = fork.getExpectedFragmentCount();

      // 3000 bp / 150 bp avg fragment = 20 fragments
      expect(fragmentCount).toBeGreaterThanOrEqual(15);
      expect(fragmentCount).toBeLessThanOrEqual(30);
    });

    test('getExpectedFragmentCount handles partial completion', () => {
      const fork = new ReplicationFork(1000, 5000, E_COLI);
      const fragmentCount = fork.getExpectedFragmentCount();

      // Only considering remaining 4000 bp
      expect(fragmentCount).toBeGreaterThanOrEqual(2);
      expect(fragmentCount).toBeLessThanOrEqual(4);
    });
  });

  describe('statistics', () => {
    test('getStatistics returns complete information', () => {
      const fork = new ReplicationFork(300, 2000, HUMAN);
      const stats = fork.getStatistics();

      expect(stats.position).toBe(300);
      expect(stats.totalLength).toBe(2000);
      expect(stats.completionPercentage).toBe(15); // 300/2000 * 100
      expect(stats.remainingDistance).toBe(1700);
      expect(stats.estimatedTimeRemaining).toBe(34); // 1700/50
      expect(stats.organismType).toBe('eukaryotic');
      expect(stats.speed).toBe(50);
      expect(typeof stats.expectedFragmentsRemaining).toBe('number');
    });
  });

  describe('consistency checking', () => {
    test('isConsistentWith returns true for valid fragment end', () => {
      const fork = new ReplicationFork(500, 2000, E_COLI);

      expect(fork.isConsistentWith(300)).toBe(true);
      expect(fork.isConsistentWith(500)).toBe(true);
    });

    test('isConsistentWith returns false for invalid fragment end', () => {
      const fork = new ReplicationFork(500, 2000, E_COLI);

      expect(fork.isConsistentWith(600)).toBe(false);
    });
  });

  describe('utility methods', () => {
    test('copy creates identical fork', () => {
      const original = new ReplicationFork(150, 1000, HUMAN);
      const copy = original.copy();

      expect(copy.position).toBe(original.position);
      expect(copy.dnaLength).toBe(original.dnaLength);
      expect(copy.organism).toBe(original.organism);
      expect(copy).not.toBe(original); // Different instance
    });

    test('toString provides informative representation', () => {
      const fork = new ReplicationFork(750, 1000, E_COLI);
      const str = fork.toString();

      expect(str).toContain('750/1000');
      expect(str).toContain('75.0% complete');
      expect(str).toContain('prokaryotic');
    });

    test('equals compares forks correctly', () => {
      const fork1 = new ReplicationFork(100, 500, E_COLI);
      const fork2 = new ReplicationFork(100, 500, E_COLI);
      const fork3 = new ReplicationFork(200, 500, E_COLI);
      const fork4 = new ReplicationFork(100, 500, HUMAN);

      expect(fork1.equals(fork2)).toBe(true);
      expect(fork1.equals(fork3)).toBe(false);
      expect(fork1.equals(fork4)).toBe(false);
    });
  });

  describe('biological realism', () => {
    test('E. coli parameters match research', () => {
      const fork = new ReplicationFork(0, 5000000, E_COLI); // 5 Mbp chromosome

      expect(fork.organism.polymeraseSpeed).toBe(1000); // 1000 bp/s
      expect(fork.organism.fragmentSize).toEqual([1000, 2000]); // 1-2 kb fragments
      expect(fork.organism.primerLength).toEqual([3, 10]); // 3-10 nt primers
      expect(fork.organism.hasNucleosomes).toBe(false);
      expect(fork.organism.type).toBe('prokaryotic');
    });

    test('human parameters match research', () => {
      const fork = new ReplicationFork(0, 250000000, HUMAN); // 250 Mbp chromosome

      expect(fork.organism.polymeraseSpeed).toBe(50); // 50 bp/s
      expect(fork.organism.fragmentSize).toEqual([100, 200]); // 100-200 bp fragments
      expect(fork.organism.primerLength).toEqual([3, 10]); // 3-10 nt primers
      expect(fork.organism.hasNucleosomes).toBe(true);
      expect(fork.organism.type).toBe('eukaryotic');
    });

    test('fragment sizes reflect biological constraints', () => {
      const ecoliFork = new ReplicationFork(0, 10000, E_COLI);
      const humanFork = new ReplicationFork(0, 10000, HUMAN);

      // E. coli should need fewer, larger fragments
      const ecoliFragments = ecoliFork.getExpectedFragmentCount();
      const humanFragments = humanFork.getExpectedFragmentCount();

      expect(humanFragments).toBeGreaterThan(ecoliFragments);
    });

    test('replication speed affects completion time', () => {
      const sameLength = 10000;
      const ecoliFork = new ReplicationFork(0, sameLength, E_COLI);
      const humanFork = new ReplicationFork(0, sameLength, HUMAN);

      const ecoliTime = ecoliFork.getEstimatedCompletionTime();
      const humanTime = humanFork.getEstimatedCompletionTime();

      // Human should take 20x longer (1000 vs 50 bp/s)
      expect(humanTime / ecoliTime).toBe(20);
    });
  });
});
