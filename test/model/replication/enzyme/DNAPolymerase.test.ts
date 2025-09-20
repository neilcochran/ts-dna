import { DNAPolymerase } from '../../../../src/model/replication/enzyme/DNAPolymerase.js';
import { EnzymeType } from '../../../../src/types/replication-types.js';
import { E_COLI, HUMAN } from '../../../../src/types/replication-types.js';

describe('DNAPolymerase', () => {
  describe('constructor and properties', () => {
    test('creates polymerase with default PolIII variant', () => {
      const polymerase = new DNAPolymerase(100);

      expect(polymerase.position).toBe(100);
      expect(polymerase.type).toBe(EnzymeType.POLYMERASE);
      expect(polymerase.variant).toBe('PolIII');
      expect(polymerase.isActive).toBe(true);
    });

    test('creates polymerase with specified variant', () => {
      const polI = new DNAPolymerase(0, 'PolI');
      const polII = new DNAPolymerase(0, 'PolII');

      expect(polI.variant).toBe('PolI');
      expect(polII.variant).toBe('PolII');
    });
  });

  describe('biological properties', () => {
    test('getSpeed varies by polymerase variant', () => {
      const polI = new DNAPolymerase(0, 'PolI');
      const polII = new DNAPolymerase(0, 'PolII');
      const polIII = new DNAPolymerase(0, 'PolIII');

      // PolI: 5% for primer removal/repair
      expect(polI.getSpeed(E_COLI)).toBe(50);
      expect(polI.getSpeed(HUMAN)).toBe(2.5);

      // PolII: 4% for repair
      expect(polII.getSpeed(E_COLI)).toBe(40);
      expect(polII.getSpeed(HUMAN)).toBe(2);

      // PolIII: Full speed for main replication
      expect(polIII.getSpeed(E_COLI)).toBe(1000);
      expect(polIII.getSpeed(HUMAN)).toBe(50);
    });

    test('canOperate returns true for valid positions', () => {
      const polymerase = new DNAPolymerase(0);

      expect(polymerase.canOperate(0)).toBe(true);
      expect(polymerase.canOperate(1000)).toBe(true);
    });
  });

  describe('DNA synthesis', () => {
    test('synthesize advances polymerase and generates event', () => {
      const polymerase = new DNAPolymerase(300, 'PolIII');
      const event = polymerase.synthesize(100, 'leading');

      expect(polymerase.position).toBe(400);
      expect(event.type).toBe('dna_synthesis');
      expect(event.position).toBe(300);
      expect(event.enzyme).toBe(EnzymeType.POLYMERASE);
      expect(event.strand).toBe('leading');
      expect(event.basePairsAdded).toBe(100);
      expect(event.metadata?.polymeraseVariant).toBe('PolIII');
      expect(event.metadata?.endPosition).toBe(400);
    });

    test('synthesize validates positive base pairs', () => {
      const polymerase = new DNAPolymerase(0);

      expect(() => polymerase.synthesize(0, 'leading')).toThrow('Invalid synthesis length: 0');

      expect(() => polymerase.synthesize(-5, 'leading')).toThrow('Invalid synthesis length: -5');
    });
  });

  describe('proofreading', () => {
    test('proofread generates correct event', () => {
      const polymerase = new DNAPolymerase(150, 'PolI');
      const event = polymerase.proofread('lagging');

      expect(event.type).toBe('proofreading');
      expect(event.position).toBe(150);
      expect(event.enzyme).toBe(EnzymeType.POLYMERASE);
      expect(event.strand).toBe('lagging');
      expect(event.metadata?.polymeraseVariant).toBe('PolI');
    });
  });
});