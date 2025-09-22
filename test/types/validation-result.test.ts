import {
  ValidationResult,
  success,
  failure,
  isSuccess,
  isFailure,
  map,
  chain,
  unwrap,
  unwrapOr,
} from '../../src/types/validation-result';

describe('ValidationResult Types', () => {
  describe('success helper', () => {
    test('creates successful ValidationResult', () => {
      const result = success('test data');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('test data');
      }
    });

    test('preserves type information', () => {
      const numberResult = success(42);
      const stringResult = success('hello');
      const objectResult = success({ key: 'value' });

      if (isSuccess(numberResult)) {
        expect(numberResult.data).toBe(42);
      }
      if (isSuccess(stringResult)) {
        expect(stringResult.data).toBe('hello');
      }
      if (isSuccess(objectResult)) {
        expect(objectResult.data).toEqual({ key: 'value' });
      }
    });

    test('works with complex types', () => {
      interface TestData {
        id: number;
        name: string;
        values: number[];
      }

      const testData: TestData = {
        id: 1,
        name: 'test',
        values: [1, 2, 3],
      };

      const result = success(testData);
      if (isSuccess(result)) {
        expect(result.data).toEqual(testData);
      }
    });
  });

  describe('failure helper', () => {
    test('creates failed ValidationResult with string error', () => {
      const result = failure('Something went wrong');

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBe('Something went wrong');
      }
    });

    test('creates failed ValidationResult with custom error type', () => {
      interface CustomError {
        code: number;
        message: string;
      }

      const customError: CustomError = {
        code: 404,
        message: 'Not found',
      };

      const result = failure(customError);
      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toEqual(customError);
      }
    });

    test('handles empty error messages', () => {
      const result = failure('');
      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBe('');
      }
    });
  });

  describe('isSuccess type guard', () => {
    test('returns true for successful results', () => {
      const result = success('data');
      expect(isSuccess(result)).toBe(true);
    });

    test('returns false for failed results', () => {
      const result = failure('error');
      expect(isSuccess(result)).toBe(false);
    });

    test('narrows type correctly', () => {
      const result: ValidationResult<string> = success('test');

      if (isSuccess(result)) {
        // TypeScript should know result.data exists and is string
        expect(typeof result.data).toBe('string');
        expect(result.data).toBe('test');
      } else {
        fail('Expected success result');
      }
    });
  });

  describe('isFailure type guard', () => {
    test('returns false for successful results', () => {
      const result = success('data');
      expect(isFailure(result)).toBe(false);
    });

    test('returns true for failed results', () => {
      const result = failure('error');
      expect(isFailure(result)).toBe(true);
    });

    test('narrows type correctly', () => {
      const result: ValidationResult<string> = failure('test error');

      if (isFailure(result)) {
        // TypeScript should know result.error exists
        expect(typeof result.error).toBe('string');
        expect(result.error).toBe('test error');
      } else {
        fail('Expected failure result');
      }
    });
  });

  describe('map function', () => {
    test('maps successful result data', () => {
      const result = success(10);
      const mapped = map(result, x => x * 2);

      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe(20);
      }
    });

    test('leaves failed results unchanged', () => {
      const result = failure('original error');
      const mapped = map(result, x => x * 2);

      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe('original error');
      }
    });

    test('changes data type', () => {
      const result = success(42);
      const mapped = map(result, x => x.toString());

      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe('42');
        expect(typeof mapped.data).toBe('string');
      }
    });

    test('preserves error type', () => {
      interface CustomError {
        code: number;
        message: string;
      }

      const customError: CustomError = { code: 500, message: 'Server error' };
      const result: ValidationResult<number, CustomError> = failure(customError);
      const mapped = map(result, x => x.toString());

      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toEqual(customError);
      }
    });

    test('handles complex transformations', () => {
      const result = success({ name: 'John', age: 30 });
      const mapped = map(result, person => `${person.name} is ${person.age} years old`);

      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe('John is 30 years old');
      }
    });
  });

  describe('chain function', () => {
    test('chains successful operations', () => {
      const result = success(10);
      const chained = chain(result, x => success(x * 2));

      expect(isSuccess(chained)).toBe(true);
      if (isSuccess(chained)) {
        expect(chained.data).toBe(20);
      }
    });

    test('stops chain on first failure', () => {
      const result = success(10);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const chained = chain(result, () => failure('operation failed'));

      expect(isFailure(chained)).toBe(true);
      if (isFailure(chained)) {
        expect(chained.error).toBe('operation failed');
      }
    });

    test('does not execute mapper on failed input', () => {
      const result = failure('initial error');
      let mapperCalled = false;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const chained = chain(result, () => {
        mapperCalled = true;
        return success('should not happen');
      });

      expect(mapperCalled).toBe(false);
      expect(isFailure(chained)).toBe(true);
      if (isFailure(chained)) {
        expect(chained.error).toBe('initial error');
      }
    });

    test('enables sequential operations', () => {
      const parseNumber = (str: string): ValidationResult<number> => {
        const num = parseInt(str, 10);
        return isNaN(num) ? failure('Not a number') : success(num);
      };

      const multiplyByTwo = (n: number): ValidationResult<number> => {
        return success(n * 2);
      };

      const result1 = chain(parseNumber('10'), multiplyByTwo);
      expect(isSuccess(result1)).toBe(true);
      if (isSuccess(result1)) {
        expect(result1.data).toBe(20);
      }

      const result2 = chain(parseNumber('not a number'), multiplyByTwo);
      expect(isFailure(result2)).toBe(true);
      if (isFailure(result2)) {
        expect(result2.error).toBe('Not a number');
      }
    });

    test('changes result type', () => {
      const result = success(42);
      const chained = chain(result, x => success(x.toString()));

      expect(isSuccess(chained)).toBe(true);
      if (isSuccess(chained)) {
        expect(chained.data).toBe('42');
        expect(typeof chained.data).toBe('string');
      }
    });
  });

  describe('unwrap function', () => {
    test('extracts data from successful result', () => {
      const result = success('test data');
      const data = unwrap(result);

      expect(data).toBe('test data');
    });

    test('throws for failed result with string error', () => {
      const result = failure('Something went wrong');

      expect(() => unwrap(result)).toThrow('Something went wrong');
    });

    test('throws for failed result with custom error', () => {
      const customError = { code: 500, message: 'Server error' };
      const result = failure(customError);

      expect(() => unwrap(result)).toThrow('Validation failed');
    });

    test('preserves data type', () => {
      const numberResult = success(42);
      const stringResult = success('hello');
      const objectResult = success({ key: 'value' });

      expect(unwrap(numberResult)).toBe(42);
      expect(unwrap(stringResult)).toBe('hello');
      expect(unwrap(objectResult)).toEqual({ key: 'value' });
    });

    test('handles complex data types', () => {
      const complexData = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        metadata: {
          total: 2,
          page: 1,
        },
      };

      const result = success(complexData);
      const extracted = unwrap(result);

      expect(extracted).toEqual(complexData);
      expect(extracted.users).toHaveLength(2);
      expect(extracted.metadata.total).toBe(2);
    });
  });

  describe('unwrapOr function', () => {
    test('extracts data from successful result', () => {
      const result = success('test data');
      const data = unwrapOr(result, 'default');

      expect(data).toBe('test data');
    });

    test('returns default value for failed result', () => {
      const result = failure('error message');
      const data = unwrapOr(result, 'default value');

      expect(data).toBe('default value');
    });

    test('preserves data type consistency', () => {
      const successResult = success(42);
      const failureResult = failure('error');

      expect(unwrapOr(successResult, 0)).toBe(42);
      expect(unwrapOr(failureResult, 100)).toBe(100);
    });

    test('works with complex default values', () => {
      const defaultObject = { name: 'Default', value: 0 };
      const failureResult = failure('error');

      const result = unwrapOr(failureResult, defaultObject);
      expect(result).toEqual(defaultObject);
    });

    test('handles null and undefined defaults', () => {
      const failureResult = failure('error');

      expect(unwrapOr(failureResult, null)).toBeNull();
      expect(unwrapOr(failureResult, undefined)).toBeUndefined();
    });
  });

  describe('functional composition patterns', () => {
    test('combines map and chain operations', () => {
      const parseAndDouble = (str: string): ValidationResult<number> => {
        const num = parseInt(str, 10);
        return isNaN(num) ? failure('Not a number') : success(num);
      };

      const result = chain(
        map(success('10'), s => s.trim()),
        parseAndDouble,
      );

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(10);
      }
    });

    test('handles pipeline of operations', () => {
      const pipeline = (input: string): ValidationResult<string> => {
        const trimmed = map(success(input), s => s.trim());
        const validated = chain(trimmed, s =>
          s.length > 0 ? success(s) : failure('Empty string'),
        );
        const processed = map(validated, s => s.toUpperCase());
        return processed;
      };

      expect(unwrap(pipeline('  hello  '))).toBe('HELLO');
      expect(isFailure(pipeline('   '))).toBe(true);
    });

    test('short-circuits on first error', () => {
      let step2Called = false;
      let step3Called = false;

      const step1 = success(10);
      const step2 = chain(step1, () => {
        step2Called = true;
        return failure('Step 2 failed');
      });
      const step3 = map(step2, () => {
        step3Called = true;
        return 'should not reach here';
      });

      expect(step2Called).toBe(true);
      expect(step3Called).toBe(false);
      expect(isFailure(step3)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('handles empty string errors', () => {
      const result = failure('');
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBe('');
      }
    });

    test('handles null data values', () => {
      const result = success(null);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeNull();
      }
    });

    test('handles undefined data values', () => {
      const result = success(undefined);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeUndefined();
      }
    });

    test('preserves boolean false values', () => {
      const result = success(false);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });

    test('preserves zero values', () => {
      const result = success(0);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(0);
      }
    });

    test('map function with throwing mapper', () => {
      const result = success(10);

      expect(() => {
        map(result, () => {
          throw new Error('Mapper failed');
        });
      }).toThrow('Mapper failed');
    });

    test('chain function with throwing mapper', () => {
      const result = success(10);

      expect(() => {
        chain(result, () => {
          throw new Error('Chain mapper failed');
        });
      }).toThrow('Chain mapper failed');
    });
  });

  describe('type safety validation', () => {
    test('type guards work correctly in if statements', () => {
      const result: ValidationResult<number> = Math.random() > 0.5 ? success(42) : failure('error');

      if (isSuccess(result)) {
        // TypeScript should infer result.data as number
        const doubled: number = result.data * 2;
        expect(typeof doubled).toBe('number');
      } else {
        // TypeScript should infer result.error as string
        const errorLength: number = result.error.length;
        expect(typeof errorLength).toBe('number');
      }
    });

    test('discriminated union works properly', () => {
      const processResult = (result: ValidationResult<string>): string => {
        if (result.success) {
          return result.data.toUpperCase();
        } else {
          return `Error: ${result.error}`;
        }
      };

      expect(processResult(success('hello'))).toBe('HELLO');
      expect(processResult(failure('failed'))).toBe('Error: failed');
    });
  });
});
