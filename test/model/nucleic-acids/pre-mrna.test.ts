import { PreMRNA } from '../../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../../src/model/nucleic-acids/Gene';
import { SIMPLE_TWO_EXON_GENE, SINGLE_EXON_GENE } from '../../test-genes';

describe('PreMRNA', () => {
  let testGene: Gene;

  beforeEach(() => {
    // Use realistic gene with proper intron size
    testGene = new Gene(SIMPLE_TWO_EXON_GENE.dnaSequence, SIMPLE_TWO_EXON_GENE.exons);
  });

  describe('constructor', () => {
    test('creates PreMRNA with basic information', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);

      expect(preMRNA.getSequence()).toBe(SIMPLE_TWO_EXON_GENE.rnaSequence);
      expect(preMRNA.getSourceGene()).toBe(testGene);
      expect(preMRNA.getTranscriptionStartSite()).toBe(0);
      expect(preMRNA.getPolyadenylationSite()).toBeUndefined();
    });

    test('creates PreMRNA with polyadenylation site', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0, 30);

      expect(preMRNA.getPolyadenylationSite()).toBe(30);
    });

    test('creates PreMRNA with different TSS', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 5);

      expect(preMRNA.getTranscriptionStartSite()).toBe(5);
    });
  });

  describe('getExonRegions', () => {
    test('returns exon regions in transcript coordinates', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);
      const exonRegions = preMRNA.getExonRegions();

      expect(exonRegions).toHaveLength(2);
      expect(exonRegions[0]).toEqual({ start: 0, end: 6, name: 'exon1' });
      expect(exonRegions[1]).toEqual({ start: 26, end: 34, name: 'exon2' });
    });

    test('adjusts coordinates when TSS is not at position 0', () => {
      // TSS at position 3, so exons shift left by 3
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence.substring(3), testGene, 3);
      const exonRegions = preMRNA.getExonRegions();

      expect(exonRegions).toHaveLength(2);
      expect(exonRegions[0]).toEqual({ start: -3, end: 3, name: 'exon1' });
      expect(exonRegions[1]).toEqual({ start: 23, end: 31, name: 'exon2' });
    });

    test('filters out exons outside transcript bounds', () => {
      // TSS after first exon
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence.substring(6), testGene, 6);
      const exonRegions = preMRNA.getExonRegions();

      expect(exonRegions).toHaveLength(1);
      expect(exonRegions[0]).toEqual({ start: 20, end: 28, name: 'exon2' });
    });
  });

  describe('getIntronRegions', () => {
    test('returns intron regions in transcript coordinates', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);
      const intronRegions = preMRNA.getIntronRegions();

      expect(intronRegions).toHaveLength(1);
      expect(intronRegions[0]).toEqual({ start: 6, end: 26, name: undefined });
    });

    test('adjusts intron coordinates for different TSS', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence.substring(3), testGene, 3);
      const intronRegions = preMRNA.getIntronRegions();

      expect(intronRegions).toHaveLength(1);
      expect(intronRegions[0]).toEqual({ start: 3, end: 23, name: undefined });
    });
  });

  describe('getCodingSequence', () => {
    test('returns joined exon sequences', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);
      const codingSeq = preMRNA.getCodingSequence();

      expect(codingSeq).toBe(SIMPLE_TWO_EXON_GENE.splicedRNA);
    });

    test('handles partial exons correctly', () => {
      // Transcript starts within first exon
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence.substring(3), testGene, 3);
      const codingSeq = preMRNA.getCodingSequence();

      // First exon becomes AAA (positions -3 to 3, but only 0-3 is in transcript)
      // Second exon from positions 23-31 in transcript coordinates
      expect(codingSeq).toBe('AAAUUCUAGGG'); // Partial first exon + full second exon
    });
  });

  describe('hasIntrons', () => {
    test('returns true when introns are present', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);
      expect(preMRNA.hasIntrons()).toBe(true);
    });

    test('returns false for single exon gene', () => {
      const singleExonGene = new Gene(SINGLE_EXON_GENE.dnaSequence, SINGLE_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SINGLE_EXON_GENE.rnaSequence, singleExonGene, 0);
      expect(preMRNA.hasIntrons()).toBe(false);
    });
  });

  describe('getTotalIntronLength', () => {
    test('calculates total intron length', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);
      expect(preMRNA.getTotalIntronLength()).toBe(20); // 20bp intron
    });

    test('returns 0 for intronless gene', () => {
      const singleExonGene = new Gene(SINGLE_EXON_GENE.dnaSequence, SINGLE_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SINGLE_EXON_GENE.rnaSequence, singleExonGene, 0);
      expect(preMRNA.getTotalIntronLength()).toBe(0);
    });
  });

  describe('getTotalExonLength', () => {
    test('calculates total exon length', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);
      expect(preMRNA.getTotalExonLength()).toBe(14); // 6 + 8 bp exons
    });

    test('handles partial exons', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence.substring(3), testGene, 3);
      const exonLength = preMRNA.getTotalExonLength();
      expect(exonLength).toBe(11); // 3 (partial first exon) + 8 (full second exon)
    });
  });

  describe('toString', () => {
    test('returns descriptive string representation', () => {
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, testGene, 0);
      const str = preMRNA.toString();

      expect(str).toBe(`PreMRNA(${SIMPLE_TWO_EXON_GENE.rnaSequence.length}nt, 2 exons, 1 introns)`);
    });

    test('handles different counts correctly', () => {
      const singleExonGene = new Gene(SINGLE_EXON_GENE.dnaSequence, SINGLE_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SINGLE_EXON_GENE.rnaSequence, singleExonGene, 0);
      const str = preMRNA.toString();

      expect(str).toBe(`PreMRNA(${SINGLE_EXON_GENE.rnaSequence.length}nt, 1 exons, 0 introns)`);
    });
  });

  describe('edge cases', () => {
    test('handles single exon gene (no introns)', () => {
      const singleExonGene = new Gene(SINGLE_EXON_GENE.dnaSequence, SINGLE_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SINGLE_EXON_GENE.rnaSequence, singleExonGene, 0);

      expect(preMRNA.getExonRegions()).toHaveLength(1);
      expect(preMRNA.getIntronRegions()).toHaveLength(0);
      expect(preMRNA.getCodingSequence()).toBe(SINGLE_EXON_GENE.splicedRNA);
      expect(preMRNA.hasIntrons()).toBe(false);
    });

    test('handles TSS beyond gene end', () => {
      const preMRNA = new PreMRNA('UUU', testGene, 100);
      const exonRegions = preMRNA.getExonRegions();

      // All exons should be filtered out as they're before TSS
      expect(exonRegions).toHaveLength(0);
    });

    test('handles very long sequences', () => {
      const longSequence = 'A'.repeat(10000);
      const longGene = new Gene(longSequence, [
        { start: 0, end: 1000 },
        { start: 5000, end: 6000 },
      ]);
      const preMRNA = new PreMRNA(longSequence.replace(/T/g, 'U'), longGene, 0);

      expect(preMRNA.getTotalExonLength()).toBe(2000);
      expect(preMRNA.getTotalIntronLength()).toBe(4000);
      expect(preMRNA.hasIntrons()).toBe(true);
    });
  });
});
