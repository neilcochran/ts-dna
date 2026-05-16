/**
 * Module-private construction key used by `transcription/`-internal `unsafe*` factories.
 *
 * Mirrors the pattern in `sequence/internal-keys.ts` and `gene/internal-keys.ts`: the symbol
 * gates the {@link PreMRNA} constructor so that public callers must go through
 * {@link parsePreMRNA} (or the `transcribe` pipeline), which owns the validation logic. Files
 * inside `src/transcription/` may import it; package consumers cannot reach it because the
 * symbol is not re-exported from the barrel.
 *
 * @internal
 */
export const UNSAFE_PREMRNA_KEY: unique symbol = Symbol('unsafe-premrna');
