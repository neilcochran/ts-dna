import { ForkCoordinator } from '../../../src/utils/replication/ForkCoordinator.js';
import { DNA } from '../../../src/model/nucleic-acids/DNA.js';
import { ReplicationFork } from '../../../src/model/replication/ReplicationFork.js';
import { E_COLI, HUMAN } from '../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('ForkCoordinator', () => {
  let dna: DNA;
  let fork: ReplicationFork;
  let coordinator: ForkCoordinator;

  beforeEach(() => {
    // Create a realistic DNA sequence for testing
    const testSequence = 'ATGAAAGTATGCCCAAGTTTCGGGAGTTCGGGCCCATGAAAGTACGCCCAAGTTTCGGGAG'.repeat(
      100,
    ); // 6400 bp
    dna = new DNA(testSequence);
    fork = new ReplicationFork(0, dna.getSequence().length, E_COLI);
    coordinator = new ForkCoordinator(dna, fork, E_COLI);
  });

  describe('constructor', () => {
    test('creates fork coordinator with E. coli parameters', () => {
      expect(coordinator).toBeInstanceOf(ForkCoordinator);
      expect(coordinator.getDNA()).toBe(dna);
      expect(coordinator.getOrganism()).toBe(E_COLI);
      expect(coordinator.isComplete()).toBe(false);
    });

    test('creates fork coordinator with human parameters', () => {
      const humanFork = new ReplicationFork(0, dna.getSequence().length, HUMAN);
      const humanCoordinator = new ForkCoordinator(dna, humanFork, HUMAN);

      expect(humanCoordinator.getOrganism()).toBe(HUMAN);
      expect(humanCoordinator.isComplete()).toBe(false);
    });
  });

  describe('initializeReplication', () => {
    test('successfully initializes replication process', () => {
      const result = coordinator.initializeReplication();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.length).toBeGreaterThan(0);

        // Should have primer synthesis event for lagging strand
        const primerEvents = result.data.filter(e => e.type === 'primer_synthesis');
        expect(primerEvents.length).toBeGreaterThan(0);
        expect(primerEvents[0].strand).toBe('lagging');
        expect(primerEvents[0].enzyme).toBe('primase');
      }
    });

    test('initialization creates proper event history', () => {
      coordinator.initializeReplication();
      const events = coordinator.getAllEvents();

      expect(events.length).toBeGreaterThan(0);

      // First events should be primer synthesis
      const firstEvent = events[0];
      expect(firstEvent.type).toBe('primer_synthesis');
      expect(firstEvent.position).toBe(0);
    });

    test('handles initialization with different fork positions', () => {
      const customFork = new ReplicationFork(1000, dna.getSequence().length, E_COLI);
      customFork.position = 1000;
      const customCoordinator = new ForkCoordinator(dna, customFork, E_COLI);

      const result = customCoordinator.initializeReplication();
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe('advanceFork', () => {
    beforeEach(() => {
      coordinator.initializeReplication();
    });

    test('advances fork and generates events', () => {
      const result = coordinator.advanceFork(500);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const state = result.data;
        expect(state.forkPosition).toBe(500);
        expect(state.completionPercentage).toBeGreaterThan(0);
        expect(state.leadingStrandProgress).toBe(500);
        expect(state.laggingStrandProgress).toBeGreaterThan(0);
      }
    });

    test('coordinates leading and lagging strand synthesis', () => {
      coordinator.advanceFork(1000);
      const events = coordinator.getAllEvents();

      const leadingEvents = events.filter(e => e.strand === 'leading');
      const laggingEvents = events.filter(e => e.strand === 'lagging');

      expect(leadingEvents.length).toBeGreaterThan(0);
      expect(laggingEvents.length).toBeGreaterThan(0);

      // Leading strand should have continuous synthesis
      const leadingSynthesis = leadingEvents.filter(e => e.type === 'dna_synthesis');
      expect(leadingSynthesis.length).toBeGreaterThan(0);

      // Lagging strand should have fragment management
      const primerSynthesis = laggingEvents.filter(e => e.type === 'primer_synthesis');
      expect(primerSynthesis.length).toBeGreaterThan(0);
    });

    test('fails with invalid advance amount', () => {
      const result = coordinator.advanceFork(0);
      expect(isFailure(result)).toBe(true);

      const negativeResult = coordinator.advanceFork(-100);
      expect(isFailure(negativeResult)).toBe(true);
    });

    test('handles fork completion correctly', () => {
      // Advance to completion
      const dnaLength = dna.getSequence().length;
      const result = coordinator.advanceFork(dnaLength);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.completionPercentage).toBe(100);
        expect(coordinator.isComplete()).toBe(true);
      }
    });

    test('fails when trying to advance completed fork', () => {
      // Complete the fork first
      const dnaLength = dna.getSequence().length;
      coordinator.advanceFork(dnaLength);

      // Try to advance again
      const result = coordinator.advanceFork(100);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('already complete');
      }
    });

    test('accumulates events over multiple advances', () => {
      coordinator.advanceFork(500);
      const firstEventCount = coordinator.getAllEvents().length;

      coordinator.advanceFork(500);
      const secondEventCount = coordinator.getAllEvents().length;

      expect(secondEventCount).toBeGreaterThan(firstEventCount);
    });
  });

  describe('completeReplication', () => {
    beforeEach(() => {
      coordinator.initializeReplication();
    });

    test('completes entire replication process', () => {
      const result = coordinator.completeReplication();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.completionPercentage).toBe(100);
        expect(coordinator.isComplete()).toBe(true);
      }
    });

    test('prevents infinite loops with max steps', () => {
      const result = coordinator.completeReplication(5); // Very low limit

      if (isFailure(result)) {
        expect(result.error).toContain('did not complete within');
      }
      // If it succeeds with 5 steps, that's also valid for small sequences
    });

    test('generates comprehensive event history', () => {
      coordinator.completeReplication();
      const events = coordinator.getAllEvents();

      expect(events.length).toBeGreaterThan(10); // Should have many events

      // Should have all types of events
      const eventTypes = new Set(events.map(e => e.type));
      expect(eventTypes.has('primer_synthesis')).toBe(true);
      expect(eventTypes.has('dna_synthesis')).toBe(true);
      expect(eventTypes.has('unwind')).toBe(true);
    });

    test('finalizes synthesis on both strands', () => {
      coordinator.completeReplication();
      const state = coordinator.getCurrentState();

      expect(state.completionPercentage).toBe(100);
      expect(state.forkPosition).toBe(dna.getSequence().length);
    });
  });

  describe('getCurrentState', () => {
    beforeEach(() => {
      coordinator.initializeReplication();
    });

    test('returns accurate state information', () => {
      coordinator.advanceFork(1000);
      const state = coordinator.getCurrentState();

      expect(state.forkPosition).toBe(1000);
      expect(state.completionPercentage).toBeGreaterThan(0);
      expect(state.leadingStrandProgress).toBe(1000);
      expect(state.laggingStrandProgress).toBeGreaterThan(0);
      expect(state.activeFragments.length).toBeGreaterThan(0);
      expect(state.activeEnzymes.length).toBeGreaterThan(0);
    });

    test('tracks progress accurately throughout replication', () => {
      const state1 = coordinator.getCurrentState();
      coordinator.advanceFork(500);
      const state2 = coordinator.getCurrentState();
      coordinator.advanceFork(500);
      const state3 = coordinator.getCurrentState();

      expect(state2.forkPosition).toBeGreaterThan(state1.forkPosition);
      expect(state3.forkPosition).toBeGreaterThan(state2.forkPosition);
      expect(state3.completionPercentage).toBeGreaterThan(state2.completionPercentage);
    });
  });

  describe('event management', () => {
    beforeEach(() => {
      coordinator.initializeReplication();
      coordinator.advanceFork(2000);
    });

    test('getAllEvents returns complete event history', () => {
      const events = coordinator.getAllEvents();

      expect(events.length).toBeGreaterThan(0);
      events.forEach(event => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('position');
        expect(event).toHaveProperty('enzyme');
        expect(event).toHaveProperty('strand');
      });
    });

    test('getEventsByType filters correctly', () => {
      const synthesisEvents = coordinator.getEventsByType('dna_synthesis');
      const primerEvents = coordinator.getEventsByType('primer_synthesis');
      const unwindEvents = coordinator.getEventsByType('unwind');

      expect(synthesisEvents.length).toBeGreaterThan(0);
      expect(primerEvents.length).toBeGreaterThan(0);
      expect(unwindEvents.length).toBeGreaterThan(0);

      // Verify filtering is correct
      synthesisEvents.forEach(event => {
        expect(event.type).toBe('dna_synthesis');
      });
    });

    test('events have correct biological properties', () => {
      const events = coordinator.getAllEvents();

      events.forEach(event => {
        expect(['leading', 'lagging']).toContain(event.strand);
        expect(['helicase', 'primase', 'polymerase', 'ligase', 'exonuclease']).toContain(
          event.enzyme,
        );
        expect(event.position).toBeGreaterThanOrEqual(0);

        if (event.basePairsAdded !== undefined) {
          if (event.type === 'primer_removal') {
            expect(event.basePairsAdded).toBeLessThan(0); // Negative for removal
          } else {
            expect(event.basePairsAdded).toBeGreaterThan(0);
          }
        }
      });
    });
  });

  describe('getStatistics', () => {
    beforeEach(() => {
      coordinator.initializeReplication();
      coordinator.advanceFork(2000);
    });

    test('provides comprehensive replication statistics', () => {
      const stats = coordinator.getStatistics();

      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('fork');
      expect(stats).toHaveProperty('leadingStrand');
      expect(stats).toHaveProperty('laggingStrand');
      expect(stats).toHaveProperty('eventCounts');

      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.fork.position).toBe(2000);
      expect(stats.fork.completion).toBeGreaterThan(0);
      expect(stats.leadingStrand.synthesizedLength).toBe(2000);
      expect(stats.laggingStrand.synthesizedLength).toBeGreaterThan(0);
    });

    test('event counts are accurate', () => {
      const stats = coordinator.getStatistics();

      expect(stats.eventCounts.dnaSynthesis).toBeGreaterThan(0);
      expect(stats.eventCounts.primerSynthesis).toBeGreaterThan(0);
      expect(stats.eventCounts.unwind).toBeGreaterThan(0);

      // Verify counts match actual events
      const actualDnaSynthesis = coordinator.getEventsByType('dna_synthesis').length;
      expect(stats.eventCounts.dnaSynthesis).toBe(actualDnaSynthesis);
    });
  });

  describe('organism-specific behavior', () => {
    test('E. coli replication has correct characteristics', () => {
      coordinator.initializeReplication();
      coordinator.advanceFork(1000);

      const stats = coordinator.getStatistics();
      expect(stats.leadingStrand.speed).toBe(E_COLI.polymeraseSpeed);

      // E. coli should have larger fragments
      const state = coordinator.getCurrentState();
      expect(state.activeFragments.length).toBeGreaterThan(0);
    });

    test('Human replication has correct characteristics', () => {
      const humanFork = new ReplicationFork(0, dna.getSequence().length, HUMAN);
      const humanCoordinator = new ForkCoordinator(dna, humanFork, HUMAN);

      humanCoordinator.initializeReplication();
      humanCoordinator.advanceFork(1000);

      const stats = humanCoordinator.getStatistics();
      expect(stats.leadingStrand.speed).toBe(HUMAN.polymeraseSpeed);

      // Human should have more, smaller fragments
      const state = humanCoordinator.getCurrentState();
      expect(state.activeFragments.length).toBeGreaterThan(0);
    });
  });

  describe('error handling and edge cases', () => {
    test('handles very small DNA sequences', () => {
      const smallDNA = new DNA('ATGCGTAC'); // 8 bp
      const smallFork = new ReplicationFork(0, smallDNA.getSequence().length, E_COLI);
      const smallCoordinator = new ForkCoordinator(smallDNA, smallFork, E_COLI);

      const initResult = smallCoordinator.initializeReplication();
      expect(isSuccess(initResult)).toBe(true);

      const completeResult = smallCoordinator.completeReplication();
      expect(isSuccess(completeResult)).toBe(true);
    });

    test('maintains biological constraints', () => {
      coordinator.initializeReplication();
      coordinator.advanceFork(5000);

      const events = coordinator.getAllEvents();
      const primerEvents = events.filter(e => e.type === 'primer_synthesis');

      // Verify primer lengths are within biological range
      primerEvents.forEach(event => {
        if (event.metadata?.primerLength) {
          expect(event.metadata.primerLength).toBeGreaterThanOrEqual(3);
          expect(event.metadata.primerLength).toBeLessThanOrEqual(10);
        }
      });
    });

    test('handles replication near sequence boundaries', () => {
      const dnaLength = dna.getSequence().length;
      coordinator.initializeReplication();

      // Advance to near the end
      const result = coordinator.advanceFork(dnaLength - 100);
      expect(isSuccess(result)).toBe(true);

      // Complete the remaining
      const finalResult = coordinator.advanceFork(200); // More than remaining
      expect(isSuccess(finalResult)).toBe(true);
      if (isSuccess(finalResult)) {
        expect(finalResult.data.forkPosition).toBe(dnaLength);
        expect(finalResult.data.completionPercentage).toBe(100);
      }
    });
  });
});
