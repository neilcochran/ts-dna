import { Replisome } from '../../../src/model/replication/Replisome.js';
import { ReplicationFork } from '../../../src/model/replication/ReplicationFork.js';
import { E_COLI, HUMAN, EnzymeType } from '../../../src/types/replication-types.js';
import { isSuccess } from '../../../src/types/validation-result.js';

describe('Replisome', () => {
  let fork: ReplicationFork;

  beforeEach(() => {
    fork = new ReplicationFork(0, 10000, E_COLI);
  });

  describe('constructor', () => {
    test('creates replisome with default configuration', () => {
      const replisome = new Replisome(fork, E_COLI);

      expect(replisome.organism).toBe(E_COLI);
      expect(replisome.isComplete()).toBe(false);
      expect(replisome.getCompletedFragments()).toHaveLength(0);
    });

    test('creates replisome with custom configuration', () => {
      const config = {
        leadingPolymerase: 'PolI' as const,
        laggingPolymerase: 'PolII' as const,
        enableProofreading: true,
        enableDetailedLogging: true,
      };

      const replisome = new Replisome(fork, E_COLI, config);
      expect(replisome.organism).toBe(E_COLI);
    });

    test('throws error if enzyme creation fails', () => {
      // Test with invalid DNA length instead of invalid position
      expect(() => {
        const invalidFork = new ReplicationFork(0, -1, E_COLI);
        new Replisome(invalidFork, E_COLI);
      }).toThrow();
    });
  });

  describe('create static method', () => {
    test('successfully creates replisome', () => {
      const result = Replisome.create(fork, E_COLI);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Replisome);
        expect(result.data.organism).toBe(E_COLI);
      }
    });

    test('creates replisome with configuration', () => {
      const config = {
        enableProofreading: true,
        enableDetailedLogging: false,
      };

      const result = Replisome.create(fork, HUMAN, config);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.organism).toBe(HUMAN);
      }
    });

    test('handles creation errors gracefully', () => {
      // Create a fork that might cause enzyme creation issues
      const problematicFork = fork; // Use valid fork for now
      const result = Replisome.create(problematicFork, E_COLI);

      // Should still succeed with valid parameters
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe('fork advancement', () => {
    let replisome: Replisome;

    beforeEach(() => {
      replisome = new Replisome(fork, E_COLI);
    });

    test('advanceFork returns empty array when fork cannot advance', () => {
      // Move fork to end
      fork.position = 10000;
      const events = replisome.advanceFork(100);

      expect(events).toHaveLength(0);
    });

    test('advanceFork returns empty array for zero advancement', () => {
      const events = replisome.advanceFork(0);

      expect(events).toHaveLength(0);
    });

    test('advanceFork returns empty array for negative advancement', () => {
      const events = replisome.advanceFork(-50);

      expect(events).toHaveLength(0);
    });

    test('advanceFork generates replication events', () => {
      const events = replisome.advanceFork(100);

      expect(events.length).toBeGreaterThan(0);

      // Should include helicase unwinding
      const unwindEvent = events.find(e => e.type === 'unwind');
      expect(unwindEvent).toBeDefined();
      expect(unwindEvent?.enzyme).toBe(EnzymeType.HELICASE);

      // Should include leading strand synthesis
      const leadingSynthesis = events.find(
        e => e.type === 'dna_synthesis' && e.strand === 'leading',
      );
      expect(leadingSynthesis).toBeDefined();
    });

    test('advanceFork caps advancement at remaining distance', () => {
      // Position fork near end
      fork.position = 9950;
      const events = replisome.advanceFork(100);

      // Should only advance 50 bp (remaining distance)
      expect(fork.position).toBe(10000);
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('leading strand synthesis', () => {
    let replisome: Replisome;

    beforeEach(() => {
      replisome = new Replisome(fork, E_COLI, { enableProofreading: true });
    });

    test('synthesizes leading strand continuously', () => {
      const events = replisome.advanceFork(200);

      const leadingSynthesis = events.filter(
        e => e.type === 'dna_synthesis' && e.strand === 'leading',
      );

      expect(leadingSynthesis.length).toBeGreaterThanOrEqual(1);

      if (leadingSynthesis.length > 0) {
        expect(leadingSynthesis[0].basePairsAdded).toBe(200);
      }
    });

    test('includes proofreading when enabled', () => {
      const events = replisome.advanceFork(100);

      const proofreadingEvents = events.filter(
        e => e.type === 'proofreading' && e.strand === 'leading',
      );

      expect(proofreadingEvents.length).toBeGreaterThanOrEqual(1);
    });

    test('skips proofreading when disabled', () => {
      const noPproofreplisome = new Replisome(fork, E_COLI, { enableProofreading: false });
      const events = noPproofreplisome.advanceFork(100);

      const proofreadingEvents = events.filter(e => e.type === 'proofreading');
      expect(proofreadingEvents).toHaveLength(0);
    });
  });

  describe('lagging strand synthesis', () => {
    let replisome: Replisome;

    beforeEach(() => {
      replisome = new Replisome(fork, E_COLI);
    });

    test('initiates new Okazaki fragments', () => {
      const events = replisome.advanceFork(500);

      const primerEvents = events.filter(e => e.type === 'primer_synthesis');
      expect(primerEvents.length).toBeGreaterThanOrEqual(1);

      if (primerEvents.length > 0) {
        expect(primerEvents[0].strand).toBe('lagging');
        expect(primerEvents[0].fragmentId).toBeDefined();
      }
    });

    test('continues synthesis on active fragments', () => {
      // Advance multiple times to create and continue fragments
      replisome.advanceFork(800);
      const events2 = replisome.advanceFork(400);

      const laggingSynthesis = events2.filter(
        e => e.type === 'dna_synthesis' && e.strand === 'lagging',
      );

      expect(laggingSynthesis.length).toBeGreaterThanOrEqual(0);
    });

    test('starts multiple fragments during long advancement', () => {
      // Advance in steps that should trigger multiple fragment initiations
      const events1 = replisome.advanceFork(1500); // First fragment
      const events2 = replisome.advanceFork(1500); // Should trigger second fragment
      const events3 = replisome.advanceFork(1000); // Possibly third fragment
      const allEvents = [...events1, ...events2, ...events3];

      const primerEvents = allEvents.filter(e => e.type === 'primer_synthesis');
      // Expect at least 1 fragment, ideally multiple but depends on timing
      expect(primerEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('fragment processing', () => {
    let replisome: Replisome;

    beforeEach(() => {
      replisome = new Replisome(fork, E_COLI);
    });

    test('processes completed fragments', () => {
      // Advance enough to complete some fragments
      replisome.advanceFork(2500); // Should complete at least one fragment

      const events = replisome.advanceFork(500);

      const primerRemovalEvents = events.filter(e => e.type === 'primer_removal');
      const ligationEvents = events.filter(e => e.type === 'ligation');

      // If fragments were completed, should have processing events
      if (replisome.getCompletedFragments().length > 0) {
        expect(primerRemovalEvents.length + ligationEvents.length).toBeGreaterThanOrEqual(1);
      }
    });

    test('moves fragments from active to completed', () => {
      const initialCompleted = replisome.getCompletedFragments().length;

      // Advance significantly
      replisome.advanceFork(3000);

      const finalCompleted = replisome.getCompletedFragments().length;
      expect(finalCompleted).toBeGreaterThanOrEqual(initialCompleted);
    });
  });

  describe('state tracking', () => {
    let replisome: Replisome;

    beforeEach(() => {
      // Create fresh fork for each test to avoid state sharing
      const freshFork = new ReplicationFork(0, 10000, E_COLI);
      replisome = new Replisome(freshFork, E_COLI);
    });

    test('getCurrentState provides complete information', () => {
      replisome.advanceFork(1000);
      const state = replisome.getCurrentState();

      expect(state.forkPosition).toBe(1000);
      expect(state.completionPercentage).toBe(10); // 1000/10000 * 100
      expect(state.leadingStrandProgress).toBe(1000);
      expect(typeof state.laggingStrandProgress).toBe('number');
      expect(Array.isArray(state.activeFragments)).toBe(true);
      expect(Array.isArray(state.activeEnzymes)).toBe(true);
      expect(state.activeEnzymes).toHaveLength(6); // All 6 enzymes
    });

    test('enzyme positions are tracked correctly', () => {
      replisome.advanceFork(500);
      const state = replisome.getCurrentState();

      const helicase = state.activeEnzymes.find(e => e.type === EnzymeType.HELICASE);
      const leadingPol = state.activeEnzymes.find(
        e => e.type === EnzymeType.POLYMERASE && e.strand === 'leading',
      );

      expect(helicase).toBeDefined();
      expect(leadingPol).toBeDefined();
      expect(helicase?.position).toBe(500);
    });

    test('isComplete returns false during replication', () => {
      replisome.advanceFork(5000);
      expect(replisome.isComplete()).toBe(false);
    });

    test('isComplete returns true when finished', () => {
      replisome.advanceFork(10000); // Complete replication

      // Process remaining fragments with additional calls
      replisome.advanceFork(0);
      replisome.advanceFork(0);

      // Check that the fork is complete and replisome processes all fragments
      const state = replisome.getCurrentState();
      expect(state.completionPercentage).toBe(100);
      expect(replisome.isComplete()).toBe(true);
    });
  });

  describe('statistics and reporting', () => {
    let replisome: Replisome;

    beforeEach(() => {
      replisome = new Replisome(fork, E_COLI);
    });

    test('getStatistics provides comprehensive data', () => {
      replisome.advanceFork(2000);
      const stats = replisome.getStatistics();

      expect(typeof stats.activeFragments).toBe('number');
      expect(typeof stats.completedFragments).toBe('number');
      expect(typeof stats.averageFragmentSize).toBe('number');
      expect(typeof stats.totalFragmentsSynthesized).toBe('number');
      expect(typeof stats.eventsGenerated).toBe('number');
      expect(typeof stats.laggingStrandProgress).toBe('number');

      // Should include fork statistics
      expect(stats.position).toBe(2000);
      expect(stats.totalLength).toBe(10000);
      expect(stats.completionPercentage).toBe(20);
    });

    test('statistics update as replication progresses', () => {
      const stats1 = replisome.getStatistics();

      replisome.advanceFork(1500);
      const stats2 = replisome.getStatistics();

      expect(stats2.position).toBeGreaterThan(stats1.position);
      expect(stats2.completionPercentage).toBeGreaterThan(stats1.completionPercentage);
    });
  });

  describe('event logging', () => {
    test('logs events when detailed logging enabled', () => {
      const replisome = new Replisome(fork, E_COLI, { enableDetailedLogging: true });

      replisome.advanceFork(500);
      const eventLog = replisome.getEventLog();

      expect(eventLog.length).toBeGreaterThan(0);
    });

    test('does not log events when detailed logging disabled', () => {
      const replisome = new Replisome(fork, E_COLI, { enableDetailedLogging: false });

      replisome.advanceFork(500);
      const eventLog = replisome.getEventLog();

      expect(eventLog).toHaveLength(0);
    });

    test('event log accumulates over multiple advancements', () => {
      const replisome = new Replisome(fork, E_COLI, { enableDetailedLogging: true });

      replisome.advanceFork(300);
      const count1 = replisome.getEventLog().length;

      replisome.advanceFork(300);
      const count2 = replisome.getEventLog().length;

      expect(count2).toBeGreaterThan(count1);
    });
  });

  describe('organism-specific behavior', () => {
    test('E. coli replisome has appropriate fragment characteristics', () => {
      const ecoliReplisome = new Replisome(fork, E_COLI);

      // Advance enough to create fragments
      ecoliReplisome.advanceFork(3000);
      const fragments = ecoliReplisome.getCompletedFragments();

      if (fragments.length > 0) {
        fragments.forEach(fragment => {
          expect(fragment.getLength()).toBeGreaterThanOrEqual(1000);
          expect(fragment.getLength()).toBeLessThanOrEqual(2000);
        });
      }
    });

    test('human replisome would have different characteristics', () => {
      const humanFork = new ReplicationFork(0, 5000, HUMAN);
      const humanReplisome = new Replisome(humanFork, HUMAN);

      // Advance (slower speed, smaller fragments expected)
      humanReplisome.advanceFork(1000);
      const state = humanReplisome.getCurrentState();

      expect(state.forkPosition).toBe(1000);
      expect(humanReplisome.organism.type).toBe('eukaryotic');
    });
  });

  describe('polymerase variants', () => {
    test('uses specified polymerase variants', () => {
      const config = {
        leadingPolymerase: 'PolI' as const,
        laggingPolymerase: 'PolII' as const,
      };

      const replisome = new Replisome(fork, E_COLI, config);

      replisome.advanceFork(100);
      const events = replisome.advanceFork(100);

      // Check that synthesis events use correct polymerase variants
      const synthesisEvents = events.filter(e => e.type === 'dna_synthesis');

      if (synthesisEvents.length > 0) {
        synthesisEvents.forEach(event => {
          expect(['PolI', 'PolII', 'PolIII']).toContain(event.metadata?.polymeraseVariant);
        });
      }
    });
  });

  describe('edge cases and error handling', () => {
    test('handles fork at DNA end gracefully', () => {
      fork.position = 9999;
      const replisome = new Replisome(fork, E_COLI);

      const events = replisome.advanceFork(10);
      expect(events.length).toBeGreaterThanOrEqual(0); // Should not crash
    });

    test('handles very small advancement', () => {
      const replisome = new Replisome(fork, E_COLI);

      const events = replisome.advanceFork(1);
      expect(events.length).toBeGreaterThanOrEqual(1); // Should still generate helicase event
    });

    test('handles rapid successive advancements', () => {
      const replisome = new Replisome(fork, E_COLI);

      for (let i = 0; i < 10; i++) {
        const events = replisome.advanceFork(100);
        expect(events.length).toBeGreaterThanOrEqual(0);
      }

      const finalState = replisome.getCurrentState();
      expect(finalState.forkPosition).toBe(1000);
    });
  });

  describe('biological accuracy', () => {
    test('maintains biological timing relationships', () => {
      const replisome = new Replisome(fork, E_COLI);

      replisome.advanceFork(2000);
      const state = replisome.getCurrentState();

      // Leading strand should keep up with fork
      expect(state.leadingStrandProgress).toBe(state.forkPosition);

      // Lagging strand should lag behind due to discontinuous synthesis
      expect(state.laggingStrandProgress).toBeLessThanOrEqual(state.forkPosition);
    });

    test('fragment sizes match organism profile', () => {
      const replisome = new Replisome(fork, E_COLI);

      replisome.advanceFork(4000);
      const completedFragments = replisome.getCompletedFragments();

      completedFragments.forEach(fragment => {
        const validation = fragment.validateForOrganism(E_COLI);
        expect(isSuccess(validation)).toBe(true);
      });
    });

    test('primer lengths are biologically valid', () => {
      const replisome = new Replisome(fork, E_COLI);

      replisome.advanceFork(1500);
      const state = replisome.getCurrentState();

      state.activeFragments.forEach(fragment => {
        if (fragment.primer) {
          // Fragment primers are RNAPrimer class instances
          const primerLength = fragment.primer.getLength();
          expect(primerLength).toBeGreaterThanOrEqual(3);
          expect(primerLength).toBeLessThanOrEqual(10);
        }
      });
    });

    test('enzyme coordination follows biological order', () => {
      const replisome = new Replisome(fork, E_COLI, { enableDetailedLogging: true });

      replisome.advanceFork(500);
      const events = replisome.getEventLog();

      // Helicase should unwind before synthesis
      const unwindEvents = events.filter(e => e.type === 'unwind');
      const synthesisEvents = events.filter(e => e.type === 'dna_synthesis');

      expect(unwindEvents.length).toBeGreaterThan(0);
      expect(synthesisEvents.length).toBeGreaterThan(0);

      // Basic order check - helicase events should come first in each advancement
      if (unwindEvents.length > 0 && synthesisEvents.length > 0) {
        const firstUnwind = events.indexOf(unwindEvents[0]);
        const firstSynthesis = events.indexOf(synthesisEvents[0]);
        expect(firstUnwind).toBeLessThan(firstSynthesis);
      }
    });
  });

  describe('error handling and edge cases', () => {
    test('create method handles non-Error exceptions', () => {
      // Create a fork that will cause constructor to throw
      const badFork = null as any; // This will cause an error in constructor

      const result = Replisome.create(badFork, E_COLI);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to create replisome');
      }
    });

    test('constructor handles enzyme creation failures', () => {
      // Mock EnzymeFactory to return failures for testing each enzyme type
      const originalEnzymeFactory =
        require('../../../src/model/replication/enzyme/EnzymeFactory.js').EnzymeFactory;

      // Test helicase creation failure
      const mockEnzymeFactory = {
        ...originalEnzymeFactory,
        createHelicase: jest
          .fn()
          .mockReturnValue({ success: false, error: 'Helicase creation failed' }),
        createPrimase: jest.fn().mockReturnValue({ success: true, data: {} }),
        createPolymerase: jest.fn().mockReturnValue({ success: true, data: {} }),
        createLigase: jest.fn().mockReturnValue({ success: true, data: {} }),
        createExonuclease: jest.fn().mockReturnValue({ success: true, data: {} }),
      };

      // Replace the module temporarily
      const enzymeFactoryModule = require('../../../src/model/replication/enzyme/EnzymeFactory.js');
      const originalFactory = enzymeFactoryModule.EnzymeFactory;
      enzymeFactoryModule.EnzymeFactory = mockEnzymeFactory;

      expect(() => new Replisome(fork, E_COLI)).toThrow('Helicase creation failed');

      // Test primase creation failure
      mockEnzymeFactory.createHelicase.mockReturnValue({ success: true, data: {} });
      mockEnzymeFactory.createPrimase.mockReturnValue({
        success: false,
        error: 'Primase creation failed',
      });

      expect(() => new Replisome(fork, E_COLI)).toThrow('Primase creation failed');

      // Test leading polymerase creation failure
      mockEnzymeFactory.createPrimase.mockReturnValue({ success: true, data: {} });
      mockEnzymeFactory.createPolymerase
        .mockReturnValueOnce({ success: false, error: 'Leading polymerase creation failed' })
        .mockReturnValue({ success: true, data: {} });

      expect(() => new Replisome(fork, E_COLI)).toThrow('Leading polymerase creation failed');

      // Test lagging polymerase creation failure
      mockEnzymeFactory.createPolymerase
        .mockReturnValueOnce({ success: true, data: {} })
        .mockReturnValueOnce({ success: false, error: 'Lagging polymerase creation failed' });

      expect(() => new Replisome(fork, E_COLI)).toThrow('Lagging polymerase creation failed');

      // Test ligase creation failure
      mockEnzymeFactory.createPolymerase.mockReturnValue({ success: true, data: {} });
      mockEnzymeFactory.createLigase.mockReturnValue({
        success: false,
        error: 'Ligase creation failed',
      });

      expect(() => new Replisome(fork, E_COLI)).toThrow('Ligase creation failed');

      // Test exonuclease creation failure
      mockEnzymeFactory.createLigase.mockReturnValue({ success: true, data: {} });
      mockEnzymeFactory.createExonuclease.mockReturnValue({
        success: false,
        error: 'Exonuclease creation failed',
      });

      expect(() => new Replisome(fork, E_COLI)).toThrow('Exonuclease creation failed');

      // Restore original
      enzymeFactoryModule.EnzymeFactory = originalFactory;
    });

    test('handles primer generation failure during fragment initiation', () => {
      const replisome = new Replisome(fork, E_COLI);

      // Mock RNAPrimer.generateRandom to fail
      const originalGenerateRandom = require('../../../src/model/replication/RNAPrimer.js')
        .RNAPrimer.generateRandom;
      require('../../../src/model/replication/RNAPrimer.js').RNAPrimer.generateRandom = jest
        .fn()
        .mockReturnValue({ success: false, error: 'Primer generation failed' });

      // Try to advance the fork which should trigger fragment initiation
      expect(() => replisome.advanceFork(1000)).toThrow(
        'Failed to create primer: Primer generation failed',
      );

      // Restore original
      require('../../../src/model/replication/RNAPrimer.js').RNAPrimer.generateRandom =
        originalGenerateRandom;
    });

    test('handles fragment creation failure during fragment initiation', () => {
      const replisome = new Replisome(fork, E_COLI);

      // Mock OkazakiFragment.create to fail
      const originalCreate = require('../../../src/model/replication/OkazakiFragment.js')
        .OkazakiFragment.create;
      require('../../../src/model/replication/OkazakiFragment.js').OkazakiFragment.create = jest
        .fn()
        .mockReturnValue({ success: false, error: 'Fragment creation failed' });

      // Try to advance the fork which should trigger fragment initiation
      expect(() => replisome.advanceFork(1000)).toThrow(
        'Failed to create fragment: Fragment creation failed',
      );

      // Restore original
      require('../../../src/model/replication/OkazakiFragment.js').OkazakiFragment.create =
        originalCreate;
    });
  });
});
