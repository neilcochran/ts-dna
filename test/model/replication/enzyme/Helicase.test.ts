import { Helicase } from '../../../../src/model/replication/enzyme/Helicase.js';
import { EnzymeType } from '../../../../src/types/replication-types.js';
import { E_COLI, HUMAN } from '../../../../src/types/replication-types.js';

describe('Helicase', () => {
  describe('constructor and properties', () => {
    test('creates helicase with correct type', () => {
      const helicase = new Helicase(100);

      expect(helicase.position).toBe(100);
      expect(helicase.type).toBe(EnzymeType.HELICASE);
      expect(helicase.isActive).toBe(true);
    });
  });

  describe('biological properties', () => {
    test('getSpeed matches polymerase speed for organism', () => {
      const helicase = new Helicase(0);

      expect(helicase.getSpeed(E_COLI)).toBe(1000);
      expect(helicase.getSpeed(HUMAN)).toBe(50);
    });

    test('canOperate returns true for valid positions', () => {
      const helicase = new Helicase(0);

      expect(helicase.canOperate(0)).toBe(true);
      expect(helicase.canOperate(1000)).toBe(true);
      expect(helicase.canOperate(-1)).toBe(false);
    });
  });

  describe('unwind activity', () => {
    test('unwind advances helicase and generates event', () => {
      const helicase = new Helicase(100);
      const event = helicase.unwind(50);

      expect(helicase.position).toBe(150);
      expect(event.type).toBe('unwind');
      expect(event.position).toBe(100);
      expect(event.enzyme).toBe(EnzymeType.HELICASE);
      expect(event.strand).toBe('leading');
      expect(event.basePairsAdded).toBe(50);
      expect(event.metadata?.endPosition).toBe(150);
    });
  });
});