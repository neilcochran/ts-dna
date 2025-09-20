import { Primase } from '../../../../src/model/replication/enzyme/Primase.js';
import { EnzymeType } from '../../../../src/types/replication-types.js';
import { E_COLI, HUMAN } from '../../../../src/types/replication-types.js';

describe('Primase', () => {
  describe('constructor and properties', () => {
    test('creates primase with correct type', () => {
      const primase = new Primase(50);

      expect(primase.position).toBe(50);
      expect(primase.type).toBe(EnzymeType.PRIMASE);
      expect(primase.isActive).toBe(true);
    });
  });

  describe('biological properties', () => {
    test('getSpeed is 10% of polymerase speed', () => {
      const primase = new Primase(0);

      expect(primase.getSpeed(E_COLI)).toBe(100); // 10% of 1000
      expect(primase.getSpeed(HUMAN)).toBe(5); // 10% of 50
    });

    test('canOperate returns true for valid positions', () => {
      const primase = new Primase(0);

      expect(primase.canOperate(0)).toBe(true);
      expect(primase.canOperate(500)).toBe(true);
    });
  });

  describe('primer synthesis', () => {
    test('synthesizePrimer generates valid event', () => {
      const primase = new Primase(200);
      const event = primase.synthesizePrimer(5, 'lagging');

      expect(event.type).toBe('primer_synthesis');
      expect(event.position).toBe(200);
      expect(event.enzyme).toBe(EnzymeType.PRIMASE);
      expect(event.strand).toBe('lagging');
      expect(event.basePairsAdded).toBe(5);
      expect(event.metadata?.primerLength).toBe(5);
    });

    test('synthesizePrimer validates primer length', () => {
      const primase = new Primase(0);

      expect(() => primase.synthesizePrimer(2, 'leading')).toThrow(
        'Invalid primer length: 2. Must be 3-10 nucleotides',
      );

      expect(() => primase.synthesizePrimer(11, 'leading')).toThrow(
        'Invalid primer length: 11. Must be 3-10 nucleotides',
      );

      // Valid lengths should not throw
      expect(() => primase.synthesizePrimer(3, 'leading')).not.toThrow();
      expect(() => primase.synthesizePrimer(10, 'leading')).not.toThrow();
    });
  });
});
