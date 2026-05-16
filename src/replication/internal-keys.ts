/**
 * Module-private construction keys used by replication-internal `unsafe*` factories.
 *
 * These symbols let the `unsafeOkazakiFragment` / `unsafeRNAPrimer` factories bypass
 * constructor-time validation when the caller (the replication pipeline) already knows the
 * input is well-formed.
 *
 * The keys are intentionally not re-exported from the package barrel; only files inside
 * `src/replication/` should import them.
 *
 * @internal
 */
export const UNSAFE_OKAZAKI_KEY: unique symbol = Symbol('unsafe-okazaki-fragment');

/**
 * Sentinel used to bypass {@link RNAPrimer} constructor validation. See
 * {@link UNSAFE_OKAZAKI_KEY} for context.
 *
 * @internal
 */
export const UNSAFE_PRIMER_KEY: unique symbol = Symbol('unsafe-rna-primer');
