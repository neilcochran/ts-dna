import { parseAminoAcid, describeTranslationError } from '../../src/translation';
import { isSuccess, isFailure } from '../../src/result';
import { STOP_CODONS } from '../../src/sequence';

describe('parseAminoAcid', () => {
  test('parses a valid codon and returns an AminoAcid', () => {
    const result = parseAminoAcid('AUG');
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.codon.sequence).toBe('AUG');
      expect(result.data.data.singleLetterCode).toBe('M');
      expect(result.data.data.name).toBe('Methionine');
    }
  });

  test('normalizes case via underlying parseRNA', () => {
    const result = parseAminoAcid('aug');
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.codon.sequence).toBe('AUG');
    }
  });

  test('rejects empty input with invalid-codon-sequence', () => {
    const result = parseAminoAcid('');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.kind).toBe('invalid-codon-sequence');
    }
  });

  test('rejects non-RNA characters with invalid-codon-sequence', () => {
    const result = parseAminoAcid('ATG'); // T is DNA-only
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.kind).toBe('invalid-codon-sequence');
    }
  });

  test('rejects too-short codon with invalid-codon-length', () => {
    const result = parseAminoAcid('AU');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result) && result.error.kind === 'invalid-codon-length') {
      expect(result.error.length).toBe(2);
      expect(result.error.expected).toBe(3);
    }
  });

  test('rejects too-long codon with invalid-codon-length', () => {
    const result = parseAminoAcid('AUGG');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result) && result.error.kind === 'invalid-codon-length') {
      expect(result.error.length).toBe(4);
      expect(result.error.expected).toBe(3);
    }
  });

  test('rejects every stop codon with stop-codon', () => {
    for (const stop of STOP_CODONS) {
      const result = parseAminoAcid(stop);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result) && result.error.kind === 'stop-codon') {
        expect(result.error.codon).toBe(stop);
      }
    }
  });

  test('every sense codon resolves to its data entry', () => {
    const codons = ['AUG', 'UUU', 'UUC', 'AAA', 'GCA', 'GAC', 'UGG', 'UAC'];
    for (const codon of codons) {
      const result = parseAminoAcid(codon);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.data.codons).toContain(codon);
      }
    }
  });

  test('describeTranslationError renders each variant', () => {
    expect(describeTranslationError({ kind: 'stop-codon', codon: 'UAA' })).toContain('UAA');
    expect(
      describeTranslationError({
        kind: 'invalid-codon-length',
        codon: 'AU',
        length: 2,
        expected: 3,
      }),
    ).toContain('length 2');
    expect(
      describeTranslationError({ kind: 'invalid-codon', codon: 'AUG', position: 9 }),
    ).toContain('position 9');
    expect(
      describeTranslationError({
        kind: 'invalid-reading-frame',
        codingLength: 7,
        codonLength: 3,
      }),
    ).toContain('not a multiple');
  });
});
