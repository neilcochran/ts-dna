import { translate } from '../../src/translation';
import { parseMRNA } from '../../src/processing';
import {
  MRNA_ALL_AMINO_ACIDS_1,
  ALL_AMINO_ACIDS_SINGLE_LETTER_CODE_SEQ,
} from '../utils/test-utils';

describe('Polypeptide', () => {
  test('aminoAcids is read out of the translate result', () => {
    const mRNA = parseMRNA('AUGAAACCCUAG', 0, 12).unwrap();
    const poly = translate(mRNA).unwrap();
    expect(poly.aminoAcids).toHaveLength(3);
    expect(poly.aminoAcids[0].data.singleLetterCode).toBe('M');
    expect(poly.aminoAcids[1].data.singleLetterCode).toBe('K');
    expect(poly.aminoAcids[2].data.singleLetterCode).toBe('P');
  });

  describe('getSequence', () => {
    test('joins single-letter codes', () => {
      const mRNA = parseMRNA('AUGAAACCCUAG', 0, 12).unwrap();
      const poly = translate(mRNA).unwrap();
      expect(poly.getSequence()).toBe('MKP');
    });

    test('returns the canonical 20-amino-acid sequence for the canonical fixture', () => {
      const poly = translate(MRNA_ALL_AMINO_ACIDS_1).unwrap();
      expect(poly.getSequence()).toBe(ALL_AMINO_ACIDS_SINGLE_LETTER_CODE_SEQ);
    });

    test('returns an empty string when the first codon is a stop', () => {
      const mRNA = parseMRNA('UAGAAACCC', 0, 9).unwrap();
      const poly = translate(mRNA).unwrap();
      expect(poly.getSequence()).toBe('');
    });
  });

  describe('contains / startsWith / endsWith', () => {
    const mRNA = parseMRNA('AUGAAACCCUAG', 0, 12).unwrap();
    const poly = translate(mRNA).unwrap();

    test('contains finds an interior subsequence', () => {
      expect(poly.contains('KP')).toBe(true);
      expect(poly.contains('XX')).toBe(false);
    });

    test('contains accepts a Polypeptide argument', () => {
      const other = translate(parseMRNA('AUGUAG', 0, 6).unwrap()).unwrap();
      expect(poly.contains(other)).toBe(true);
    });

    test('startsWith matches a prefix', () => {
      expect(poly.startsWith('M')).toBe(true);
      expect(poly.startsWith('MK')).toBe(true);
      expect(poly.startsWith('K')).toBe(false);
    });

    test('endsWith matches a suffix', () => {
      expect(poly.endsWith('P')).toBe(true);
      expect(poly.endsWith('KP')).toBe(true);
      expect(poly.endsWith('M')).toBe(false);
    });

    test('startsWith / endsWith accept Polypeptide arguments', () => {
      const prefix = translate(parseMRNA('AUGUAG', 0, 6).unwrap()).unwrap();
      const suffix = translate(parseMRNA('CCCUAG', 0, 6).unwrap()).unwrap();
      expect(poly.startsWith(prefix)).toBe(true);
      expect(poly.endsWith(suffix)).toBe(true);
    });
  });

  describe('indexOf', () => {
    const poly = translate(parseMRNA('AUGAAAGGGAAAUAG', 0, 15).unwrap()).unwrap();
    // single-letter sequence: 'MKGK'

    test('finds the first occurrence', () => {
      expect(poly.indexOf('K')).toBe(1);
    });

    test('respects the startPosition argument', () => {
      expect(poly.indexOf('K', 2)).toBe(3);
    });

    test('returns -1 for a missing subsequence', () => {
      expect(poly.indexOf('XY')).toBe(-1);
    });

    test('accepts a Polypeptide argument', () => {
      const target = translate(parseMRNA('AAAUAG', 0, 6).unwrap()).unwrap();
      expect(poly.indexOf(target)).toBe(1);
    });
  });

  describe('immutability', () => {
    test('aminoAcids and mRNA fields read consistently', () => {
      const poly = translate(MRNA_ALL_AMINO_ACIDS_1).unwrap();
      const ref = poly.aminoAcids;
      expect(poly.aminoAcids).toBe(ref);
      expect(poly.mRNA).toBe(MRNA_ALL_AMINO_ACIDS_1);
    });
  });
});
