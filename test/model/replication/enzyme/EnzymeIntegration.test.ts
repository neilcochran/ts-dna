import {
  Helicase,
  Primase,
  DNAPolymerase,
  DNALigase,
  Exonuclease,
} from '../../../../src/model/replication/enzyme/index.js';
import { E_COLI } from '../../../../src/types/replication-types.js';

describe('Enzyme Integration', () => {
  describe('enzyme coordination', () => {
    test('enzymes can work together in sequence', () => {
      const helicase = new Helicase(0);
      const primase = new Primase(0);
      const polymerase = new DNAPolymerase(0, 'PolIII');
      const ligase = new DNALigase(0);
      const exonuclease = new Exonuclease(0);

      // Simulate coordinated enzyme activity
      helicase.moveTo(100);
      helicase.unwind(50);
      expect(helicase.position).toBe(150);

      primase.moveTo(100);
      const primerEvent = primase.synthesizePrimer(5, 'lagging');
      expect(primerEvent.basePairsAdded).toBe(5);

      polymerase.moveTo(100);
      polymerase.synthesize(40, 'lagging');
      expect(polymerase.position).toBe(140);

      exonuclease.moveTo(100);
      const removalEvent = exonuclease.removePrimer(5, 'frag1');
      expect(removalEvent.basePairsAdded).toBe(-5);

      ligase.moveTo(140);
      const ligationEvent = ligase.ligate('frag1');
      expect(ligationEvent.type).toBe('ligation');
    });
  });

  describe('biological accuracy', () => {
    test('enzyme speeds reflect biological hierarchy', () => {
      const helicase = new Helicase(0);
      const primase = new Primase(0);
      const polI = new DNAPolymerase(0, 'PolI');
      const polIII = new DNAPolymerase(0, 'PolIII');
      const ligase = new DNALigase(0);
      const exonuclease = new Exonuclease(0);

      // For E. coli
      expect(polIII.getSpeed(E_COLI)).toBe(1000); // Fastest - main replication
      expect(helicase.getSpeed(E_COLI)).toBe(1000); // Matches main polymerase
      expect(ligase.getSpeed(E_COLI)).toBe(2000); // Fast ligation
      expect(primase.getSpeed(E_COLI)).toBe(100); // Slower - RNA synthesis
      expect(exonuclease.getSpeed(E_COLI)).toBe(100); // Similar to primase
      expect(polI.getSpeed(E_COLI)).toBe(50); // Slowest - repair/processing
    });

    test('enzyme positions advance correctly', () => {
      const polymerase = new DNAPolymerase(100, 'PolIII');

      // Multiple synthesis events
      polymerase.synthesize(50, 'leading');
      expect(polymerase.position).toBe(150);

      polymerase.synthesize(25, 'leading');
      expect(polymerase.position).toBe(175);

      // Enzyme can be repositioned
      polymerase.moveTo(200);
      expect(polymerase.position).toBe(200);
    });
  });
});
