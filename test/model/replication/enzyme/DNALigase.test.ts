import { DNALigase } from '../../../../src/model/replication/enzyme/DNALigase.js';
import { EnzymeType } from '../../../../src/types/replication-types.js';
import { E_COLI, HUMAN } from '../../../../src/types/replication-types.js';

describe('DNALigase', () => {
  describe('constructor and properties', () => {
    test('creates ligase with correct type', () => {
      const ligase = new DNALigase(75);

      expect(ligase.position).toBe(75);
      expect(ligase.type).toBe(EnzymeType.LIGASE);
      expect(ligase.isActive).toBe(true);
    });
  });

  describe('biological properties', () => {
    test('getSpeed is 2x polymerase speed for fast ligation', () => {
      const ligase = new DNALigase(0);

      expect(ligase.getSpeed(E_COLI)).toBe(2000); // 2x 1000
      expect(ligase.getSpeed(HUMAN)).toBe(100); // 2x 50
    });

    test('canOperate returns true for valid positions', () => {
      const ligase = new DNALigase(0);

      expect(ligase.canOperate(0)).toBe(true);
      expect(ligase.canOperate(500)).toBe(true);
    });
  });

  describe('ligation activity', () => {
    test('ligate generates correct event', () => {
      const ligase = new DNALigase(400);
      const event = ligase.ligate('fragment_123');

      expect(event.type).toBe('ligation');
      expect(event.position).toBe(400);
      expect(event.enzyme).toBe(EnzymeType.LIGASE);
      expect(event.strand).toBe('lagging');
      expect(event.fragmentId).toBe('fragment_123');
      expect(event.metadata?.ligationSite).toBe(400);
    });
  });
});
