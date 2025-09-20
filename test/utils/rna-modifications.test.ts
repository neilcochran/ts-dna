import { RNA } from '../../src/model/nucleic-acids/RNA';
import {
  DEFAULT_POLY_A_TAIL_LENGTH,
  MAX_POLY_A_TAIL_LENGTH,
} from '../../src/constants/biological-constants';
import {
  ProcessedRNA,
  add5PrimeCap,
  add3PrimePolyATail,
  add3PrimePolyATailAtSite,
  remove5PrimeCap,
  remove3PrimePolyATail,
  has5PrimeCap,
  has3PrimePolyATail,
  get3PrimePolyATailLength,
  getCoreSequence,
  isFullyProcessed,
} from '../../src/utils/rna-modifications';
import { PolyadenylationSite } from '../../src/types/polyadenylation-site';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('rna-modifications', () => {
  describe('add5PrimeCap', () => {
    test("adds 5' cap to RNA sequence", () => {
      const rna = new RNA('AUGAAACCCGGG');
      const cappedRNA = add5PrimeCap(rna);

      expect(cappedRNA).toBeInstanceOf(ProcessedRNA);
      expect(cappedRNA.getSequence()).toBe('AUGAAACCCGGG');
      expect(cappedRNA.hasFivePrimeCap).toBe(true);
      expect(cappedRNA.rnaSubType).toBe(rna.rnaSubType);
    });

    test('adds cap to ProcessedRNA that already exists', () => {
      // Test line 62: when rna instanceof ProcessedRNA
      const existingProcessedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, false, 'AAAAAAA');
      const cappedRNA = add5PrimeCap(existingProcessedRNA);

      expect(cappedRNA).toBeInstanceOf(ProcessedRNA);
      expect(cappedRNA.getSequence()).toBe('AUGAAACCCGGG');
      expect(cappedRNA.hasFivePrimeCap).toBe(true);
      expect(cappedRNA.polyATail).toBe('AAAAAAA'); // Preserves existing poly-A tail
    });

    test('adds cap to minimal sequence', () => {
      const rna = new RNA('A'); // Minimal valid RNA
      const cappedRNA = add5PrimeCap(rna);

      expect(cappedRNA).toBeInstanceOf(ProcessedRNA);
      expect(cappedRNA.getSequence()).toBe('A');
      expect(cappedRNA.hasFivePrimeCap).toBe(true);
    });

    test('preserves RNA subtype', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const cappedRNA = add5PrimeCap(rna);

      expect(cappedRNA.rnaSubType).toBe(rna.rnaSubType);
    });
  });

  describe('add3PrimePolyATail', () => {
    test('adds poly-A tail at specified cleavage site', () => {
      const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
      const result = add3PrimePolyATail(rna, 15, 10);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(ProcessedRNA);
        expect(result.data.getSequence()).toBe('AUGAAACCCGGGAAU');
        expect(result.data.polyATail).toBe('AAAAAAAAAA');
        expect(result.data.getTotalLength()).toBe(25); // 15 + 10
      }
    });

    test('adds default length poly-A tail', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const result = add3PrimePolyATail(rna, 12);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGG'); // Core sequence unchanged
        expect(result.data.getPolyATailLength()).toBe(DEFAULT_POLY_A_TAIL_LENGTH); // Default tail length
        expect(result.data.polyATail).toBe('A'.repeat(DEFAULT_POLY_A_TAIL_LENGTH)); // Poly-A tail stored separately
        expect(result.data.getTotalLength()).toBe(12 + DEFAULT_POLY_A_TAIL_LENGTH); // Total length with tail
      }
    });

    test('adds custom length poly-A tail', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const result = add3PrimePolyATail(rna, 12, 50);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGG'); // Core sequence unchanged
        expect(result.data.getPolyATailLength()).toBe(50); // Custom tail length
        expect(result.data.polyATail).toBe('A'.repeat(50)); // Poly-A tail stored separately
      }
    });

    test('fails with invalid cleavage site', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const result = add3PrimePolyATail(rna, -1);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid cleavage site');
      }
    });

    test('truncates cleavage site beyond sequence', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const result = add3PrimePolyATail(rna, 100, 5);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        // Should cleave at sequence end (12) instead of 100
        expect(result.data.getSequence()).toBe('AUGAAACCCGGG');
        expect(result.data.getPolyATailLength()).toBe(5);
      }
    });

    test('fails with invalid tail length', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const result = add3PrimePolyATail(rna, 12, -10);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid poly-A tail length');
      }
    });

    test('fails with excessive tail length', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const result = add3PrimePolyATail(rna, 12, MAX_POLY_A_TAIL_LENGTH + 1); // Exceeds the maximum limit

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Invalid poly-A tail length');
      }
    });

    test('handles exception during poly-A tail addition', () => {
      // Test line 105: exception handling catch block
      // Create a mock RNA that throws an error when getSequence is called
      const mockRNA = {
        getSequence: () => {
          throw new Error('Mock getSequence error');
        },
        rnaSubType: undefined,
      } as any;

      const result = add3PrimePolyATail(mockRNA, 5, 10);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to add poly-A tail');
        expect(result.error).toContain('Mock getSequence error');
      }
    });

    test("preserves 5' cap when adding poly-A tail to ProcessedRNA", () => {
      // Test line 101: when rna instanceof ProcessedRNA
      const processedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, true, '');
      const result = add3PrimePolyATail(processedRNA, 12, 5);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.hasFivePrimeCap).toBe(true); // Cap preserved
        expect(result.data.getPolyATailLength()).toBe(5);
      }
    });
  });

  describe('add3PrimePolyATailAtSite', () => {
    test('adds poly-A tail using polyadenylation site info', () => {
      const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
      const polySite: PolyadenylationSite = {
        position: 12,
        signal: 'AAUAAA',
        strength: 100,
        cleavageSite: 20,
      };

      const result = add3PrimePolyATailAtSite(rna, polySite, 10);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGGAAUAAACC'); // Cleaved at site 20
        expect(result.data.getPolyATailLength()).toBe(10); // Custom tail length
        expect(result.data.polyATail).toBe('A'.repeat(10)); // Poly-A tail stored separately
      }
    });

    test('calculates cleavage site when not provided', () => {
      const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
      const polySite: PolyadenylationSite = {
        position: 12,
        signal: 'AAUAAA',
        strength: 100,
        // No cleavageSite provided
      };

      const result = add3PrimePolyATailAtSite(rna, polySite, 5);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        // Should use position + signal.length + 15 = 12 + 6 + 15 = 33
        // But sequence is only 21 long, so it will truncate at sequence end
        expect(result.data.getSequence()).toBe('AUGAAACCCGGGAAUAAACCC'); // Full sequence preserved
        expect(result.data.getPolyATailLength()).toBe(5); // Poly-A tail length
        expect(result.data.polyATail).toBe('AAAAA'); // Poly-A tail stored separately
      }
    });
  });

  describe('remove5PrimeCap', () => {
    test("removes 5' cap from capped RNA", () => {
      const processedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, true, '');
      const result = remove5PrimeCap(processedRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGG');
        expect(result.data.hasFivePrimeCap).toBe(false);
      }
    });

    test('fails when no cap present', () => {
      const rna = new RNA('AUGAAACCCGGG');
      const result = remove5PrimeCap(rna);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain("No 5' cap found");
      }
    });

    test('fails when ProcessedRNA has no cap', () => {
      // Test line 163: when ProcessedRNA doesn't have a cap
      const processedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, false, 'AAAA');
      const result = remove5PrimeCap(processedRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain("No 5' cap found to remove");
      }
    });

    test('handles exception during cap removal', () => {
      // Test line 171: exception handling catch block
      // Need to create a ProcessedRNA-like object that throws during property access
      const mockRNA = {
        constructor: { name: 'ProcessedRNA' }, // Make it look like ProcessedRNA
        get hasFivePrimeCap() {
          throw new Error('Mock cap removal error');
        },
      } as any;

      // Mock instanceof check
      Object.setPrototypeOf(mockRNA, ProcessedRNA.prototype);

      const result = remove5PrimeCap(mockRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain("Failed to remove 5' cap");
        expect(result.error).toContain('Mock cap removal error');
      }
    });
  });

  describe('remove3PrimePolyATail', () => {
    test('removes poly-A tail from RNA', () => {
      const rna = new RNA('AUGAAACCCGGGAAAAAAAAAA');
      const result = remove3PrimePolyATail(rna);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGG');
      }
    });

    test('fails when no poly-A tail present', () => {
      const rna = new RNA('AUGAAACCCGGGCCC');
      const result = remove3PrimePolyATail(rna);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('No poly-A tail found');
      }
    });

    test('removes poly-A tail from ProcessedRNA', () => {
      // Test lines 131-135: when rna instanceof ProcessedRNA with poly-A tail
      const processedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, true, 'AAAAAAA');
      const result = remove3PrimePolyATail(processedRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe('AUGAAACCCGGG');
        expect(result.data.hasFivePrimeCap).toBe(true); // Cap preserved
        expect(result.data.polyATail).toBe(''); // Poly-A tail removed
      }
    });

    test('fails when ProcessedRNA has no poly-A tail', () => {
      // Test line 132: when ProcessedRNA has empty poly-A tail
      const processedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, true, '');
      const result = remove3PrimePolyATail(processedRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('No poly-A tail found to remove');
      }
    });

    test('handles exception during poly-A tail removal', () => {
      // Test line 150: exception handling catch block
      const mockRNA = {
        getSequence: () => {
          throw new Error('Mock removal error');
        },
      } as any;

      const result = remove3PrimePolyATail(mockRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to remove poly-A tail');
        expect(result.error).toContain('Mock removal error');
      }
    });
  });

  describe('has5PrimeCap', () => {
    test("detects 5' cap presence", () => {
      const cappedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, true, '');
      const uncappedRNA = new RNA('AUGAAACCCGGG');

      expect(has5PrimeCap(cappedRNA)).toBe(true);
      expect(has5PrimeCap(uncappedRNA)).toBe(false);
    });
  });

  describe('has3PrimePolyATail', () => {
    test('detects poly-A tail with default minimum length', () => {
      const polyARNA = new RNA('AUGAAACCCGGGAAAAAAAAAA'); // 10 A's
      const noPolyARNA = new RNA('AUGAAACCCGGGCCC');
      const shortPolyARNA = new RNA('AUGAAACCCGGGAAA'); // Only 3 A's

      expect(has3PrimePolyATail(polyARNA)).toBe(true);
      expect(has3PrimePolyATail(noPolyARNA)).toBe(false);
      expect(has3PrimePolyATail(shortPolyARNA)).toBe(false);
    });

    test('detects poly-A tail with custom minimum length', () => {
      const rna = new RNA('AUGAAACCCGGGAAAAA'); // 5 A's

      expect(has3PrimePolyATail(rna, 3)).toBe(true);
      expect(has3PrimePolyATail(rna, 5)).toBe(true);
      expect(has3PrimePolyATail(rna, 10)).toBe(false);
    });

    test('detects poly-A tail in ProcessedRNA', () => {
      // Test line 196: when rna instanceof ProcessedRNA
      const processedRNAWithTail = new ProcessedRNA('AUGAAACCCGGG', undefined, true, 'AAAAAAAAAA');
      const processedRNAWithoutTail = new ProcessedRNA('AUGAAACCCGGG', undefined, true, '');
      const processedRNAShortTail = new ProcessedRNA('AUGAAACCCGGG', undefined, true, 'AAA');

      expect(has3PrimePolyATail(processedRNAWithTail)).toBe(true); // 10 A's >= default min
      expect(has3PrimePolyATail(processedRNAWithoutTail)).toBe(false); // 0 A's < default min
      expect(has3PrimePolyATail(processedRNAShortTail)).toBe(false); // 3 A's < default min
      expect(has3PrimePolyATail(processedRNAShortTail, 2)).toBe(true); // 3 A's >= 2
    });
  });

  describe('get3PrimePolyATailLength', () => {
    test('returns correct poly-A tail length', () => {
      const rna1 = new RNA('AUGAAACCCGGGAAAAAAAAAA'); // 10 A's
      const rna2 = new RNA('AUGAAACCCGGGCCC'); // No A's at end
      const rna3 = new RNA('AUGAAACCCGGGAAA'); // 3 A's

      expect(get3PrimePolyATailLength(rna1)).toBe(10);
      expect(get3PrimePolyATailLength(rna2)).toBe(0);
      expect(get3PrimePolyATailLength(rna3)).toBe(3);
    });

    test('handles edge cases', () => {
      const allARNA = new RNA('AAAAAAAAAA');
      const noARNA = new RNA('CCCGGGCCC');

      expect(get3PrimePolyATailLength(allARNA)).toBe(10);
      expect(get3PrimePolyATailLength(noARNA)).toBe(0);
    });

    test('returns poly-A tail length from ProcessedRNA', () => {
      // Test line 208: when rna instanceof ProcessedRNA
      const processedRNA = new ProcessedRNA('AUGAAACCCGGG', undefined, true, 'AAAAAAA');
      const processedRNANoTail = new ProcessedRNA('AUGAAACCCGGG', undefined, true, '');

      expect(get3PrimePolyATailLength(processedRNA)).toBe(7);
      expect(get3PrimePolyATailLength(processedRNANoTail)).toBe(0);
    });
  });

  describe('getCoreSequence', () => {
    test('removes both cap and poly-A tail', () => {
      const rna = new ProcessedRNA('AUGAAACCCGGG', undefined, true, 'AAAAAAAAAA');
      const core = getCoreSequence(rna);

      expect(core).toBe('AUGAAACCCGGG');
    });

    test('removes only cap when no poly-A tail', () => {
      const rna = new ProcessedRNA('AUGAAACCCGGGCCC', undefined, true, '');
      const core = getCoreSequence(rna);

      expect(core).toBe('AUGAAACCCGGGCCC');
    });

    test('removes only poly-A tail when no cap', () => {
      const rna = new RNA('AUGAAACCCGGGAAAAAAAAAA');
      const core = getCoreSequence(rna);

      expect(core).toBe('AUGAAACCCGGG');
    });

    test('returns unchanged sequence when no modifications', () => {
      const rna = new RNA('AUGAAACCCGGGCCC');
      const core = getCoreSequence(rna);

      expect(core).toBe('AUGAAACCCGGGCCC');
    });
  });

  describe('isFullyProcessed', () => {
    test('detects fully processed RNA', () => {
      const fullyProcessed = new ProcessedRNA('AUGAAACCCGGG', undefined, true, 'AAAAAAAAAA');
      const onlyCapped = new ProcessedRNA('AUGAAACCCGGGCCC', undefined, true, '');
      const onlyPolyA = new ProcessedRNA('AUGAAACCCGGG', undefined, false, 'AAAAAAAAAA');
      const unprocessed = new RNA('AUGAAACCCGGGCCC');

      expect(isFullyProcessed(fullyProcessed)).toBe(true);
      expect(isFullyProcessed(onlyCapped)).toBe(false);
      expect(isFullyProcessed(onlyPolyA)).toBe(false);
      expect(isFullyProcessed(unprocessed)).toBe(false);
    });
  });
});
