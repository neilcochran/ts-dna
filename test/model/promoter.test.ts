import { Promoter } from '../../src/model/Promoter';
import { PromoterElement } from '../../src/model/PromoterElement';
import { NucleotidePattern } from '../../src/model/nucleic-acids/NucleotidePattern';
import {
  TATA_BOX_TYPICAL_POSITION,
  DPE_TYPICAL_POSITION,
} from '../../src/constants/biological-constants';

describe('Promoter', () => {
  let tataElement: PromoterElement;
  let inrElement: PromoterElement;
  let dpeElement: PromoterElement;
  let caatElement: PromoterElement;

  beforeEach(() => {
    tataElement = new PromoterElement(
      'TATA',
      new NucleotidePattern('TATAWAR'),
      TATA_BOX_TYPICAL_POSITION,
    );
    inrElement = new PromoterElement('Inr', new NucleotidePattern('YYANWYY'), 0);
    dpeElement = new PromoterElement('DPE', new NucleotidePattern('RGWYV'), DPE_TYPICAL_POSITION);
    caatElement = new PromoterElement('CAAT', new NucleotidePattern('GGCCAATCT'), -75);
  });

  describe('constructor', () => {
    test('creates valid promoter with single element', () => {
      const promoter = new Promoter(1000, [tataElement]);

      expect(promoter.transcriptionStartSite).toBe(1000);
      expect(promoter.elements).toHaveLength(1);
      expect(promoter.elements[0]).toBe(tataElement);
      expect(promoter.name).toBeUndefined();
    });

    test('creates promoter with multiple elements', () => {
      const elements = [tataElement, inrElement, dpeElement];
      const promoter = new Promoter(1000, elements, 'test-promoter');

      expect(promoter.elements).toHaveLength(3);
      expect(promoter.name).toBe('test-promoter');
    });

    test('creates immutable elements array', () => {
      const elements = [tataElement];
      const promoter = new Promoter(1000, elements);

      // Should not be able to modify the elements array
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (promoter.elements as any).push(inrElement);
      }).toThrow();
    });

    test('handles empty elements array', () => {
      const promoter = new Promoter(1000, []);

      expect(promoter.elements).toHaveLength(0);
    });
  });

  describe('getElementsByName', () => {
    test('finds elements by name', () => {
      const promoter = new Promoter(1000, [tataElement, inrElement, tataElement]);

      const tataElements = promoter.getElementsByName('TATA');
      expect(tataElements).toHaveLength(2);
      expect(tataElements.every(e => e.name === 'TATA')).toBe(true);

      const inrElements = promoter.getElementsByName('Inr');
      expect(inrElements).toHaveLength(1);
      expect(inrElements[0]).toBe(inrElement);
    });

    test('returns empty array for non-existent elements', () => {
      const promoter = new Promoter(1000, [tataElement]);

      const gcElements = promoter.getElementsByName('GC');
      expect(gcElements).toHaveLength(0);
    });
  });

  describe('hasElement', () => {
    test('returns true for existing elements', () => {
      const promoter = new Promoter(1000, [tataElement, inrElement]);

      expect(promoter.hasElement('TATA')).toBe(true);
      expect(promoter.hasElement('Inr')).toBe(true);
    });

    test('returns false for non-existing elements', () => {
      const promoter = new Promoter(1000, [tataElement]);

      expect(promoter.hasElement('GC')).toBe(false);
      expect(promoter.hasElement('DPE')).toBe(false);
    });
  });

  describe('getElementPosition', () => {
    test('calculates correct genomic positions', () => {
      const promoter = new Promoter(1000, [tataElement, inrElement, dpeElement]);

      expect(promoter.getElementPosition(tataElement)).toBe(1000 + TATA_BOX_TYPICAL_POSITION); // 1000 + TATA_BOX_TYPICAL_POSITION
      expect(promoter.getElementPosition(inrElement)).toBe(1000); // 1000 + 0
      expect(promoter.getElementPosition(dpeElement)).toBe(1000 + DPE_TYPICAL_POSITION); // 1000 + DPE_TYPICAL_POSITION
    });

    test('handles negative TSS', () => {
      const promoter = new Promoter(-100, [tataElement]);

      expect(promoter.getElementPosition(tataElement)).toBe(-100 + TATA_BOX_TYPICAL_POSITION); // -100 + TATA_BOX_TYPICAL_POSITION
    });
  });

  describe('getElementsByPosition', () => {
    test('sorts elements by genomic position', () => {
      const elements = [dpeElement, tataElement, inrElement]; // Mixed order
      const promoter = new Promoter(1000, elements);

      const sorted = promoter.getElementsByPosition();

      expect(sorted).toHaveLength(3);
      expect(sorted[0]).toBe(tataElement); // position TATA_BOX_TYPICAL_POSITION
      expect(sorted[1]).toBe(inrElement); // position 0
      expect(sorted[2]).toBe(dpeElement); // position DPE_TYPICAL_POSITION
    });

    test('handles elements with same position', () => {
      const element1 = new PromoterElement('Test1', new NucleotidePattern('AAAA'), -10);
      const element2 = new PromoterElement('Test2', new NucleotidePattern('TTTT'), -10);
      const promoter = new Promoter(1000, [element2, element1]);

      const sorted = promoter.getElementsByPosition();
      expect(sorted).toHaveLength(2);
      // Order should be stable for same positions
    });
  });

  describe('getStrengthScore', () => {
    test('calculates score for single TATA element', () => {
      const promoter = new Promoter(1000, [tataElement]);

      expect(promoter.getStrengthScore()).toBe(10); // TATA = 10 points
    });

    test('calculates score for TATA-less promoter', () => {
      const promoter = new Promoter(1000, [inrElement, dpeElement]);

      // Inr = 8, DPE = 6, multiple elements bonus = 2 * 2 = 4
      expect(promoter.getStrengthScore()).toBe(18);
    });

    test('calculates score for strong promoter', () => {
      const gcElement = new PromoterElement('GC', new NucleotidePattern('GGGCGG'), -70);
      const promoter = new Promoter(1000, [tataElement, caatElement, gcElement]);

      // TATA = 10, CAAT = 5, GC = 4, multiple bonus = 3 * 2 = 6
      expect(promoter.getStrengthScore()).toBe(25);
    });

    test('returns zero for empty promoter', () => {
      const promoter = new Promoter(1000, []);

      expect(promoter.getStrengthScore()).toBe(0);
    });

    test('handles unknown elements', () => {
      const unknownElement = new PromoterElement('Unknown', new NucleotidePattern('NNNN'), 0);
      const promoter = new Promoter(1000, [unknownElement]);

      // No score for unknown elements, but no multiple bonus either
      expect(promoter.getStrengthScore()).toBe(0);
    });
  });

  describe('toString', () => {
    test('formats promoter without name', () => {
      const promoter = new Promoter(1000, [tataElement, inrElement]);

      const result = promoter.toString();
      expect(result).toBe('Promoter at TSS=1000 with elements: [TATA, Inr]');
    });

    test('formats promoter with name', () => {
      const promoter = new Promoter(1000, [tataElement], 'beta-globin');

      const result = promoter.toString();
      expect(result).toBe('Promoter (beta-globin) at TSS=1000 with elements: [TATA]');
    });

    test('formats promoter with no elements', () => {
      const promoter = new Promoter(1000, [], 'empty');

      const result = promoter.toString();
      expect(result).toBe('Promoter (empty) at TSS=1000 with elements: []');
    });

    test('formats promoter with many elements', () => {
      const elements = [tataElement, inrElement, dpeElement, caatElement];
      const promoter = new Promoter(1000, elements);

      const result = promoter.toString();
      expect(result).toBe('Promoter at TSS=1000 with elements: [TATA, Inr, DPE, CAAT]');
    });
  });
});
