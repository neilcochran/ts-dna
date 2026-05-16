import { RNA } from '../../src/sequence';
import {
  add5PrimeCap,
  add3PrimePolyATail,
  add3PrimePolyATailAtSite,
  remove3PrimePolyATail,
  has5PrimeCap,
  has3PrimePolyATail,
  get3PrimePolyATailLength,
  getCoreSequence,
  isFullyProcessed,
  parseMRNA,
  type PolyadenylationSite,
} from '../../src/processing';
import {
  DEFAULT_POLY_A_TAIL_LENGTH,
  MAX_POLY_A_TAIL_LENGTH,
} from '../../src/constants/biological-constants';
import { isSuccess, isFailure } from '../../src/result';

describe('add5PrimeCap', () => {
  test('marks an uncapped MRNA capped', () => {
    const mrna = parseMRNA('AUGAAACCCGGG', 0, 12, false, 0).unwrap();
    const capped = add5PrimeCap(mrna);
    expect(capped.fivePrimeCap).toBe(true);
    expect(capped.sequence.sequence).toBe(mrna.sequence.sequence);
    expect(capped.codingStart).toBe(0);
    expect(capped.codingEnd).toBe(12);
  });

  test('returns the same instance when already capped', () => {
    const mrna = parseMRNA('AUGAAACCCGGG', 0, 12, true, 0).unwrap();
    expect(add5PrimeCap(mrna)).toBe(mrna);
  });
});

describe('add3PrimePolyATail', () => {
  test('cleaves at the supplied site and appends the tail', () => {
    const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
    const result = add3PrimePolyATail(rna, 15, 10);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.sequence).toBe('AUGAAACCCGGGAAU' + 'A'.repeat(10));
    }
  });

  test('applies the default tail length when omitted', () => {
    const rna = new RNA('AUGAAACCCGGG');
    const result = add3PrimePolyATail(rna, 12);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.sequence.length).toBe(12 + DEFAULT_POLY_A_TAIL_LENGTH);
    }
  });

  test('clamps cleavage site beyond sequence length to the sequence end', () => {
    const rna = new RNA('AUGAAACCCGGG');
    const result = add3PrimePolyATail(rna, 100, 5);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.sequence).toBe('AUGAAACCCGGGAAAAA');
    }
  });

  test('rejects a negative cleavage site', () => {
    const rna = new RNA('AUGAAACCCGGG');
    const result = add3PrimePolyATail(rna, -1);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result) && result.error.kind === 'invalid-cleavage-site') {
      expect(result.error.cleavageSite).toBe(-1);
    }
  });

  test('rejects a negative tail length', () => {
    const rna = new RNA('AUGAAACCCGGG');
    const result = add3PrimePolyATail(rna, 12, -10);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.kind).toBe('invalid-tail-length');
    }
  });

  test('rejects a tail length larger than MAX_POLY_A_TAIL_LENGTH', () => {
    const rna = new RNA('AUGAAACCCGGG');
    const result = add3PrimePolyATail(rna, 12, MAX_POLY_A_TAIL_LENGTH + 1);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result) && result.error.kind === 'invalid-tail-length') {
      expect(result.error.max).toBe(MAX_POLY_A_TAIL_LENGTH);
    }
  });
});

describe('add3PrimePolyATailAtSite', () => {
  test("uses the site's cleavageSite when present", () => {
    const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
    const site: PolyadenylationSite = {
      position: 12,
      signal: 'AAUAAA',
      strength: 100,
      cleavageSite: 20,
    };
    const result = add3PrimePolyATailAtSite(rna, site, 10);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.sequence).toBe('AUGAAACCCGGGAAUAAACC' + 'A'.repeat(10));
    }
  });

  test('falls back to signal position + length + default offset when cleavageSite is undefined', () => {
    const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
    const site: PolyadenylationSite = {
      position: 12,
      signal: 'AAUAAA',
      strength: 100,
    };
    const result = add3PrimePolyATailAtSite(rna, site, 5);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      // position 12 + signal 6 + default offset 15 = 33, clamped to sequence length 21
      expect(result.data.sequence).toBe('AUGAAACCCGGGAAUAAACCC' + 'A'.repeat(5));
    }
  });
});

describe('remove3PrimePolyATail', () => {
  test('strips a trailing A run', () => {
    const result = remove3PrimePolyATail(new RNA('AUGAAACCCGGGAAAAAAAAAA'));
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.sequence).toBe('AUGAAACCCGGG');
    }
  });

  test('fails when no trailing A run is found', () => {
    const result = remove3PrimePolyATail(new RNA('AUGAAACCCGGGCCC'));
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe('no-tail');
    }
  });
});

describe('has5PrimeCap', () => {
  test('returns true when the MRNA carries a cap', () => {
    expect(has5PrimeCap(parseMRNA('AUGAAACCCGGG', 0, 12, true, 0).unwrap())).toBe(true);
  });

  test('returns false when the MRNA is uncapped', () => {
    expect(has5PrimeCap(parseMRNA('AUGAAACCCGGG', 0, 12, false, 0).unwrap())).toBe(false);
  });
});

describe('has3PrimePolyATail', () => {
  test('detects a trailing A run of the default minimum length', () => {
    expect(has3PrimePolyATail(new RNA('AUGAAACCCGGGAAAAAAAAAA'))).toBe(true);
    expect(has3PrimePolyATail(new RNA('AUGAAACCCGGGCCC'))).toBe(false);
    expect(has3PrimePolyATail(new RNA('AUGAAACCCGGGAAA'))).toBe(false);
  });

  test('respects a custom minimum length', () => {
    const rna = new RNA('AUGAAACCCGGGAAAAA');
    expect(has3PrimePolyATail(rna, 3)).toBe(true);
    expect(has3PrimePolyATail(rna, 5)).toBe(true);
    expect(has3PrimePolyATail(rna, 10)).toBe(false);
  });
});

describe('get3PrimePolyATailLength', () => {
  test('counts trailing A bases', () => {
    expect(get3PrimePolyATailLength(new RNA('AUGAAACCCGGGAAAAAAAAAA'))).toBe(10);
    expect(get3PrimePolyATailLength(new RNA('AUGAAACCCGGGCCC'))).toBe(0);
    expect(get3PrimePolyATailLength(new RNA('AUGAAACCCGGGAAA'))).toBe(3);
  });
});

describe('getCoreSequence', () => {
  test('strips the trailing A run', () => {
    expect(getCoreSequence(new RNA('AUGAAACCCGGGAAAAAAAAAA'))).toBe('AUGAAACCCGGG');
  });

  test('returns the input unchanged when no trailing A run is present', () => {
    expect(getCoreSequence(new RNA('AUGAAACCCGGGCCC'))).toBe('AUGAAACCCGGGCCC');
  });
});

describe('isFullyProcessed', () => {
  test('requires both cap and minimum poly-A tail length', () => {
    expect(isFullyProcessed(parseMRNA('AUGAAACCCGGGAAAAAAAAAA', 0, 12, true, 10).unwrap())).toBe(
      true,
    );
    expect(isFullyProcessed(parseMRNA('AUGAAACCCGGGAAAAAAAAAA', 0, 12, false, 10).unwrap())).toBe(
      false,
    );
    expect(isFullyProcessed(parseMRNA('AUGAAACCCGGGAAAAA', 0, 12, true, 5).unwrap())).toBe(false);
  });
});
