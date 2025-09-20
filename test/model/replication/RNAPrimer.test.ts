import { RNAPrimer } from '../../../src/model/replication/RNAPrimer.js';
import { isSuccess, isFailure } from '../../../src/types/validation-result.js';

describe('RNAPrimer', () => {
  describe('constructor', () => {
    test('creates valid RNA primer with correct parameters', () => {
      const primer = new RNAPrimer('AUGC', 100, false);

      expect(primer.getSequence()).toBe('AUGC');
      expect(primer.position).toBe(100);
      expect(primer.isRemoved).toBe(false);
      expect(primer.getLength()).toBe(4);
    });

    test('accepts minimum length primer (3 nucleotides)', () => {
      const primer = new RNAPrimer('AUG', 0);
      expect(primer.getLength()).toBe(3);
    });

    test('accepts maximum length primer (10 nucleotides)', () => {
      const primer = new RNAPrimer('AUGCAUGCAU', 0);
      expect(primer.getLength()).toBe(10);
    });

    test('throws error for primer too short', () => {
      expect(() => new RNAPrimer('AU', 0)).toThrow(
        'RNA primers must be 3-10 nucleotides long. Provided: 2 nucleotides',
      );
    });

    test('throws error for primer too long', () => {
      expect(() => new RNAPrimer('AUGCAUGCAUG', 0)).toThrow(
        'RNA primers must be 3-10 nucleotides long. Provided: 11 nucleotides',
      );
    });

    test('throws error for invalid RNA sequence', () => {
      expect(() => new RNAPrimer('ATGC', 0)).toThrow('Invalid RNA sequence');
    });

    test('throws error for sequence with invalid characters', () => {
      expect(() => new RNAPrimer('AUXG', 0)).toThrow();
    });
  });

  describe('create static method', () => {
    test('successfully creates valid primer', () => {
      const result = RNAPrimer.create('AUGC', 50);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('AUGC');
        expect(result.data.position).toBe(50);
      }
    });

    test('fails for invalid length', () => {
      const result = RNAPrimer.create('AU', 0);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('RNA primers must be 3-10 nucleotides long');
      }
    });

    test('fails for negative position', () => {
      const result = RNAPrimer.create('AUG', -1);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Primer position must be non-negative');
      }
    });

    test('fails for invalid RNA sequence', () => {
      const result = RNAPrimer.create('ATGC', 0);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid RNA sequence');
      }
    });
  });

  describe('generateRandom static method', () => {
    test('generates random primer of correct length', () => {
      const result = RNAPrimer.generateRandom(5, 100);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getLength()).toBe(5);
        expect(result.data.position).toBe(100);
      }
    });

    test('generates primer with valid RNA nucleotides', () => {
      const result = RNAPrimer.generateRandom(4, 0);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const sequence = result.data.getSequence();
        expect(sequence).toMatch(/^[AUGC]+$/);
      }
    });

    test('fails for invalid length', () => {
      const result = RNAPrimer.generateRandom(2, 0);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Primer length must be 3-10 nucleotides');
      }
    });

    test('generates different sequences on multiple calls', () => {
      const results = Array.from({ length: 10 }, () => RNAPrimer.generateRandom(8, 0));

      const sequences = results.filter(isSuccess).map(r => r.data.getSequence());

      // Should have some variety (not all identical)
      const uniqueSequences = new Set(sequences);
      expect(uniqueSequences.size).toBeGreaterThan(1);
    });
  });

  describe('methods', () => {
    let primer: RNAPrimer;

    beforeEach(() => {
      primer = new RNAPrimer('AUGCAU', 25, false);
    });

    test('getRNA returns RNA object', () => {
      const rna = primer.getRNA();
      expect(rna.getSequence()).toBe('AUGCAU');
    });

    test('isValidLength returns true for valid lengths', () => {
      expect(primer.isValidLength()).toBe(true);
    });

    test('markAsRemoved sets removal status', () => {
      expect(primer.isRemoved).toBe(false);
      primer.markAsRemoved();
      expect(primer.isRemoved).toBe(true);
    });

    test('copyToPosition creates copy at new position', () => {
      const copy = primer.copyToPosition(100);

      expect(copy.getSequence()).toBe(primer.getSequence());
      expect(copy.position).toBe(100);
      expect(copy.isRemoved).toBe(primer.isRemoved);
      expect(copy).not.toBe(primer); // Different instance
    });

    test('toString provides informative representation', () => {
      const str = primer.toString();
      expect(str).toContain('AUGCAU');
      expect(str).toContain('pos: 25');
      expect(str).toContain('active');
    });

    test('toString shows removed status correctly', () => {
      primer.markAsRemoved();
      const str = primer.toString();
      expect(str).toContain('removed');
    });

    test('equals compares primers correctly', () => {
      const identical = new RNAPrimer('AUGCAU', 25, false);
      const different = new RNAPrimer('AUGCAU', 26, false);

      expect(primer.equals(identical)).toBe(true);
      expect(primer.equals(different)).toBe(false);
    });
  });

  describe('biological constraints', () => {
    test('primer lengths match biological research (3-10 nt)', () => {
      // Test all valid lengths
      for (let length = 3; length <= 10; length++) {
        const sequence = 'A'
          .repeat(length)
          .replace(/A/g, () => ['A', 'U', 'G', 'C'][Math.floor(Math.random() * 4)]);

        expect(() => new RNAPrimer(sequence, 0)).not.toThrow();
      }
    });

    test('rejects non-biological lengths', () => {
      // Too short
      expect(() => new RNAPrimer('A', 0)).toThrow();
      expect(() => new RNAPrimer('AU', 0)).toThrow();

      // Too long
      const longSequence = 'AUGCAUGCAUGC'; // 12 nucleotides
      expect(() => new RNAPrimer(longSequence, 0)).toThrow();
    });

    test('only accepts RNA nucleotides (A, U, G, C)', () => {
      expect(() => new RNAPrimer('AUG', 0)).not.toThrow();
      expect(() => new RNAPrimer('AUGC', 0)).not.toThrow();
      expect(() => new RNAPrimer('UUUU', 0)).not.toThrow();
      expect(() => new RNAPrimer('GCGC', 0)).not.toThrow();

      // DNA nucleotides should fail
      expect(() => new RNAPrimer('ATG', 0)).toThrow();
      expect(() => new RNAPrimer('ATGC', 0)).toThrow();
    });
  });
});
