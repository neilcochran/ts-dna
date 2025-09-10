/**
 * A discriminated union type representing the result of an operation that can succeed or fail.
 * This provides a functional approach to error handling without throwing exceptions.
 */
export type ValidationResult<T, E = string> =
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Creates a successful ValidationResult
 */
export const success = <T, E = string>(data: T): ValidationResult<T, E> => ({
    success: true,
    data
});

/**
 * Creates a failed ValidationResult
 */
export const failure = <E = string>(error: E): ValidationResult<never, E> => ({
    success: false,
    error
});

/**
 * Type guard to check if a ValidationResult is successful
 */
export const isSuccess = <T, E>(result: ValidationResult<T, E>): result is { success: true; data: T } =>
    result.success;

/**
 * Type guard to check if a ValidationResult is a failure
 */
export const isFailure = <T, E>(result: ValidationResult<T, E>): result is { success: false; error: E } =>
    !result.success;

/**
 * Maps the data of a successful ValidationResult, leaving failures unchanged
 */
export const map = <T, U, E>(
    result: ValidationResult<T, E>,
    // eslint-disable-next-line no-unused-vars
    mapper: (data: T) => U
): ValidationResult<U, E> =>
        isSuccess(result)
            ? success(mapper(result.data))
            : { success: false, error: result.error };

/**
 * Chains ValidationResults together, useful for sequential operations that can fail
 */
export const chain = <T, U, E>(
    result: ValidationResult<T, E>,
    // eslint-disable-next-line no-unused-vars
    mapper: (data: T) => ValidationResult<U, E>
): ValidationResult<U, E> =>
        isSuccess(result)
            ? mapper(result.data)
            : { success: false, error: result.error };

/**
 * Extracts the data from a ValidationResult, throwing if it's a failure
 * Use this when you're confident the result is successful or want to propagate errors
 */
export const unwrap = <T, E>(result: ValidationResult<T, E>): T => {
    if (isSuccess(result)) {
        return result.data;
    }
    throw new Error(typeof result.error === 'string' ? result.error : 'Validation failed');
};

/**
 * Extracts the data from a ValidationResult, returning a default value if it's a failure
 */
export const unwrapOr = <T, E>(result: ValidationResult<T, E>, defaultValue: T): T =>
    isSuccess(result) ? result.data : defaultValue;