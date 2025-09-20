import { Enzyme } from '../../../../src/model/replication/enzyme/Enzyme.js';
import { EnzymeType } from '../../../../src/types/replication-types.js';

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
