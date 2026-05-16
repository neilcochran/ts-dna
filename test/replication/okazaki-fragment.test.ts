import { OkazakiFragment, parseOkazakiFragment, parseRNAPrimer } from '../../src/replication';
import { unsafeOkazakiFragment } from '../../src/replication/OkazakiFragment';
import { UNSAFE_OKAZAKI_KEY } from '../../src/replication/internal-keys';
import { parseDNA } from '../../src/sequence';
import { isFailure, isSuccess } from '../../src/result/Result';

const PRIMER_AT_0 = parseRNAPrimer('AUCG', 0).unwrap();
const PRIMER_AT_100 = parseRNAPrimer('AUCG', 100).unwrap();

describe('OkazakiFragment', () => {
  describe('parseOkazakiFragment', () => {
    test('accepts a fragment with matching primer position and no sequence yet', () => {
      const result = parseOkazakiFragment('frag-1', 0, 1000, PRIMER_AT_0);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const f = result.data;
        expect(f.id).toBe('frag-1');
        expect(f.startPosition).toBe(0);
        expect(f.endPosition).toBe(1000);
        expect(f.length()).toBe(1000);
        expect(f.sequence).toBeUndefined();
        expect(f.isPrimerRemoved).toBe(false);
        expect(f.isLigated).toBe(false);
        expect(f.isComplete()).toBe(false);
      }
    });

    test('accepts a fragment with a matching DNA sequence', () => {
      const sequence = parseDNA('ATCG').unwrap();
      const result = parseOkazakiFragment('frag-x', 100, 104, PRIMER_AT_100, { sequence });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.sequence?.sequence).toBe('ATCG');
      }
    });

    test('rejects empty id', () => {
      const result = parseOkazakiFragment('', 0, 100, PRIMER_AT_0);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.kind).toBe('empty-id');
      }
    });

    test('rejects negative start position', () => {
      const result = parseOkazakiFragment('frag', -1, 100, PRIMER_AT_0);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result) && result.error.kind === 'invalid-position') {
        expect(result.error.position).toBe(-1);
      }
    });

    test('rejects non-integer start position', () => {
      const result = parseOkazakiFragment('frag', 1.5, 100, PRIMER_AT_0);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.kind).toBe('invalid-position');
      }
    });

    test('rejects endPosition not strictly greater than startPosition', () => {
      const result = parseOkazakiFragment('frag', 100, 100, PRIMER_AT_100);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result) && result.error.kind === 'invalid-range') {
        expect(result.error.startPosition).toBe(100);
        expect(result.error.endPosition).toBe(100);
      }
    });

    test('rejects when primer position does not equal startPosition', () => {
      const result = parseOkazakiFragment('frag', 50, 150, PRIMER_AT_0);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result) && result.error.kind === 'primer-position-mismatch') {
        expect(result.error.primerPosition).toBe(0);
        expect(result.error.startPosition).toBe(50);
      }
    });

    test('rejects sequence whose length does not match the range', () => {
      const sequence = parseDNA('AT').unwrap();
      const result = parseOkazakiFragment('frag', 0, 10, PRIMER_AT_0, { sequence });
      expect(isFailure(result)).toBe(true);
      if (isFailure(result) && result.error.kind === 'sequence-length-mismatch') {
        expect(result.error.sequenceLength).toBe(2);
        expect(result.error.expectedLength).toBe(10);
      }
    });

    test('honours optional isPrimerRemoved and isLigated flags', () => {
      const sequence = parseDNA('ATCG').unwrap();
      const result = parseOkazakiFragment('frag', 100, 104, PRIMER_AT_100, {
        sequence,
        isPrimerRemoved: true,
        isLigated: true,
      });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.isPrimerRemoved).toBe(true);
        expect(result.data.isLigated).toBe(true);
        expect(result.data.isComplete()).toBe(true);
      }
    });
  });

  describe('constructor', () => {
    test('rejects calls without the trusted key', () => {
      expect(
        () =>
          new OkazakiFragment(
            'frag',
            0,
            10,
            PRIMER_AT_0,
            undefined,
            false,
            false,
            undefined as never,
          ),
      ).toThrow(/module-private/);
    });
  });

  describe('lifecycle helpers', () => {
    test('withSequence returns a new instance with the sequence populated', () => {
      const original = parseOkazakiFragment('frag', 0, 4, PRIMER_AT_0).unwrap();
      const sequence = parseDNA('ATCG').unwrap();
      const next = original.withSequence(sequence);
      expect(next).not.toBe(original);
      expect(original.sequence).toBeUndefined();
      expect(next.sequence?.sequence).toBe('ATCG');
    });

    test('withPrimerRemoved returns a new instance flagged as removed', () => {
      const original = parseOkazakiFragment('frag', 0, 4, PRIMER_AT_0).unwrap();
      const next = original.withPrimerRemoved();
      expect(original.isPrimerRemoved).toBe(false);
      expect(next.isPrimerRemoved).toBe(true);
      expect(next.isLigated).toBe(false);
    });

    test('withLigated returns a new instance flagged as ligated', () => {
      const original = parseOkazakiFragment('frag', 0, 4, PRIMER_AT_0).unwrap();
      const next = original.withLigated();
      expect(original.isLigated).toBe(false);
      expect(next.isLigated).toBe(true);
    });

    test('isComplete requires sequence + primer-removed + ligated', () => {
      const sequence = parseDNA('ATCG').unwrap();
      const stages = [
        parseOkazakiFragment('frag', 0, 4, PRIMER_AT_0).unwrap(),
        parseOkazakiFragment('frag', 0, 4, PRIMER_AT_0, { sequence }).unwrap(),
        parseOkazakiFragment('frag', 0, 4, PRIMER_AT_0, {
          sequence,
          isPrimerRemoved: true,
        }).unwrap(),
        parseOkazakiFragment('frag', 0, 4, PRIMER_AT_0, {
          sequence,
          isPrimerRemoved: true,
          isLigated: true,
        }).unwrap(),
      ];
      expect(stages.map(s => s.isComplete())).toEqual([false, false, false, true]);
    });
  });

  describe('internal unsafe factory', () => {
    test('bypasses validation', () => {
      const sequence = parseDNA('A').unwrap();
      const frag = unsafeOkazakiFragment('x', 100, 101, PRIMER_AT_0, sequence, false, false);
      expect(frag.id).toBe('x');
      expect(frag.length()).toBe(1);
    });

    test('UNSAFE_OKAZAKI_KEY is a unique symbol', () => {
      expect(typeof UNSAFE_OKAZAKI_KEY).toBe('symbol');
    });
  });
});
