/**
 * Sequence-level primitives: validated `DNA` / `RNA` sequence types, the `DoubleStrandedDNA`
 * duplex, parsers, complement helpers, sequence-level transcription / reverse-transcription,
 * and codon primitives.
 *
 * The module-private `unsafeDNA` / `unsafeRNA` / `unsafeDoubleStrandedDNA` factories are
 * deliberately excluded from this barrel. Other code under `src/` may import them from
 * `./DNA.js` / `./RNA.js` / `./DoubleStrandedDNA.js` when it can prove the input is
 * well-formed; package consumers cannot reach them.
 */
export { DNA } from './DNA.js';
export { RNA } from './RNA.js';
export { DoubleStrandedDNA } from './DoubleStrandedDNA.js';
export { parseDNA, parseRNA, parseDoubleStrandedDNA, doubleStrandedDNA } from './parse.js';
export { complement, reverseComplement } from './complement.js';
export { transcribeSequence, reverseTranscribeSequence } from './conversion.js';
export {
  CODON_LENGTH,
  START_CODON,
  STOP_CODONS,
  isStopCodon,
  validateReadingFrame,
  parseCodon,
} from './codons.js';
export type { StopCodon, Codon } from './codons.js';
export type {
  DNAError,
  RNAError,
  ReadingFrameError,
  DoubleStrandedError,
  CodonError,
} from './errors.js';
export {
  describeDNAError,
  describeRNAError,
  describeReadingFrameError,
  describeDoubleStrandedError,
  describeCodonError,
} from './errors.js';
