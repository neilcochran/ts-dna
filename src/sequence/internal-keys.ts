/**
 * Module-private construction keys used by sequence-internal `unsafe*` factories.
 *
 * These symbols let `unsafeDNA` / `unsafeRNA` bypass constructor-time validation when the
 * caller already knows the input is well-formed (e.g. a substring of a validated DNA).
 *
 * The keys are intentionally not re-exported from the package barrel; only files inside
 * `src/sequence/` should import them. They are exported here (rather than declared inline)
 * so that the `DNA` and `RNA` classes can live in their own files while still sharing the
 * single source-of-truth sentinel.
 *
 * @internal
 */
export const UNSAFE_DNA_KEY: unique symbol = Symbol('unsafe-dna');

/**
 * Sentinel used to bypass `RNA` constructor validation. See {@link UNSAFE_DNA_KEY} for
 * context.
 *
 * @internal
 */
export const UNSAFE_RNA_KEY: unique symbol = Symbol('unsafe-rna');
