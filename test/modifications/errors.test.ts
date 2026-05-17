import {
  describeMRNAError,
  describeProcessingError,
  type MRNAError,
  type ProcessingError,
} from '../../src/modifications';

describe('describeMRNAError', () => {
  const cases: { error: MRNAError; expected: RegExp }[] = [
    {
      error: { kind: 'invalid-sequence', cause: { kind: 'empty-sequence' } },
      expected: /Invalid mRNA sequence/,
    },
    {
      error: {
        kind: 'invalid-coding-boundaries',
        codingStart: -1,
        codingEnd: 5,
        sequenceLength: 10,
      },
      expected: /Invalid coding-sequence boundaries.*start=-1.*end=5.*length=10/,
    },
    {
      error: { kind: 'invalid-polya-tail-length', polyATailLength: 50, sequenceLength: 30 },
      expected: /Invalid poly-A tail length 50.*length \(30\)/,
    },
  ];

  for (const { error, expected } of cases) {
    test(`renders ${error.kind}`, () => {
      expect(describeMRNAError(error)).toMatch(expected);
    });
  }
});

describe('describeProcessingError', () => {
  const cases: { error: ProcessingError; expected: RegExp }[] = [
    {
      error: { kind: 'invalid-sequence', cause: { kind: 'empty-sequence' } },
      expected: /Invalid mRNA sequence/,
    },
    {
      error: {
        kind: 'invalid-coding-boundaries',
        codingStart: -1,
        codingEnd: 5,
        sequenceLength: 10,
      },
      expected: /Invalid coding-sequence boundaries.*start=-1.*end=5.*length=10/,
    },
    {
      error: { kind: 'invalid-polya-tail-length', polyATailLength: 50, sequenceLength: 30 },
      expected: /Invalid poly-A tail length 50.*length \(30\)/,
    },
    {
      error: { kind: 'splicing-failed', cause: { kind: 'no-exons' } },
      expected: /Splicing failed.*no exons/i,
    },
    { error: { kind: 'no-start-codon' }, expected: /No start codon/ },
    { error: { kind: 'no-in-frame-stop' }, expected: /No in-frame stop codon/ },
  ];

  for (const { error, expected } of cases) {
    test(`renders ${error.kind}`, () => {
      expect(describeProcessingError(error)).toMatch(expected);
    });
  }

  test('delegates the MRNAError subset to describeMRNAError', () => {
    const mRNAError: MRNAError = { kind: 'invalid-sequence', cause: { kind: 'empty-sequence' } };
    expect(describeProcessingError(mRNAError)).toBe(describeMRNAError(mRNAError));
  });
});
