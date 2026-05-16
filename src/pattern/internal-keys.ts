/**
 * Module-private construction keys used by `pattern/`-internal `unsafe*` factories.
 *
 * Mirrors the pattern in `sequence/internal-keys.ts`: the symbols gate the
 * {@link NucleotidePattern} and {@link NucleotidePatternSymbol} constructors so that public
 * callers must go through {@link parseNucleotidePattern} / {@link parseNucleotidePatternSymbol},
 * which own the validation logic. Files inside `src/pattern/` may import these; package
 * consumers cannot reach them because the symbols are not re-exported from the barrel.
 *
 * @internal
 */
export const UNSAFE_NUCLEOTIDE_PATTERN_KEY: unique symbol = Symbol('unsafe-nucleotide-pattern');

/**
 * Sentinel used to bypass {@link NucleotidePatternSymbol} constructor validation. See
 * {@link UNSAFE_NUCLEOTIDE_PATTERN_KEY} for context.
 *
 * @internal
 */
export const UNSAFE_NUCLEOTIDE_PATTERN_SYMBOL_KEY: unique symbol = Symbol(
  'unsafe-nucleotide-pattern-symbol',
);
