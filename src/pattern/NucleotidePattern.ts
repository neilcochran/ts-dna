import type { DNA, RNA } from '../sequence/index.js';
import { InvalidNucleotidePatternError } from '../model/errors/InvalidNucleotidePatternError.js';
import { complementIUPACSymbol, isIUPACSymbol } from './iupac-symbols.js';
import type { IUPACSymbol } from './iupac-symbols.js';
import type { PatternError } from './errors.js';
import { describePatternError } from './errors.js';

/**
 * A single match of a {@link NucleotidePattern} against a nucleic-acid sequence.
 *
 * `start` is inclusive and `end` is exclusive (the same 0-based half-open convention used for
 * genomic regions throughout the codebase). `matched` is the literal substring of the searched
 * sequence that satisfied the pattern.
 */
export interface NucleotideMatch {
  /** 0-based start position of the match (inclusive). */
  readonly start: number;
  /** 0-based end position of the match (exclusive). */
  readonly end: number;
  /** The substring of the searched sequence that matched the pattern. */
  readonly matched: string;
}

/**
 * A nucleotide pattern compiled from an IUPAC notation string (e.g. `'TATAWAR'`, `'GAATTC'`,
 * `'CANNTG'`). Each IUPAC symbol expands into a case-insensitive regex character class and the
 * non-alpha characters of the source string (regex quantifiers, anchors, brackets, escapes,
 * grouping) are preserved as-is, so quantified expressions like `'GU{3,}'` and grouped
 * expressions like `'(GT|AG)'` are supported.
 *
 * Pattern methods operate on validated {@link DNA} or {@link RNA} sequences only; consumers
 * with raw strings should call `parseDNA(str).map(seq => pattern.matches(seq))` or use a native
 * `RegExp` directly. The constructor validates and throws
 * {@link InvalidNucleotidePatternError}; prefer {@link parseNucleotidePattern} (returns a
 * `Result`) for untrusted input.
 *
 * @see {@link NucleotidePatternSymbol}
 * @see {@link https://en.wikipedia.org/wiki/Nucleic_acid_notation#IUPAC_notation|IUPAC notation}
 */
export class NucleotidePattern {
  /** The original IUPAC pattern string. */
  public readonly pattern: string;

  /** Compiled regex form (no flags); used for `matches` and `findFirst`. */
  private readonly patternRegex: RegExp;

  /** Compiled regex form (`g` flag); used for `findAll`. */
  private readonly patternRegexGlobal: RegExp;

  /**
   * Constructs a `NucleotidePattern` with constructor-time validation.
   *
   * @param pattern - A non-empty pattern string composed of IUPAC nucleotide symbols and
   * optional regex meta-characters (`[]`, `{}`, `()`, `+`, `*`, `?`, `|`, `^`, `$`, `.`, `\`)
   *
   * @throws {@link InvalidNucleotidePatternError} when `pattern` is empty, contains an
   * unrecognized alpha character outside an escape sequence, or fails to compile as a regex
   */
  constructor(pattern: string) {
    const outcome = compilePatternRegexSource(pattern);
    if (!outcome.ok) {
      throw new InvalidNucleotidePatternError(describePatternError(outcome.error), pattern);
    }
    let basicRegex: RegExp;
    let globalRegex: RegExp;
    try {
      basicRegex = new RegExp(outcome.source);
      globalRegex = new RegExp(outcome.source, 'g');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new InvalidNucleotidePatternError(
        describePatternError({ kind: 'invalid-regex-construction', pattern, cause: message }),
        pattern,
      );
    }
    this.pattern = pattern;
    this.patternRegex = basicRegex;
    this.patternRegexGlobal = globalRegex;
  }

  /**
   * Reports whether this pattern occurs anywhere in the given nucleic-acid sequence.
   *
   * @param sequence - The DNA or RNA sequence to test
   * @returns `true` iff the pattern matches at least once
   *
   * @example
   * ```typescript
   * const pattern = new NucleotidePattern('ANNT');
   * pattern.matches(parseDNA('AAAT').unwrap()); // true
   * pattern.matches(parseDNA('CCCC').unwrap()); // false
   * ```
   */
  matches(sequence: DNA | RNA): boolean {
    return this.patternRegex.test(sequence.getSequence());
  }

  /**
   * Returns every occurrence of this pattern in the given nucleic-acid sequence. Overlapping
   * matches are not reported (this follows JavaScript's native `matchAll` semantics).
   *
   * @param sequence - The DNA or RNA sequence to search
   * @returns A frozen array of {@link NucleotideMatch} values, possibly empty
   *
   * @example
   * ```typescript
   * const pattern = new NucleotidePattern('RY');
   * pattern.findAll(parseDNA('ATGAGCGATC').unwrap());
   * // [{ start: 0, end: 2, matched: 'AT' }, { start: 4, end: 6, matched: 'GC' }, { start: 6, end: 8, matched: 'AT' }]
   * ```
   */
  findAll(sequence: DNA | RNA): readonly NucleotideMatch[] {
    const matches: NucleotideMatch[] = [];
    for (const match of sequence.getSequence().matchAll(this.patternRegexGlobal)) {
      const start = match.index;
      const matched = match[0];
      matches.push({ start, end: start + matched.length, matched });
    }
    return Object.freeze(matches);
  }

  /**
   * Returns the first occurrence of this pattern in the given nucleic-acid sequence, or
   * `undefined` if the pattern does not match.
   *
   * @param sequence - The DNA or RNA sequence to search
   * @returns A {@link NucleotideMatch} for the first match, or `undefined`
   */
  findFirst(sequence: DNA | RNA): NucleotideMatch | undefined {
    const result = this.patternRegex.exec(sequence.getSequence());
    if (result === null) {
      return undefined;
    }
    const start = result.index;
    const matched = result[0];
    return { start, end: start + matched.length, matched };
  }

  /**
   * Reports whether this pattern matches either the forward strand or the reverse-complement
   * strand of the given DNA sequence. Restricted to {@link DNA} because the "either strand"
   * concept is specific to double-stranded DNA; RNA is single-stranded and has no opposite
   * strand to match against.
   *
   * @param sequence - The DNA sequence to test against both strands
   * @returns `true` iff the pattern matches on the forward or reverse-complement strand
   *
   * @example
   * ```typescript
   * const ecoRI = new NucleotidePattern('GAATTC');
   * ecoRI.matchesEitherStrand(parseDNA('CTTAAG').unwrap()); // true (reverse complement of GAATTC)
   * ```
   */
  matchesEitherStrand(sequence: DNA): boolean {
    if (this.matches(sequence)) {
      return true;
    }
    const rcOutcome = compilePatternRegexSource(reverseComplementPatternString(this.pattern));
    if (!rcOutcome.ok) {
      return false;
    }
    try {
      return new RegExp(rcOutcome.source).test(sequence.getSequence());
    } catch {
      return false;
    }
  }

  /**
   * Returns a new `NucleotidePattern` representing the IUPAC complement of this pattern. Each
   * IUPAC symbol is replaced by its complement (`A` complements to `T`, `C` to `G`, `R` to
   * `Y`, `K` to `M`, `B` to `V`, `D` to `H`; the palindromic codes `S`, `W`, and `N`
   * complement to themselves; `U` complements to `A`). Regex meta-characters in the pattern
   * string are preserved verbatim.
   *
   * @returns A new `NucleotidePattern` carrying the complement
   *
   * @example
   * ```typescript
   * new NucleotidePattern('ATCG').complement().pattern; // 'TAGC'
   * new NucleotidePattern('RY').complement().pattern;   // 'YR'
   * ```
   */
  complement(): NucleotidePattern {
    return new NucleotidePattern(complementPatternString(this.pattern));
  }

  /**
   * Returns a new `NucleotidePattern` representing the reverse complement of this pattern
   * (complement, then character-reversed). Palindromic patterns (e.g. the EcoRI site
   * `'GAATTC'`) round-trip to themselves.
   *
   * @returns A new `NucleotidePattern` carrying the reverse complement
   *
   * @example
   * ```typescript
   * new NucleotidePattern('ATCG').reverseComplement().pattern;     // 'CGAT'
   * new NucleotidePattern('GAATTC').reverseComplement().pattern;   // 'GAATTC'
   * ```
   */
  reverseComplement(): NucleotidePattern {
    return new NucleotidePattern(reverseComplementPatternString(this.pattern));
  }
}

/**
 * Walks an IUPAC pattern string and produces the corresponding regex source. Non-alpha
 * characters (regex meta-characters, digits, escapes, whitespace) are preserved verbatim;
 * alpha characters must be IUPAC symbols (or part of a `\X` escape sequence).
 *
 * Returns a tagged outcome rather than throwing so that both the `Result`-returning parser
 * and the throwing constructor can share the validation logic.
 */
function compilePatternRegexSource(
  pattern: string,
): { ok: true; source: string } | { ok: false; error: PatternError } {
  if (pattern === '') {
    return { ok: false, error: { kind: 'empty-pattern' } };
  }
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const character = pattern[i];
    if (/[a-zA-Z]/.test(character)) {
      const isEscapeSequence = i > 0 && pattern[i - 1] === '\\';
      if (isEscapeSequence) {
        source += character;
        continue;
      }
      const upper = character.toUpperCase();
      if (!isIUPACSymbol(upper)) {
        return {
          ok: false,
          error: { kind: 'invalid-iupac-character', character, index: i },
        };
      }
      source += symbolRegexClassFor(upper);
    } else {
      source += character;
    }
  }
  return { ok: true, source };
}

/** Case-insensitive regex character class for a single IUPAC symbol. */
function symbolRegexClassFor(symbol: IUPACSymbol): string {
  switch (symbol) {
    case 'A':
      return '[Aa]';
    case 'T':
      return '[Tt]';
    case 'C':
      return '[Cc]';
    case 'G':
      return '[Gg]';
    case 'U':
      return '[Uu]';
    case 'R':
      return '[GgAa]';
    case 'Y':
      return '[CcTt]';
    case 'K':
      return '[GgTt]';
    case 'M':
      return '[AaCc]';
    case 'S':
      return '[GgCc]';
    case 'W':
      return '[AaTt]';
    case 'B':
      return '[GgTtCc]';
    case 'V':
      return '[GgCcAa]';
    case 'D':
      return '[GgAaTt]';
    case 'H':
      return '[AaCcTt]';
    case 'N':
      return '[AaGgCcTt]';
  }
}

/** Complements each IUPAC symbol in a pattern string; preserves non-alpha characters. */
function complementPatternString(pattern: string): string {
  let result = '';
  for (let i = 0; i < pattern.length; i++) {
    const character = pattern[i];
    if (/[a-zA-Z]/.test(character)) {
      const isEscapeSequence = i > 0 && pattern[i - 1] === '\\';
      if (isEscapeSequence) {
        result += character;
        continue;
      }
      const upper = character.toUpperCase();
      if (isIUPACSymbol(upper)) {
        result += complementIUPACSymbol(upper);
      } else {
        result += character;
      }
    } else {
      result += character;
    }
  }
  return result;
}

/** Complements then character-reverses a pattern string. */
function reverseComplementPatternString(pattern: string): string {
  return complementPatternString(pattern).split('').reverse().join('');
}
