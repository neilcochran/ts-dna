import {
  Result,
  SuccessResult,
  FailureResult,
  success,
  failure,
  isSuccess,
  isFailure,
  map,
  chain,
  unwrap,
  unwrapOr,
  match,
} from '../../src/result/Result';

describe('Result module', () => {
  describe('success helper', () => {
    test('creates a SuccessResult with the data payload', () => {
      const result = success('hello');
      expect(result.success).toBe(true);
      expect(result.data).toBe('hello');
      expect(result).toBeInstanceOf(SuccessResult);
    });

    test('preserves data type information', () => {
      const result = success(42);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    test('handles complex types', () => {
      const obj = { name: 'foo', count: 3 };
      const result = success(obj);
      expect(result.data).toEqual(obj);
    });
  });

  describe('failure helper', () => {
    test('creates a FailureResult with a string error', () => {
      const result = failure('something went wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('something went wrong');
      expect(result).toBeInstanceOf(FailureResult);
    });

    test('creates a FailureResult with a custom error type', () => {
      interface CustomError {
        code: number;
        message: string;
      }
      const err: CustomError = { code: 42, message: 'nope' };
      const result = failure(err);
      expect(result.error).toEqual(err);
    });
  });

  describe('Result.success / Result.failure static factories', () => {
    test('Result.success is equivalent to the free function', () => {
      const fromStatic = Result.success(7);
      const fromFree = success(7);
      expect(fromStatic.data).toBe(fromFree.data);
      expect(fromStatic.success).toBe(true);
    });

    test('Result.failure is equivalent to the free function', () => {
      const fromStatic = Result.failure('oops');
      const fromFree = failure('oops');
      expect(fromStatic.error).toBe(fromFree.error);
      expect(fromStatic.success).toBe(false);
    });
  });

  describe('isSuccess / isFailure type guards', () => {
    test('isSuccess narrows the type on a success', () => {
      const result: Result<string> = success('ok');
      if (isSuccess(result)) {
        expect(result.data).toBe('ok');
      } else {
        throw new Error('expected success');
      }
    });

    test('isFailure narrows the type on a failure', () => {
      const result: Result<string> = failure('err');
      if (isFailure(result)) {
        expect(result.error).toBe('err');
      } else {
        throw new Error('expected failure');
      }
    });

    test('isSuccess returns false on a failure', () => {
      const result: Result<string> = failure('err');
      expect(isSuccess(result)).toBe(false);
    });

    test('isFailure returns false on a success', () => {
      const result: Result<string> = success('ok');
      expect(isFailure(result)).toBe(false);
    });
  });

  describe('direct discriminated-union narrowing on result.success', () => {
    test('if (result.success) narrows to SuccessResult', () => {
      const result: Result<string> = success('ok');
      if (result.success) {
        expect(result.data).toBe('ok');
      } else {
        throw new Error('expected success');
      }
    });

    test('if (!result.success) narrows to FailureResult', () => {
      const result: Result<string> = failure('boom');
      if (!result.success) {
        expect(result.error).toBe('boom');
      } else {
        throw new Error('expected failure');
      }
    });
  });

  describe('map (free function)', () => {
    test('maps a success', () => {
      const result = map(success(2), n => n * 10);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(20);
      }
    });

    test('leaves a failure unchanged', () => {
      const result: Result<number, string> = failure('nope');
      const mapped = map(result, n => n * 10);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe('nope');
      }
    });

    test('changes data type', () => {
      const result = map(success(7), n => `value=${n}`);
      if (isSuccess(result)) {
        expect(result.data).toBe('value=7');
      }
    });
  });

  describe('chain (free function)', () => {
    test('chains successes', () => {
      const parse = (s: string): Result<number, string> => {
        const n = Number(s);
        return Number.isNaN(n) ? failure('not a number') : success(n);
      };
      const double = (n: number): Result<number, string> => success(n * 2);

      const result = chain(parse('21'), double);
      if (isSuccess(result)) {
        expect(result.data).toBe(42);
      } else {
        throw new Error('expected success');
      }
    });

    test('stops on first failure', () => {
      const parse = (s: string): Result<number, string> => failure('parse failed: ' + s);
      const double = jest.fn((n: number): Result<number, string> => success(n * 2));

      const result = chain(parse('x'), double);
      expect(double).not.toHaveBeenCalled();
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('parse failed');
      }
    });
  });

  describe('unwrap (free function)', () => {
    test('returns the data on a success', () => {
      expect(unwrap(success(99))).toBe(99);
    });

    test('throws on a failure', () => {
      expect(() => unwrap(failure('nope'))).toThrow('nope');
    });

    test('throws with generic message for non-string errors', () => {
      const result = failure({ code: 1 });
      expect(() => unwrap(result)).toThrow('Result is a failure');
    });
  });

  describe('unwrapOr (free function)', () => {
    test('returns the data on a success', () => {
      expect(unwrapOr(success(7), 99)).toBe(7);
    });

    test('returns the default on a failure', () => {
      const result: Result<number, string> = failure('nope');
      expect(unwrapOr(result, 99)).toBe(99);
    });
  });

  describe('match (free function)', () => {
    test('runs the success handler on a success', () => {
      const result: Result<number, string> = success(3);
      const out = match(result, {
        success: n => `ok:${n}`,
        failure: e => `err:${e}`,
      });
      expect(out).toBe('ok:3');
    });

    test('runs the failure handler on a failure', () => {
      const result: Result<number, string> = failure('boom');
      const out = match(result, {
        success: n => `ok:${n}`,
        failure: e => `err:${e}`,
      });
      expect(out).toBe('err:boom');
    });
  });

  describe('class methods on Result', () => {
    test('.map on a success transforms the data', () => {
      const r = success(5).map(n => n + 1);
      expect(r.data).toBe(6);
    });

    test('.map on a failure passes through', () => {
      const r: Result<number, string> = failure('e');
      const mapped = r.map(n => n + 1);
      expect(isFailure(mapped)).toBe(true);
    });

    test('.chain on a success runs the mapper', () => {
      const r = success(5).chain(n => success(n * 2));
      if (isSuccess(r)) {
        expect(r.data).toBe(10);
      }
    });

    test('.chain on a failure short-circuits', () => {
      const mapper = jest.fn((n: number) => success(n * 2));
      const r: Result<number, string> = failure('e');
      r.chain(mapper);
      expect(mapper).not.toHaveBeenCalled();
    });

    test('.mapError transforms the failure payload', () => {
      const r: Result<number, string> = failure('e');
      const mapped = r.mapError(e => `[wrapped] ${e}`);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe('[wrapped] e');
      }
    });

    test('.mapError on a success is a no-op', () => {
      const r = success(3).mapError(() => 'whatever');
      expect(r.data).toBe(3);
    });

    test('.unwrap on success returns the data', () => {
      expect(success(11).unwrap()).toBe(11);
    });

    test('.unwrap on failure throws', () => {
      expect(() => failure('e').unwrap()).toThrow('e');
    });

    test('.unwrapOr returns data on success and default on failure', () => {
      expect(success(11).unwrapOr(0)).toBe(11);
      const r: Result<number, string> = failure('e');
      expect(r.unwrapOr(99)).toBe(99);
    });

    test('.match runs the matching handler', () => {
      const ok = success(3).match({
        success: n => `ok:${n}`,
        failure: () => 'err',
      });
      expect(ok).toBe('ok:3');

      const err = failure('boom').match<string>({
        success: () => 'ok',
        failure: e => `err:${e}`,
      });
      expect(err).toBe('err:boom');
    });
  });

  describe('isSuccess / isFailure as instance methods', () => {
    test('isSuccess() returns true on a success', () => {
      const r: Result<number, string> = success(1);
      expect(r.isSuccess()).toBe(true);
      expect(r.isFailure()).toBe(false);
    });

    test('isFailure() returns true on a failure', () => {
      const r: Result<number, string> = failure('e');
      expect(r.isFailure()).toBe(true);
      expect(r.isSuccess()).toBe(false);
    });
  });
});
