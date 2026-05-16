/**
 * Module-private construction keys used by `translation/`-internal `unsafe*` factories.
 *
 * Mirrors the pattern in `sequence/internal-keys.ts`, `gene/internal-keys.ts`,
 * `transcription/internal-keys.ts`, and `processing/internal-keys.ts`: the symbols gate the
 * `AminoAcid` and `Polypeptide` constructors so that public callers must go through
 * {@link parseAminoAcid} or the `translate` pipeline, which own the validation logic. Files
 * inside `src/translation/` may import these; package consumers cannot reach them because
 * the symbols are not re-exported from the barrel.
 *
 * @internal
 */
export const UNSAFE_AMINO_ACID_KEY: unique symbol = Symbol('unsafe-amino-acid');

/**
 * Sentinel used to bypass `Polypeptide` constructor validation. See {@link UNSAFE_AMINO_ACID_KEY}
 * for context.
 *
 * @internal
 */
export const UNSAFE_POLYPEPTIDE_KEY: unique symbol = Symbol('unsafe-polypeptide');
