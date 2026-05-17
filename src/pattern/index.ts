/**
 * Pattern subsystem: IUPAC nucleotide-pattern matching over validated `DNA` / `RNA` sequences.
 *
 * Exports the {@link NucleotidePattern} and {@link NucleotidePatternSymbol} classes, the
 * `parseNucleotidePattern` / `parseNucleotidePatternSymbol` parsers, the {@link PatternError}
 * tagged union with its `describePatternError` renderer, the canonical IUPAC symbol table, and
 * the {@link NucleotideMatch} interface returned by `findAll` / `findFirst`.
 */
export { NucleotidePattern } from './NucleotidePattern.js';
export type { NucleotideMatch } from './NucleotidePattern.js';
export { NucleotidePatternSymbol } from './NucleotidePatternSymbol.js';
export {
  parseNucleotidePattern,
  parseNucleotidePatternSymbol,
  compileLiteralPattern,
} from './parse.js';
export type { PatternError } from './errors.js';
export { describePatternError } from './errors.js';
export { NUCLEOTIDE_PATTERN_SYMBOLS } from './iupac-symbols.js';
export type { IUPACSymbol } from './iupac-symbols.js';
