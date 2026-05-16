import {
  DNA,
  RNA,
  complement,
  reverseComplement,
  complementDNABase,
  complementRNABase,
} from '../../src/sequence';

describe('complement (free function)', () => {
  test('returns the complement of a DNA sequence', () => {
    expect(complement(new DNA('ATCG')).sequence).toBe('TAGC');
  });

  test('returns the complement of an RNA sequence', () => {
    expect(complement(new RNA('AUCG')).sequence).toBe('UAGC');
  });

  test('preserves the runtime tag', () => {
    expect(complement(new DNA('ATCG')).nucleicAcidType).toBe('DNA');
    expect(complement(new RNA('AUCG')).nucleicAcidType).toBe('RNA');
  });
});

describe('reverseComplement (free function)', () => {
  test('returns the reverse complement of a DNA sequence', () => {
    expect(reverseComplement(new DNA('ATCG')).sequence).toBe('CGAT');
  });

  test('returns the reverse complement of an RNA sequence', () => {
    expect(reverseComplement(new RNA('AUCG')).sequence).toBe('CGAU');
  });

  test('palindromic restriction site equals its reverse complement', () => {
    expect(reverseComplement(new DNA('GAATTC')).sequence).toBe('GAATTC');
  });
});

describe('complementDNABase', () => {
  test.each([
    ['A', 'T'],
    ['T', 'A'],
    ['C', 'G'],
    ['G', 'C'],
  ])('complements %s to %s', (input, expected) => {
    expect(complementDNABase(input)).toBe(expected);
  });

  test('returns undefined for invalid base', () => {
    expect(complementDNABase('U')).toBeUndefined();
    expect(complementDNABase('X')).toBeUndefined();
    expect(complementDNABase('a')).toBeUndefined();
    expect(complementDNABase('')).toBeUndefined();
  });
});

describe('complementRNABase', () => {
  test.each([
    ['A', 'U'],
    ['U', 'A'],
    ['C', 'G'],
    ['G', 'C'],
  ])('complements %s to %s', (input, expected) => {
    expect(complementRNABase(input)).toBe(expected);
  });

  test('returns undefined for invalid base', () => {
    expect(complementRNABase('T')).toBeUndefined();
    expect(complementRNABase('X')).toBeUndefined();
    expect(complementRNABase('a')).toBeUndefined();
    expect(complementRNABase('')).toBeUndefined();
  });
});
