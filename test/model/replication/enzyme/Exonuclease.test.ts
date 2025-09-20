import { Exonuclease } from '../../../../src/model/replication/enzyme/Exonuclease.js';
import { EnzymeType } from '../../../../src/types/replication-types.js';
import { E_COLI, HUMAN } from '../../../../src/types/replication-types.js';

describe('Exonuclease', () => {
  describe('constructor and properties', () => {
    test('creates exonuclease with correct type', () => {
      const exonuclease = new Exonuclease(125);

      expect(exonuclease.position).toBe(125);
      expect(exonuclease.type).toBe(EnzymeType.EXONUCLEASE);
      expect(exonuclease.isActive).toBe(true);
    });
  });

  describe('biological properties', () => {
    test('getSpeed is 10% of polymerase speed', () => {
      const exonuclease = new Exonuclease(0);

      expect(exonuclease.getSpeed(E_COLI)).toBe(100); // 10% of 1000
      expect(exonuclease.getSpeed(HUMAN)).toBe(5); // 10% of 50
    });

    test('canOperate returns true for valid positions', () => {
      const exonuclease = new Exonuclease(0);

      expect(exonuclease.canOperate(0)).toBe(true);
      expect(exonuclease.canOperate(300)).toBe(true);
    });
  });

  describe('primer removal', () => {
    test('removePrimer generates correct event', () => {
      const exonuclease = new Exonuclease(250);
      const event = exonuclease.removePrimer(5, 'okazaki_42');

      expect(event.type).toBe('primer_removal');
      expect(event.position).toBe(250);
      expect(event.enzyme).toBe(EnzymeType.EXONUCLEASE);
      expect(event.strand).toBe('lagging');
      expect(event.fragmentId).toBe('okazaki_42');
      expect(event.basePairsAdded).toBe(-5); // Negative because removed
      expect(event.metadata?.primerLength).toBe(5);
      expect(event.metadata?.removalSite).toBe(250);
    });
  });
});
