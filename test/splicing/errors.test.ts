import { describeSplicingError, type SplicingError } from '../../src/splicing';

describe('describeSplicingError', () => {
  const cases: { error: SplicingError; expected: RegExp }[] = [
    { error: { kind: 'no-exons' }, expected: /no exons/i },
    {
      error: {
        kind: 'exon-out-of-bounds',
        exonIndex: 1,
        start: 10,
        end: 20,
        sequenceLength: 15,
      },
      expected: /Exon 1.*10-20.*length 15/,
    },
    {
      error: { kind: 'invalid-donor-site', intronIndex: 0, position: 3, found: 'AU' },
      expected: /Invalid 5' splice site.*position 3.*GU.*AU/,
    },
    {
      error: { kind: 'invalid-acceptor-site', intronIndex: 0, position: 8, found: 'UU' },
      expected: /Invalid 3' splice site.*position 8.*AG.*UU/,
    },
    {
      error: { kind: 'intron-too-short', intronIndex: 0, length: 2, min: 4 },
      expected: /Intron 0.*too short.*2 bp.*minimum 4/,
    },
    {
      error: {
        kind: 'variant-invalid-exon-index',
        variantName: 'bad',
        exonIndex: 5,
        totalExons: 3,
      },
      expected: /Variant 'bad'.*invalid exon index 5.*3 exons/,
    },
    {
      error: { kind: 'variant-skips-first-exon', variantName: 'v' },
      expected: /Variant 'v'.*skips the first exon/,
    },
    {
      error: { kind: 'variant-skips-last-exon', variantName: 'v' },
      expected: /Variant 'v'.*skips the last exon/,
    },
    {
      error: {
        kind: 'variant-below-minimum-exons',
        variantName: 'v',
        included: 1,
        minimum: 3,
      },
      expected: /Variant 'v'.*1 exons.*minimum required is 3/,
    },
    {
      error: { kind: 'variant-not-in-frame', variantName: 'v', length: 13 },
      expected: /Variant 'v'.*reading frame.*13.*divisible by 3/,
    },
    {
      error: { kind: 'variant-missing-start-codon', variantName: 'v', found: 'CCC' },
      expected: /Variant 'v'.*start codon AUG.*'CCC'/,
    },
    {
      error: { kind: 'variant-missing-stop-codon', variantName: 'v', found: 'AAA' },
      expected: /Variant 'v'.*stop codon.*'AAA'/,
    },
    {
      error: { kind: 'no-splicing-profile' },
      expected: /does not have an alternative splicing profile/,
    },
    { error: { kind: 'no-default-variant' }, expected: /does not have a default splice variant/ },
  ];

  for (const { error, expected } of cases) {
    test(`renders ${error.kind}`, () => {
      expect(describeSplicingError(error)).toMatch(expected);
    });
  }
});
