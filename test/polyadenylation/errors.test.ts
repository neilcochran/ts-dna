import { describePolyadenylationError, type PolyadenylationError } from '../../src/polyadenylation';

describe('describePolyadenylationError', () => {
  const cases: { error: PolyadenylationError; expected: RegExp }[] = [
    {
      error: { kind: 'invalid-cleavage-site', cleavageSite: -1 },
      expected: /Invalid cleavage site -1/,
    },
    {
      error: { kind: 'invalid-tail-length', tailLength: 999_999, max: 1000 },
      expected: /Invalid poly-A tail length 999999.*between 0 and 1000/,
    },
  ];

  for (const { error, expected } of cases) {
    test(`renders ${error.kind}`, () => {
      expect(describePolyadenylationError(error)).toMatch(expected);
    });
  }
});
