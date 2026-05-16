import { describePatternError } from '../../src/pattern';
import type { PatternError } from '../../src/pattern';

describe('describePatternError', () => {
  test('renders empty-pattern', () => {
    const error: PatternError = { kind: 'empty-pattern' };
    expect(describePatternError(error)).toBe('Nucleotide pattern cannot be empty');
  });

  test('renders empty-symbol', () => {
    const error: PatternError = { kind: 'empty-symbol' };
    expect(describePatternError(error)).toBe('Nucleotide pattern symbol cannot be empty');
  });

  test('renders invalid-iupac-character with the offending character and index', () => {
    const error: PatternError = { kind: 'invalid-iupac-character', character: 'X', index: 3 };
    const message = describePatternError(error);
    expect(message).toContain("'X'");
    expect(message).toContain('3');
  });

  test('renders invalid-iupac-symbol naming the symbol', () => {
    const error: PatternError = { kind: 'invalid-iupac-symbol', symbol: 'Z' };
    expect(describePatternError(error)).toContain("'Z'");
  });

  test('renders invalid-regex-construction including the underlying cause', () => {
    const error: PatternError = {
      kind: 'invalid-regex-construction',
      pattern: 'A{',
      cause: 'Invalid quantifier',
    };
    const message = describePatternError(error);
    expect(message).toContain('A{');
    expect(message).toContain('Invalid quantifier');
  });
});
