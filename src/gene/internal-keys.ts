/**
 * Module-private construction keys used by `gene/`-internal `unsafe*` factories.
 *
 * Following the same pattern as `sequence/internal-keys.ts`, these symbols gate the
 * `Gene` / `Promoter` / `PromoterElement` constructors so that public callers must go through
 * the {@link parseGene} / {@link parsePromoter} / {@link parsePromoterElement} parsers, which
 * own the validation logic. Files inside `src/gene/` may import them; package consumers cannot
 * reach them because the symbols are not re-exported from the barrel.
 *
 * @internal
 */
export const UNSAFE_GENE_KEY: unique symbol = Symbol('unsafe-gene');

/**
 * Sentinel used to bypass `Promoter` constructor validation. See {@link UNSAFE_GENE_KEY} for
 * context.
 *
 * @internal
 */
export const UNSAFE_PROMOTER_KEY: unique symbol = Symbol('unsafe-promoter');

/**
 * Sentinel used to bypass `PromoterElement` constructor validation. See {@link UNSAFE_GENE_KEY}
 * for context.
 *
 * @internal
 */
export const UNSAFE_PROMOTER_ELEMENT_KEY: unique symbol = Symbol('unsafe-promoter-element');
