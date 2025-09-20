import { OkazakiFragment } from '../../../src/model/replication/OkazakiFragment.js';
import { RNAPrimer } from '../../../src/model/replication/RNAPrimer.js';
import { E_COLI, HUMAN } from '../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('OkazakiFragment', () => {
  let testPrimer: RNAPrimer;

  beforeEach(() => {
    testPrimer = new RNAPrimer('AUGC', 100);
  });

  describe('constructor', () => {
    test('creates valid fragment with correct parameters', () => {
      const fragment = new OkazakiFragment('frag_1', 100, 200, testPrimer);

      expect(fragment.id).toBe('frag_1');
      expect(fragment.startPosition).toBe(100);
      expect(fragment.endPosition).toBe(200);
      expect(fragment.primer).toBe(testPrimer);
      expect(fragment.isPrimerRemoved).toBe(false);
      expect(fragment.isLigated).toBe(false);
      expect(fragment.getLength()).toBe(100);
    });

    test('accepts minimum fragment size (10 bp)', () => {
      const fragment = new OkazakiFragment('min', 0, 10, testPrimer);
      expect(fragment.getLength()).toBe(10);
    });

    test('accepts maximum fragment size (10000 bp)', () => {
      const fragment = new OkazakiFragment('max', 0, 10000, testPrimer);
      expect(fragment.getLength()).toBe(10000);
    });

    test('throws error for fragment too short', () => {
      expect(() => new OkazakiFragment('short', 0, 5, testPrimer)).toThrow(
        'Fragment too short: 5 bp. Minimum: 10 bp',
      );
    });

    test('throws error for fragment too long', () => {
      expect(() => new OkazakiFragment('long', 0, 15000, testPrimer)).toThrow(
        'Fragment too long: 15000 bp. Maximum: 10000 bp',
      );
    });

    test('throws error for invalid positions', () => {
      expect(() => new OkazakiFragment('invalid', -1, 100, testPrimer)).toThrow(
        'Start position must be non-negative',
      );

      expect(() => new OkazakiFragment('invalid', 100, 100, testPrimer)).toThrow(
        'End position (100) must be greater than start position (100)',
      );

      expect(() => new OkazakiFragment('invalid', 200, 100, testPrimer)).toThrow(
        'End position (100) must be greater than start position (200)',
      );
    });
  });

  describe('create static method', () => {
    test('successfully creates valid fragment', () => {
      const result = OkazakiFragment.create('test', 50, 150, testPrimer);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.id).toBe('test');
        expect(result.data.startPosition).toBe(50);
        expect(result.data.endPosition).toBe(150);
        expect(result.data.getLength()).toBe(100);
      }
    });

    test('fails for empty ID', () => {
      const result = OkazakiFragment.create('', 0, 100, testPrimer);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Fragment ID cannot be empty');
      }
    });

    test('fails for whitespace-only ID', () => {
      const result = OkazakiFragment.create('   ', 0, 100, testPrimer);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Fragment ID cannot be empty');
      }
    });

    test('fails for invalid positions', () => {
      const result1 = OkazakiFragment.create('test', -1, 100, testPrimer);
      expect(isFailure(result1)).toBe(true);
      if (isFailure(result1)) {
        expect(result1.error).toContain('Start position must be non-negative');
      }

      const result2 = OkazakiFragment.create('test', 100, 50, testPrimer);
      expect(isFailure(result2)).toBe(true);
      if (isFailure(result2)) {
        expect(result2.error).toContain(
          'End position (50) must be greater than start position (100)',
        );
      }
    });

    test('fails for invalid fragment size', () => {
      const result1 = OkazakiFragment.create('test', 0, 5, testPrimer);
      expect(isFailure(result1)).toBe(true);
      if (isFailure(result1)) {
        expect(result1.error).toContain('Fragment too short: 5 bp');
      }

      const result2 = OkazakiFragment.create('test', 0, 15000, testPrimer);
      expect(isFailure(result2)).toBe(true);
      if (isFailure(result2)) {
        expect(result2.error).toContain('Fragment too long: 15000 bp');
      }
    });
  });

  describe('processing state management', () => {
    let fragment: OkazakiFragment;

    beforeEach(() => {
      fragment = new OkazakiFragment('proc_test', 100, 200, testPrimer);
    });

    test('initial state is not complete', () => {
      expect(fragment.isComplete()).toBe(false);
      expect(fragment.needsProcessing()).toBe(true);
    });

    test('removePrimer marks primer as removed', () => {
      expect(fragment.isPrimerRemoved).toBe(false);
      expect(testPrimer.isRemoved).toBe(false);

      fragment.removePrimer();

      expect(fragment.isPrimerRemoved).toBe(true);
      expect(testPrimer.isRemoved).toBe(true);
    });

    test('ligate marks fragment as ligated', () => {
      expect(fragment.isLigated).toBe(false);

      fragment.ligate();

      expect(fragment.isLigated).toBe(true);
    });

    test('fragment is complete when both primer removed and ligated', () => {
      expect(fragment.isComplete()).toBe(false);

      fragment.removePrimer();
      expect(fragment.isComplete()).toBe(false);

      fragment.ligate();
      expect(fragment.isComplete()).toBe(true);
      expect(fragment.needsProcessing()).toBe(false);
    });

    test('getProcessingStatus returns correct status', () => {
      let status = fragment.getProcessingStatus();
      expect(status.primerRemoved).toBe(false);
      expect(status.ligated).toBe(false);
      expect(status.complete).toBe(false);
      expect(status.nextStep).toBe('remove_primer');

      fragment.removePrimer();
      status = fragment.getProcessingStatus();
      expect(status.primerRemoved).toBe(true);
      expect(status.ligated).toBe(false);
      expect(status.complete).toBe(false);
      expect(status.nextStep).toBe('ligate');

      fragment.ligate();
      status = fragment.getProcessingStatus();
      expect(status.primerRemoved).toBe(true);
      expect(status.ligated).toBe(true);
      expect(status.complete).toBe(true);
      expect(status.nextStep).toBe(null);
    });
  });

  describe('sequence management', () => {
    let fragment: OkazakiFragment;

    beforeEach(() => {
      fragment = new OkazakiFragment('seq_test', 0, 100, testPrimer);
    });

    test('initially has no sequence', () => {
      expect(fragment.getSequence()).toBeUndefined();
      expect(fragment.getDNA()).toBeUndefined();
    });

    test('setSequence accepts correct length sequence', () => {
      const sequence = 'A'.repeat(100);
      fragment.setSequence(sequence);

      expect(fragment.getSequence()).toBe(sequence);
      expect(fragment.getDNA()).toBeDefined();
      expect(fragment.getDNA()?.getSequence()).toBe(sequence);
    });

    test('setSequence throws error for wrong length', () => {
      expect(() => fragment.setSequence('ATGC')).toThrow(
        "Sequence length (4) doesn't match fragment length (100)",
      );

      expect(() => fragment.setSequence('A'.repeat(200))).toThrow(
        "Sequence length (200) doesn't match fragment length (100)",
      );
    });
  });

  describe('fragment relationships', () => {
    test('overlapsWith detects overlapping fragments', () => {
      const frag1 = new OkazakiFragment('f1', 100, 200, testPrimer);
      const frag2 = new OkazakiFragment('f2', 150, 250, testPrimer);
      const frag3 = new OkazakiFragment('f3', 300, 400, testPrimer);

      expect(frag1.overlapsWith(frag2)).toBe(true);
      expect(frag2.overlapsWith(frag1)).toBe(true);
      expect(frag1.overlapsWith(frag3)).toBe(false);
      expect(frag3.overlapsWith(frag1)).toBe(false);
    });

    test('isAdjacentTo detects adjacent fragments', () => {
      const frag1 = new OkazakiFragment('f1', 100, 200, testPrimer);
      const frag2 = new OkazakiFragment('f2', 200, 300, testPrimer);
      const frag3 = new OkazakiFragment('f3', 350, 450, testPrimer);

      expect(frag1.isAdjacentTo(frag2)).toBe(true);
      expect(frag2.isAdjacentTo(frag1)).toBe(false);
      expect(frag1.isAdjacentTo(frag3)).toBe(false);
    });
  });

  describe('organism validation', () => {
    test('validates E. coli fragment sizes', () => {
      const validFragment = new OkazakiFragment('ecoli_valid', 0, 1500, testPrimer);
      const result = validFragment.validateForOrganism(E_COLI);

      expect(isSuccess(result)).toBe(true);
    });

    test('validates human fragment sizes', () => {
      const validFragment = new OkazakiFragment('human_valid', 0, 150, testPrimer);
      const result = validFragment.validateForOrganism(HUMAN);

      expect(isSuccess(result)).toBe(true);
    });

    test('rejects fragments outside organism range', () => {
      const tooSmallForEColi = new OkazakiFragment('small', 0, 500, testPrimer);
      const result1 = tooSmallForEColi.validateForOrganism(E_COLI);

      expect(isFailure(result1)).toBe(true);
      if (isFailure(result1)) {
        expect(result1.error).toContain(
          'Fragment length (500) outside expected range for prokaryotic: 1000-2000 bp',
        );
      }

      const tooBigForHuman = new OkazakiFragment('big', 0, 500, testPrimer);
      const result2 = tooBigForHuman.validateForOrganism(HUMAN);

      expect(isFailure(result2)).toBe(true);
      if (isFailure(result2)) {
        expect(result2.error).toContain(
          'Fragment length (500) outside expected range for eukaryotic: 100-200 bp',
        );
      }
    });
  });

  describe('generateRandom static method', () => {
    test('generates fragment within E. coli constraints', () => {
      const result = OkazakiFragment.generateRandom('ecoli_rand', 1000, E_COLI);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const fragment = result.data;
        expect(fragment.startPosition).toBe(1000);
        expect(fragment.getLength()).toBeGreaterThanOrEqual(1000);
        expect(fragment.getLength()).toBeLessThanOrEqual(2000);

        const validation = fragment.validateForOrganism(E_COLI);
        expect(isSuccess(validation)).toBe(true);
      }
    });

    test('generates fragment within human constraints', () => {
      const result = OkazakiFragment.generateRandom('human_rand', 500, HUMAN);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const fragment = result.data;
        expect(fragment.startPosition).toBe(500);
        expect(fragment.getLength()).toBeGreaterThanOrEqual(100);
        expect(fragment.getLength()).toBeLessThanOrEqual(200);

        const validation = fragment.validateForOrganism(HUMAN);
        expect(isSuccess(validation)).toBe(true);
      }
    });

    test('generates different fragments on multiple calls', () => {
      const results = Array.from({ length: 10 }, (_, i) =>
        OkazakiFragment.generateRandom(`rand_${i}`, 0, E_COLI),
      );

      const fragments = results.filter(isSuccess).map(r => r.data);

      expect(fragments.length).toBe(10);

      // Should have some variety in fragment sizes
      const lengths = fragments.map(f => f.getLength());
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBeGreaterThan(1);
    });

    test('primer length matches organism constraints', () => {
      const result = OkazakiFragment.generateRandom('primer_test', 0, HUMAN);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const primerLength = result.data.primer.getLength();
        expect(primerLength).toBeGreaterThanOrEqual(3);
        expect(primerLength).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('toString method', () => {
    test('shows correct representation for processing fragment', () => {
      const fragment = new OkazakiFragment('test_frag', 100, 300, testPrimer);
      const str = fragment.toString();

      expect(str).toContain('test_frag');
      expect(str).toContain('100-300');
      expect(str).toContain('200bp');
      expect(str).toContain('processing');
    });

    test('shows correct representation for completed fragment', () => {
      const fragment = new OkazakiFragment('complete_frag', 50, 150, testPrimer);
      fragment.removePrimer();
      fragment.ligate();

      const str = fragment.toString();
      expect(str).toContain('complete_frag');
      expect(str).toContain('50-150');
      expect(str).toContain('100bp');
      expect(str).toContain('complete');
    });
  });

  describe('biological constraints', () => {
    test('fragment sizes match biological research', () => {
      // Test prokaryotic range (1000-2000 bp)
      expect(() => new OkazakiFragment('prokaryotic_min', 0, 1000, testPrimer)).not.toThrow();
      expect(() => new OkazakiFragment('prokaryotic_max', 0, 2000, testPrimer)).not.toThrow();

      // Test eukaryotic range (100-200 bp)
      expect(() => new OkazakiFragment('eukaryotic_min', 0, 100, testPrimer)).not.toThrow();
      expect(() => new OkazakiFragment('eukaryotic_max', 0, 200, testPrimer)).not.toThrow();
    });

    test('enforces minimum biological fragment size', () => {
      // Fragments smaller than 10 bp are not biologically realistic
      expect(() => new OkazakiFragment('too_small', 0, 9, testPrimer)).toThrow();
    });

    test('enforces maximum reasonable fragment size', () => {
      // Fragments larger than 10 kb are extremely rare
      expect(() => new OkazakiFragment('too_large', 0, 10001, testPrimer)).toThrow();
    });

    test('primer position matches fragment start', () => {
      const fragment = new OkazakiFragment('pos_test', 250, 350, testPrimer);
      expect(fragment.primer.position).toBe(100); // testPrimer position
      expect(fragment.startPosition).toBe(250);
    });
  });
});
