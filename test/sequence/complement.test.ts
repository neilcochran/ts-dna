import {
  DNA,
  RNA,
  parseDNA,
  parseRNA,
  complement,
  reverseComplement,
  complementDNABase,
  complementRNABase,
} from '../../src/sequence';

function dna(sequence: string) {
  return parseDNA(sequence).unwrap();
}

function rna(sequence: string) {
  return parseRNA(sequence).unwrap();
}

describe('complement (free function)', () => {
  test('returns the complement of a DNA sequence', () => {
    expect(complement(dna('ATCG')).sequence).toBe('TAGC');
  });

  test('returns the complement of an RNA sequence', () => {
    expect(complement(rna('AUCG')).sequence).toBe('UAGC');
  });

  test('return type is the expected sibling class', () => {
    expect(complement(dna('ATCG'))).toBeInstanceOf(DNA);
    expect(complement(rna('AUCG'))).toBeInstanceOf(RNA);
  });
});

describe('reverseComplement (free function)', () => {
  test('returns the reverse complement of a DNA sequence', () => {
    expect(reverseComplement(dna('ATCG')).sequence).toBe('CGAT');
  });

  test('returns the reverse complement of an RNA sequence', () => {
    expect(reverseComplement(rna('AUCG')).sequence).toBe('CGAU');
  });

  test('palindromic restriction site equals its reverse complement', () => {
    expect(reverseComplement(dna('GAATTC')).sequence).toBe('GAATTC');
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
