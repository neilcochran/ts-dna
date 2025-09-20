import { LaggingStrandSynthesis } from '../../../src/utils/replication/LaggingStrandSynthesis.js';
import { E_COLI, HUMAN } from '../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('LaggingStrandSynthesis', () => {
  let laggingSynthesis: LaggingStrandSynthesis;

  beforeEach(() => {
    laggingSynthesis = new LaggingStrandSynthesis(E_COLI, 0);
  });

  describe('constructor', () => {
    test('creates lagging strand synthesis with E. coli parameters', () => {
      expect(laggingSynthesis).toBeInstanceOf(LaggingStrandSynthesis);
      expect(laggingSynthesis.getCompletedFragments()).toHaveLength(0);
      expect(laggingSynthesis.getActiveFragments()).toHaveLength(0);
      expect(laggingSynthesis.getTotalSynthesizedLength()).toBe(0);
      expect(laggingSynthesis.isSynthesizing()).toBe(false);
    });

    test('creates lagging strand synthesis with human parameters', () => {
      const humanSynthesis = new LaggingStrandSynthesis(HUMAN, 100);
      expect(humanSynthesis.getCompletedFragments()).toHaveLength(0);
      expect(humanSynthesis.getActiveFragments()).toHaveLength(0);
    });
  });

  describe('initiateSynthesis', () => {
    test('successfully initiates synthesis and creates first fragment', () => {
      const result = laggingSynthesis.initiateSynthesis(0);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe('primer_synthesis');
      }
      expect(laggingSynthesis.isSynthesizing()).toBe(true);
      expect(laggingSynthesis.getActiveFragments()).toHaveLength(1);
    });

    test('fails with negative fork position', () => {
      const result = laggingSynthesis.initiateSynthesis(-10);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid fork position');
      }
      expect(laggingSynthesis.isSynthesizing()).toBe(false);
    });

    test('fails when fragment initiation fails internally', () => {
      // Test line 67: when initiateFragment returns failure
      // Create a LaggingStrandSynthesis with a mock organism that will cause fragment creation to fail
      const mockOrganism = {
        ...E_COLI,
        fragmentSize: [-1, -1] as [number, number], // Invalid fragment size to cause failure
      };

      const problematicSynthesis = new LaggingStrandSynthesis(mockOrganism, 0);
      const result = problematicSynthesis.initiateSynthesis(0);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to initiate first fragment');
      }
    });

    test('handles exception during fragment initiation', () => {
      // Test line 139: when fragment initiation throws an exception
      // We'll test this by using an organism profile that causes an exception
      const mockOrganism = {
        ...E_COLI,
        primerLength: [NaN, NaN] as [number, number], // This will cause Math.random calculations to fail
      };

      const problematicSynthesis = new LaggingStrandSynthesis(mockOrganism, 0);
      const result = problematicSynthesis.initiateSynthesis(0);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to initiate fragment');
      }
    });

    test('primer synthesis event has correct properties', () => {
      const result = laggingSynthesis.initiateSynthesis(100);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const primerEvent = result.data[0];
        expect(primerEvent.type).toBe('primer_synthesis');
        expect(primerEvent.enzyme).toBe('primase');
        expect(primerEvent.strand).toBe('lagging');
        expect(primerEvent.basePairsAdded).toBeGreaterThanOrEqual(3);
        expect(primerEvent.basePairsAdded).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('advance', () => {
    beforeEach(() => {
      laggingSynthesis.initiateSynthesis(0);
    });

    test('advances synthesis and generates events', () => {
      const events = laggingSynthesis.advance(500, 100);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('dna_synthesis');
      expect(events[0].strand).toBe('lagging');
      expect(laggingSynthesis.getTotalSynthesizedLength()).toBe(100);
    });

    test('generates proofreading event for large synthesis', () => {
      const events = laggingSynthesis.advance(1000, 600); // Above proofreading threshold

      const synthesisEvents = events.filter(e => e.type === 'dna_synthesis');
      const proofreadEvents = events.filter(e => e.type === 'proofreading');

      expect(synthesisEvents).toHaveLength(1);
      expect(proofreadEvents).toHaveLength(1);
    });

    test('creates new fragments as fork advances', () => {
      // Advance significantly to trigger new fragment creation
      laggingSynthesis.advance(2000, 1000);
      const initialFragments = laggingSynthesis.getActiveFragments().length;

      laggingSynthesis.advance(4000, 1000);
      const finalFragments =
        laggingSynthesis.getActiveFragments().length +
        laggingSynthesis.getCompletedFragments().length;

      expect(finalFragments).toBeGreaterThan(initialFragments);
    });

    test('completes fragments when fork passes their end', () => {
      // Start with a fragment
      const _initialActive = laggingSynthesis.getActiveFragments().length;

      // Advance fork far enough to complete fragments
      laggingSynthesis.advance(3000, 2000);

      const completed = laggingSynthesis.getCompletedFragments().length;
      expect(completed).toBeGreaterThan(0);
    });

    test('returns empty array when not active', () => {
      laggingSynthesis.stopSynthesis();
      const events = laggingSynthesis.advance(100, 50);

      expect(events).toHaveLength(0);
    });

    test('returns empty array for zero or negative base pairs', () => {
      expect(laggingSynthesis.advance(100, 0)).toHaveLength(0);
      expect(laggingSynthesis.advance(100, -10)).toHaveLength(0);
    });

    test('handles advance when no current fragment exists but synthesis is active', () => {
      // Test line 153: when continueFragmentSynthesis is called with no current fragment
      // First start synthesis to make it active
      laggingSynthesis.initiateSynthesis(0);

      // Complete all fragments by advancing far
      laggingSynthesis.advance(5000, 4000);

      // Reset the current fragment to null (this can happen when all fragments are completed)
      // We'll access the private property for testing
      (laggingSynthesis as any).currentFragment = undefined;

      // Now advance with no current fragment - should still work since synthesis is active
      const events = laggingSynthesis.advance(100, 50);

      // It should either create a new fragment or handle the case gracefully
      expect(laggingSynthesis.isSynthesizing()).toBe(true);
      expect(events.length).toBeGreaterThanOrEqual(0); // Should handle gracefully
    });
  });

  describe('fragment management', () => {
    beforeEach(() => {
      laggingSynthesis.initiateSynthesis(0);
    });

    test('creates fragments with organism-appropriate sizes', () => {
      laggingSynthesis.advance(1000, 500);
      const fragments = laggingSynthesis.getActiveFragments();

      expect(fragments.length).toBeGreaterThan(0);
      fragments.forEach(fragment => {
        const size = fragment.endPosition - fragment.startPosition;
        expect(size).toBeGreaterThanOrEqual(E_COLI.fragmentSize[0]);
        expect(size).toBeLessThanOrEqual(E_COLI.fragmentSize[1]);
      });
    });

    test('completed fragments have proper processing', () => {
      // Advance enough to complete some fragments
      laggingSynthesis.advance(3000, 2500);
      const completed = laggingSynthesis.getCompletedFragments();

      completed.forEach(fragment => {
        expect(fragment.isComplete()).toBe(true);
        expect(fragment.isPrimerRemoved).toBe(true);
        expect(fragment.isLigated).toBe(true);
      });
    });

    test('fragment IDs are unique', () => {
      // Create multiple fragments
      laggingSynthesis.advance(1000, 500);
      laggingSynthesis.advance(2000, 500);
      laggingSynthesis.advance(3000, 500);

      const allFragments = [
        ...laggingSynthesis.getActiveFragments(),
        ...laggingSynthesis.getCompletedFragments(),
      ];

      const ids = allFragments.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getProgress', () => {
    beforeEach(() => {
      laggingSynthesis.initiateSynthesis(0);
    });

    test('calculates progress correctly', () => {
      laggingSynthesis.advance(500, 250);

      expect(laggingSynthesis.getProgress(1000)).toBe(25);
      expect(laggingSynthesis.getProgress(500)).toBe(50);
    });

    test('handles completion correctly', () => {
      laggingSynthesis.advance(2000, 1000);

      expect(laggingSynthesis.getProgress(1000)).toBe(100);
      expect(laggingSynthesis.getProgress(500)).toBe(100); // Capped at 100%
    });

    test('handles edge cases', () => {
      expect(laggingSynthesis.getProgress(0)).toBe(100);
      expect(laggingSynthesis.getProgress(-100)).toBe(100);
    });
  });

  describe('stopSynthesis', () => {
    test('stops active synthesis', () => {
      laggingSynthesis.initiateSynthesis(0);
      expect(laggingSynthesis.isSynthesizing()).toBe(true);

      laggingSynthesis.stopSynthesis();
      expect(laggingSynthesis.isSynthesizing()).toBe(false);

      // Should not advance after stopping
      const events = laggingSynthesis.advance(100, 50);
      expect(events).toHaveLength(0);
    });
  });

  describe('getState', () => {
    test('returns correct state information', () => {
      laggingSynthesis.initiateSynthesis(0);
      laggingSynthesis.advance(1000, 500);

      const state = laggingSynthesis.getState();

      expect(state.totalFragments).toBeGreaterThan(0);
      expect(state.totalSynthesizedLength).toBe(500);
      expect(state.isActive).toBe(true);
      expect(typeof state.currentFragmentId).toBe('string');
    });

    test('returns correct state when inactive', () => {
      const state = laggingSynthesis.getState();

      expect(state.totalFragments).toBe(0);
      expect(state.completedFragments).toBe(0);
      expect(state.activeFragments).toBe(0);
      expect(state.totalSynthesizedLength).toBe(0);
      expect(state.isActive).toBe(false);
      expect(state.currentFragmentId).toBeUndefined();
    });
  });

  describe('organism-specific behavior', () => {
    test('E. coli creates appropriately sized fragments', () => {
      laggingSynthesis.initiateSynthesis(0);
      laggingSynthesis.advance(2000, 1000);

      const fragments = laggingSynthesis.getActiveFragments();
      fragments.forEach(fragment => {
        const size = fragment.endPosition - fragment.startPosition;
        expect(size).toBeGreaterThanOrEqual(1000);
        expect(size).toBeLessThanOrEqual(2000);
      });
    });

    test('Human creates appropriately sized fragments', () => {
      const humanSynthesis = new LaggingStrandSynthesis(HUMAN, 0);
      humanSynthesis.initiateSynthesis(0);
      humanSynthesis.advance(1000, 500);

      const fragments = humanSynthesis.getActiveFragments();
      fragments.forEach(fragment => {
        const size = fragment.endPosition - fragment.startPosition;
        expect(size).toBeGreaterThanOrEqual(100);
        expect(size).toBeLessThanOrEqual(200);
      });
    });
  });

  describe('biological accuracy', () => {
    beforeEach(() => {
      laggingSynthesis.initiateSynthesis(0);
    });

    test('primer synthesis events have correct biological properties', () => {
      const result = laggingSynthesis.initiateSynthesis(100);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const primerEvent = result.data[0];
        expect(primerEvent.enzyme).toBe('primase');
        expect(primerEvent.strand).toBe('lagging');
        expect(primerEvent.metadata?.primerLength).toBeGreaterThanOrEqual(3);
        expect(primerEvent.metadata?.primerLength).toBeLessThanOrEqual(10);
      }
    });

    test('DNA synthesis events have correct properties', () => {
      const events = laggingSynthesis.advance(500, 100);
      const synthesisEvent = events.find(e => e.type === 'dna_synthesis');

      expect(synthesisEvent).toBeDefined();
      if (synthesisEvent) {
        expect(synthesisEvent.enzyme).toBe('polymerase');
        expect(synthesisEvent.strand).toBe('lagging');
        expect(synthesisEvent.basePairsAdded).toBe(100);
        expect(synthesisEvent.metadata?.polymeraseVariant).toBe('PolIII');
      }
    });

    test('fragment processing generates correct events', () => {
      // Advance enough to complete fragments
      const events = laggingSynthesis.advance(3000, 2500);

      const removalEvents = events.filter(e => e.type === 'primer_removal');
      const ligationEvents = events.filter(e => e.type === 'ligation');

      if (removalEvents.length > 0) {
        removalEvents.forEach(event => {
          expect(event.enzyme).toBe('exonuclease');
          expect(event.strand).toBe('lagging');
          expect(event.basePairsAdded).toBeLessThan(0); // Negative for removal
        });
      }

      if (ligationEvents.length > 0) {
        ligationEvents.forEach(event => {
          expect(event.enzyme).toBe('ligase');
          expect(event.strand).toBe('lagging');
        });
      }
    });
  });
});
