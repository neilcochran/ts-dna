/**
 * Sequence-level primitives: validated `DNA` / `RNA` sequence types, parsers, complement
 * helpers, sequence-level transcription / reverse-transcription, and codon primitives.
 *
 * The module-private `unsafeDNA` / `unsafeRNA` factories and the `UNSAFE_*_KEY` symbols are
 * deliberately excluded from this barrel. Other code under `src/` may import them from
 * `./parse.js` / `./internal-keys.js` when it can prove the input is well-formed; package
 * consumers cannot reach them.
 */
export { DNA } from './DNA.js';
export { RNA } from './RNA.js';
export { parseDNA, parseRNA } from './parse.js';
export {
  complement,
  reverseComplement,
  complementDNABase,
  complementRNABase,
} from './complement.js';
export { transcribeSequence, reverseTranscribeSequence } from './conversion.js';
export {
  CODON_LENGTH,
  START_CODON,
  STOP_CODONS,
  isStopCodon,
  validateReadingFrame,
} from './codons.js';
export type { StopCodon } from './codons.js';
export type { DNAError, RNAError, ReadingFrameError } from './errors.js';
export { describeDNAError, describeRNAError, describeReadingFrameError } from './errors.js';
