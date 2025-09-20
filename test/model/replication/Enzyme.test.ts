import {
  Enzyme,
  Helicase,
  Primase,
  DNAPolymerase,
  DNALigase,
  Exonuclease,
  EnzymeFactory,
} from '../../../src/model/replication/Enzyme.js';
import { EnzymeType } from '../../../src/types/replication-types.js';
import { E_COLI, HUMAN } from '../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('Enzyme Abstract Base Class', () => {
  // Create a concrete implementation for testing
  class TestEnzyme extends Enzyme {
    constructor(position: number, isActive: boolean = true) {
      super(position, EnzymeType.HELICASE, isActive);
    }

    getSpeed(): number {
      return 100;
    }

    canOperate(): boolean {
      return true;
    }
  }

  describe('constructor', () => {
    test('creates enzyme with valid parameters', () => {
      const enzyme = new TestEnzyme(50);

      expect(enzyme.position).toBe(50);
      expect(enzyme.type).toBe(EnzymeType.HELICASE);
      expect(enzyme.isActive).toBe(true);
    });

    test('accepts inactive state', () => {
      const enzyme = new TestEnzyme(0, false);
      expect(enzyme.isActive).toBe(false);
    });

    test('throws error for negative position', () => {
      expect(() => new TestEnzyme(-1)).toThrow('Enzyme position must be non-negative: -1');
    });
  });

  describe('movement and positioning', () => {
    let enzyme: TestEnzyme;

    beforeEach(() => {
      enzyme = new TestEnzyme(100);
    });

    test('advance moves enzyme forward', () => {
      const newPosition = enzyme.advance(50);

      expect(newPosition).toBe(150);
      expect(enzyme.position).toBe(150);
    });

    test('advance throws error for negative distance', () => {
      expect(() => enzyme.advance(-10)).toThrow('Cannot advance by negative distance: -10');
    });

    test('moveTo sets specific position', () => {
      enzyme.moveTo(200);
      expect(enzyme.position).toBe(200);
    });

    test('moveTo throws error for negative position', () => {
      expect(() => enzyme.moveTo(-5)).toThrow('Position must be non-negative: -5');
    });
  });

  describe('state management', () => {
    test('setActive changes active state', () => {
      const enzyme = new TestEnzyme(0, true);

      enzyme.setActive(false);
      expect(enzyme.isActive).toBe(false);

      enzyme.setActive(true);
      expect(enzyme.isActive).toBe(true);
    });

    test('toString shows enzyme state', () => {
      const activeEnzyme = new TestEnzyme(50, true);
      expect(activeEnzyme.toString()).toContain('helicase(pos: 50, active)');

      const inactiveEnzyme = new TestEnzyme(25, false);
      expect(inactiveEnzyme.toString()).toContain('helicase(pos: 25, inactive)');
    });
  });
});

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

describe('EnzymeFactory', () => {
  describe('enzyme creation with validation', () => {
    test('createHelicase succeeds with valid position', () => {
      const result = EnzymeFactory.createHelicase(100);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Helicase);
        expect(result.data.position).toBe(100);
        expect(result.data.type).toBe(EnzymeType.HELICASE);
      }
    });

    test('createHelicase fails with invalid position', () => {
      const result = EnzymeFactory.createHelicase(-1);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to create helicase');
        expect(result.error).toContain('Enzyme position must be non-negative');
      }
    });

    test('createPrimase succeeds with valid position', () => {
      const result = EnzymeFactory.createPrimase(50);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Primase);
        expect(result.data.position).toBe(50);
        expect(result.data.type).toBe(EnzymeType.PRIMASE);
      }
    });

    test('createPolymerase succeeds with default variant', () => {
      const result = EnzymeFactory.createPolymerase(200);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(DNAPolymerase);
        expect(result.data.variant).toBe('PolIII');
        expect(result.data.position).toBe(200);
      }
    });

    test('createPolymerase succeeds with specified variant', () => {
      const result = EnzymeFactory.createPolymerase(150, 'PolI');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.variant).toBe('PolI');
      }
    });

    test('createLigase succeeds with valid position', () => {
      const result = EnzymeFactory.createLigase(300);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(DNALigase);
        expect(result.data.position).toBe(300);
        expect(result.data.type).toBe(EnzymeType.LIGASE);
      }
    });

    test('createExonuclease succeeds with valid position', () => {
      const result = EnzymeFactory.createExonuclease(400);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Exonuclease);
        expect(result.data.position).toBe(400);
        expect(result.data.type).toBe(EnzymeType.EXONUCLEASE);
      }
    });

    test('all factory methods fail with negative positions', () => {
      expect(isFailure(EnzymeFactory.createHelicase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createPrimase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createPolymerase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createLigase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createExonuclease(-1))).toBe(true);
    });
  });
});

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
      const _unwindEvent = helicase.unwind(50);
      expect(helicase.position).toBe(150);

      primase.moveTo(100);
      const primerEvent = primase.synthesizePrimer(5, 'lagging');
      expect(primerEvent.basePairsAdded).toBe(5);

      polymerase.moveTo(100);
      const _synthesisEvent = polymerase.synthesize(40, 'lagging');
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
