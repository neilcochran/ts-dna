/**
 * Module-private construction key used by `modifications/`-internal `unsafe*` factories.
 *
 * Mirrors the pattern in `sequence/internal-keys.ts`, `gene/internal-keys.ts`, and
 * `transcription/internal-keys.ts`: the symbol gates the {@link MRNA} constructor so that
 * public callers must go through {@link parseMRNA} (or the `processRNA` pipeline), which own
 * the validation logic. Files inside `src/modifications/` (and the splice-variant processors
 * inside `src/splicing/`) may import it; package consumers cannot reach it because the symbol
 * is not re-exported from the barrel.
 *
 * @internal
 */
export const UNSAFE_MRNA_KEY: unique symbol = Symbol('unsafe-mrna');
