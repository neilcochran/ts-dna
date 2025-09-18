import {
  TATA_BOX,
  INITIATOR,
  DOWNSTREAM_PROMOTER_ELEMENT,
  CAAT_BOX,
  GC_BOX,
  CEBP_SITE,
  E_BOX,
  AP1_SITE,
  STANDARD_PROMOTER_ELEMENTS,
  CORE_PROMOTER_ELEMENTS,
  PROXIMAL_PROMOTER_ELEMENTS,
  PROMOTER_ELEMENT_COMBINATIONS,
} from '../../src/data/promoter-elements';

describe('promoter-elements', () => {
  describe('individual elements', () => {
    test('TATA_BOX has correct properties', () => {
      expect(TATA_BOX.name).toBe('TATA');
      expect(TATA_BOX.position).toBe(-25);
      expect(TATA_BOX.pattern.pattern).toBe('TATAWAR');
    });

    test('INITIATOR has correct properties', () => {
      expect(INITIATOR.name).toBe('Inr');
      expect(INITIATOR.position).toBe(0);
      expect(INITIATOR.pattern.pattern).toBe('BBCABW');
    });

    test('DOWNSTREAM_PROMOTER_ELEMENT has correct properties', () => {
      expect(DOWNSTREAM_PROMOTER_ELEMENT.name).toBe('DPE');
      expect(DOWNSTREAM_PROMOTER_ELEMENT.position).toBe(30);
      expect(DOWNSTREAM_PROMOTER_ELEMENT.pattern.pattern).toBe('RGWYV');
    });

    test('CAAT_BOX has correct properties', () => {
      expect(CAAT_BOX.name).toBe('CAAT');
      expect(CAAT_BOX.position).toBe(-75);
      expect(CAAT_BOX.pattern.pattern).toBe('GGCCAATCT');
    });

    test('GC_BOX has correct properties', () => {
      expect(GC_BOX.name).toBe('GC');
      expect(GC_BOX.position).toBe(-70);
      expect(GC_BOX.pattern.pattern).toBe('GGGCGG');
    });

    test('CEBP_SITE has correct properties', () => {
      expect(CEBP_SITE.name).toBe('C/EBP');
      expect(CEBP_SITE.position).toBe(-50);
      expect(CEBP_SITE.pattern.pattern).toBe('RTTGCGYAAY');
    });

    test('E_BOX has correct properties', () => {
      expect(E_BOX.name).toBe('E-box');
      expect(E_BOX.position).toBe(-60);
      expect(E_BOX.pattern.pattern).toBe('CANNTG');
    });

    test('AP1_SITE has correct properties', () => {
      expect(AP1_SITE.name).toBe('AP-1');
      expect(AP1_SITE.position).toBe(-40);
      expect(AP1_SITE.pattern.pattern).toBe('TGASTCA');
    });
  });

  describe('element collections', () => {
    test('STANDARD_PROMOTER_ELEMENTS contains all elements', () => {
      expect(STANDARD_PROMOTER_ELEMENTS).toHaveLength(8);

      const elementNames = STANDARD_PROMOTER_ELEMENTS.map(e => e.name);
      expect(elementNames).toContain('TATA');
      expect(elementNames).toContain('Inr');
      expect(elementNames).toContain('DPE');
      expect(elementNames).toContain('CAAT');
      expect(elementNames).toContain('GC');
      expect(elementNames).toContain('C/EBP');
      expect(elementNames).toContain('E-box');
      expect(elementNames).toContain('AP-1');
    });

    test('CORE_PROMOTER_ELEMENTS contains core elements only', () => {
      expect(CORE_PROMOTER_ELEMENTS).toHaveLength(3);

      const coreNames = CORE_PROMOTER_ELEMENTS.map(e => e.name);
      expect(coreNames).toContain('TATA');
      expect(coreNames).toContain('Inr');
      expect(coreNames).toContain('DPE');
    });

    test('PROXIMAL_PROMOTER_ELEMENTS contains regulatory elements', () => {
      expect(PROXIMAL_PROMOTER_ELEMENTS).toHaveLength(5);

      const proximalNames = PROXIMAL_PROMOTER_ELEMENTS.map(e => e.name);
      expect(proximalNames).toContain('CAAT');
      expect(proximalNames).toContain('GC');
      expect(proximalNames).toContain('C/EBP');
      expect(proximalNames).toContain('E-box');
      expect(proximalNames).toContain('AP-1');
    });

    test('core and proximal elements are mutually exclusive', () => {
      const coreNames = new Set(CORE_PROMOTER_ELEMENTS.map(e => e.name));
      const proximalNames = new Set(PROXIMAL_PROMOTER_ELEMENTS.map(e => e.name));

      // No overlap between core and proximal
      const intersection = [...coreNames].filter(name => proximalNames.has(name));
      expect(intersection).toHaveLength(0);
    });

    test('standard elements include both core and proximal', () => {
      const standardNames = new Set(STANDARD_PROMOTER_ELEMENTS.map(e => e.name));
      const coreNames = CORE_PROMOTER_ELEMENTS.map(e => e.name);
      const proximalNames = PROXIMAL_PROMOTER_ELEMENTS.map(e => e.name);

      // All core elements should be in standard
      coreNames.forEach(name => {
        expect(standardNames.has(name)).toBe(true);
      });

      // All proximal elements should be in standard
      proximalNames.forEach(name => {
        expect(standardNames.has(name)).toBe(true);
      });
    });
  });

  describe('promoter combinations', () => {
    test('TATA_DEPENDENT contains only TATA', () => {
      expect(PROMOTER_ELEMENT_COMBINATIONS.TATA_DEPENDENT).toHaveLength(1);
      expect(PROMOTER_ELEMENT_COMBINATIONS.TATA_DEPENDENT[0].name).toBe('TATA');
    });

    test('TATA_LESS contains Inr and DPE', () => {
      expect(PROMOTER_ELEMENT_COMBINATIONS.TATA_LESS).toHaveLength(2);

      const names = PROMOTER_ELEMENT_COMBINATIONS.TATA_LESS.map(e => e.name);
      expect(names).toContain('Inr');
      expect(names).toContain('DPE');
    });

    test('STRONG_PROMOTER contains multiple strong elements', () => {
      expect(PROMOTER_ELEMENT_COMBINATIONS.STRONG_PROMOTER).toHaveLength(3);

      const names = PROMOTER_ELEMENT_COMBINATIONS.STRONG_PROMOTER.map(e => e.name);
      expect(names).toContain('TATA');
      expect(names).toContain('CAAT');
      expect(names).toContain('GC');
    });

    test('HOUSEKEEPING contains appropriate elements', () => {
      expect(PROMOTER_ELEMENT_COMBINATIONS.HOUSEKEEPING).toHaveLength(2);

      const names = PROMOTER_ELEMENT_COMBINATIONS.HOUSEKEEPING.map(e => e.name);
      expect(names).toContain('GC');
      expect(names).toContain('Inr');
    });

    test('TISSUE_SPECIFIC contains regulatory elements', () => {
      expect(PROMOTER_ELEMENT_COMBINATIONS.TISSUE_SPECIFIC).toHaveLength(3);

      const names = PROMOTER_ELEMENT_COMBINATIONS.TISSUE_SPECIFIC.map(e => e.name);
      expect(names).toContain('E-box');
      expect(names).toContain('C/EBP');
      expect(names).toContain('AP-1');
    });
  });

  describe('biological accuracy', () => {
    test('TATA box position is biologically accurate', () => {
      // TATA box is typically 25-30bp upstream of TSS
      expect(TATA_BOX.position).toBeLessThan(0);
      expect(Math.abs(TATA_BOX.position)).toBeGreaterThanOrEqual(20);
      expect(Math.abs(TATA_BOX.position)).toBeLessThanOrEqual(35);
    });

    test('Initiator overlaps TSS as expected', () => {
      // Inr should overlap or be very close to TSS
      expect(Math.abs(INITIATOR.position)).toBeLessThanOrEqual(5);
    });

    test('DPE is downstream of TSS', () => {
      // DPE should be downstream of TSS
      expect(DOWNSTREAM_PROMOTER_ELEMENT.position).toBeGreaterThan(0);
      expect(DOWNSTREAM_PROMOTER_ELEMENT.position).toBeLessThanOrEqual(50);
    });

    test('proximal elements are upstream', () => {
      // Most regulatory elements should be upstream
      expect(CAAT_BOX.position).toBeLessThan(0);
      expect(GC_BOX.position).toBeLessThan(0);
      expect(CEBP_SITE.position).toBeLessThan(0);
      expect(E_BOX.position).toBeLessThan(0);
      expect(AP1_SITE.position).toBeLessThan(0);
    });

    test('elements have reasonable upstream distances', () => {
      // Proximal elements shouldn't be too far upstream
      const upstreamElements = [CAAT_BOX, GC_BOX, CEBP_SITE, E_BOX, AP1_SITE];

      upstreamElements.forEach(element => {
        expect(Math.abs(element.position)).toBeLessThanOrEqual(200);
        expect(Math.abs(element.position)).toBeGreaterThanOrEqual(10);
      });
    });
  });
});
