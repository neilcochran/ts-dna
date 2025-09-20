import { LeadingStrandSynthesis } from '../../../src/utils/replication/LeadingStrandSynthesis.js';
import { E_COLI, HUMAN } from '../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('LeadingStrandSynthesis', () => {
  let leadingSynthesis: LeadingStrandSynthesis;

  beforeEach(() => {
    leadingSynthesis = new LeadingStrandSynthesis(E_COLI, 0);
  });

  describe('constructor', () => {
    test('creates leading strand synthesis with E. coli parameters', () => {
      expect(leadingSynthesis).toBeInstanceOf(LeadingStrandSynthesis);
      expect(leadingSynthesis.getCurrentPosition()).toBe(0);
      expect(leadingSynthesis.getSynthesizedLength()).toBe(0);
      expect(leadingSynthesis.isSynthesizing()).toBe(false);
    });

    test('creates leading strand synthesis with human parameters', () => {
      const humanSynthesis = new LeadingStrandSynthesis(HUMAN, 100);
      expect(humanSynthesis.getCurrentPosition()).toBe(100);
      expect(humanSynthesis.getSpeed()).toBe(HUMAN.polymeraseSpeed);
    });
  });

  describe('initiateSynthesis', () => {
    test('successfully initiates synthesis at valid position', () => {
      const result = leadingSynthesis.initiateSynthesis(0);

      expect(isSuccess(result)).toBe(true);
      expect(leadingSynthesis.isSynthesizing()).toBe(true);
      expect(leadingSynthesis.getCurrentPosition()).toBe(0);
    });

    test('successfully initiates synthesis at non-zero position', () => {
      const result = leadingSynthesis.initiateSynthesis(100);

      expect(isSuccess(result)).toBe(true);
      expect(leadingSynthesis.isSynthesizing()).toBe(true);
      expect(leadingSynthesis.getCurrentPosition()).toBe(100);
    });

    test('fails with negative primer position', () => {
      const result = leadingSynthesis.initiateSynthesis(-10);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid primer position');
      }
      expect(leadingSynthesis.isSynthesizing()).toBe(false);
    });
  });

  describe('advance', () => {
    beforeEach(() => {
      leadingSynthesis.initiateSynthesis(0);
    });

    test('advances synthesis and generates events', () => {
      const events = leadingSynthesis.advance(100);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('dna_synthesis');
      expect(events[0].strand).toBe('leading');
      expect(events[0].basePairsAdded).toBe(100);
      expect(leadingSynthesis.getSynthesizedLength()).toBe(100);
      expect(leadingSynthesis.getCurrentPosition()).toBe(100);
    });

    test('generates proofreading event for large synthesis', () => {
      const events = leadingSynthesis.advance(600); // Above proofreading threshold

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('dna_synthesis');
      expect(events[1].type).toBe('proofreading');
      expect(leadingSynthesis.getSynthesizedLength()).toBe(600);
    });

    test('does not generate proofreading for small synthesis', () => {
      const events = leadingSynthesis.advance(100); // Below threshold

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('dna_synthesis');
    });

    test('returns empty array when not active', () => {
      leadingSynthesis.stopSynthesis();
      const events = leadingSynthesis.advance(100);

      expect(events).toHaveLength(0);
    });

    test('returns empty array for zero or negative base pairs', () => {
      expect(leadingSynthesis.advance(0)).toHaveLength(0);
      expect(leadingSynthesis.advance(-10)).toHaveLength(0);
    });

    test('accumulates synthesized length over multiple advances', () => {
      leadingSynthesis.advance(100);
      leadingSynthesis.advance(200);
      leadingSynthesis.advance(50);

      expect(leadingSynthesis.getSynthesizedLength()).toBe(350);
      expect(leadingSynthesis.getCurrentPosition()).toBe(350);
    });
  });

  describe('getSpeed', () => {
    test('returns correct speed for E. coli', () => {
      expect(leadingSynthesis.getSpeed()).toBe(E_COLI.polymeraseSpeed);
    });

    test('returns correct speed for human', () => {
      const humanSynthesis = new LeadingStrandSynthesis(HUMAN, 0);
      expect(humanSynthesis.getSpeed()).toBe(HUMAN.polymeraseSpeed);
    });
  });

  describe('getProgress', () => {
    beforeEach(() => {
      leadingSynthesis.initiateSynthesis(0);
    });

    test('calculates progress correctly', () => {
      leadingSynthesis.advance(250);

      expect(leadingSynthesis.getProgress(1000)).toBe(25);
      expect(leadingSynthesis.getProgress(500)).toBe(50);
    });

    test('handles completion correctly', () => {
      leadingSynthesis.advance(1000);

      expect(leadingSynthesis.getProgress(1000)).toBe(100);
      expect(leadingSynthesis.getProgress(500)).toBe(100); // Capped at 100%
    });

    test('handles zero total length', () => {
      expect(leadingSynthesis.getProgress(0)).toBe(100);
    });

    test('handles negative total length', () => {
      expect(leadingSynthesis.getProgress(-100)).toBe(100);
    });
  });

  describe('stopSynthesis', () => {
    test('stops active synthesis', () => {
      leadingSynthesis.initiateSynthesis(0);
      expect(leadingSynthesis.isSynthesizing()).toBe(true);

      leadingSynthesis.stopSynthesis();
      expect(leadingSynthesis.isSynthesizing()).toBe(false);

      // Should not advance after stopping
      const events = leadingSynthesis.advance(100);
      expect(events).toHaveLength(0);
    });
  });

  describe('getState', () => {
    test('returns correct state information', () => {
      leadingSynthesis.initiateSynthesis(50);
      leadingSynthesis.advance(200);

      const state = leadingSynthesis.getState();

      expect(state.position).toBe(250);
      expect(state.synthesizedLength).toBe(200);
      expect(state.isActive).toBe(true);
      expect(state.speed).toBe(E_COLI.polymeraseSpeed);
    });

    test('returns correct state when inactive', () => {
      const state = leadingSynthesis.getState();

      expect(state.position).toBe(0);
      expect(state.synthesizedLength).toBe(0);
      expect(state.isActive).toBe(false);
      expect(state.speed).toBe(E_COLI.polymeraseSpeed);
    });
  });

  describe('organism-specific behavior', () => {
    test('E. coli synthesis has correct speed characteristics', () => {
      expect(leadingSynthesis.getSpeed()).toBe(1000); // E. coli speed
    });

    test('Human synthesis has correct speed characteristics', () => {
      const humanSynthesis = new LeadingStrandSynthesis(HUMAN, 0);
      expect(humanSynthesis.getSpeed()).toBe(50); // Human speed
    });
  });

  describe('biological accuracy', () => {
    beforeEach(() => {
      leadingSynthesis.initiateSynthesis(0);
    });

    test('synthesis events have correct biological properties', () => {
      const events = leadingSynthesis.advance(100);
      const synthesisEvent = events[0];

      expect(synthesisEvent.enzyme).toBe('polymerase');
      expect(synthesisEvent.strand).toBe('leading');
      expect(synthesisEvent.position).toBe(0);
      expect(synthesisEvent.basePairsAdded).toBe(100);
      expect(synthesisEvent.metadata?.polymeraseVariant).toBe('PolIII');
    });

    test('proofreading events have correct properties', () => {
      const events = leadingSynthesis.advance(600);
      const proofreadEvent = events[1];

      expect(proofreadEvent.type).toBe('proofreading');
      expect(proofreadEvent.enzyme).toBe('polymerase');
      expect(proofreadEvent.strand).toBe('leading');
      expect(proofreadEvent.metadata?.polymeraseVariant).toBe('PolIII');
    });
  });
});
