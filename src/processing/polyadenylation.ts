import type { RNA } from '../sequence/index.js';
import {
  NucleotidePattern,
  parseNucleotidePattern,
  compileLiteralPattern,
} from '../pattern/index.js';
import { POLYA_SIGNALS } from './biology.js';
import {
  DEFAULT_POLYA_SIGNAL_STRENGTH,
  MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH,
  USE_ELEMENT_MAX_BOOST,
  DSE_ELEMENT_MAX_BOOST,
  BASE_POLYA_SCORE,
  HIGH_U_CONTENT_THRESHOLD,
  MODERATE_U_CONTENT_THRESHOLD,
  MODERATE_USE_SCORE,
  HIGH_DSE_SCORE,
  INHIBITORY_G_RUN_PENALTY,
  AU_RICH_CONTEXT_BOOST,
  PERFECT_USE_SCORE,
  HIGH_USE_SCORE,
  PERFECT_DSE_SCORE,
  MIN_POLYA_SITE_STRENGTH,
} from './scoring.js';
import type { GenomicRegion } from '../coordinates/index.js';
import {
  PolyadenylationSite,
  CleavageSiteOptions,
  DEFAULT_CLEAVAGE_OPTIONS,
} from './polyadenylation-site.js';

/**
 * Window size (in bp) upstream of a polyadenylation signal to scan for USE elements.
 */
const USE_SEARCH_UPSTREAM_BP = 60;

/**
 * Window size (in bp) downstream of a polyadenylation signal to scan for DSE elements.
 */
const DSE_SEARCH_DOWNSTREAM_BP = 80;

/**
 * Upper cap applied to a polyadenylation site's strength score after USE / DSE boosts.
 * Without this cap the scorer can produce values well above 100 for strong canonical sites
 * surrounded by both regulatory elements.
 */
const MAX_POLYA_SITE_STRENGTH_WITH_BOOST = 150;

/**
 * Static priority-ranked USE (upstream sequence element) patterns, compiled once at module
 * load. Higher priority indicates a stronger biological signal.
 */
const USE_PATTERNS: readonly { readonly pattern: NucleotidePattern; readonly priority: number }[] =
  [
    { pattern: compileLiteralPattern('UGUA'), priority: 3 },
    { pattern: compileLiteralPattern('U[CU]U'), priority: 2 },
    { pattern: compileLiteralPattern('UUU[UG]'), priority: 2 },
    { pattern: compileLiteralPattern('U{4,}'), priority: 1 },
  ];

/**
 * Static priority-ranked DSE (downstream sequence element) patterns, compiled once at module
 * load.
 */
const DSE_PATTERNS: readonly { readonly pattern: NucleotidePattern; readonly priority: number }[] =
  [
    { pattern: compileLiteralPattern('GU{2,}[ACGU]{0,3}U{2,}'), priority: 3 },
    { pattern: compileLiteralPattern('GU{3,}'), priority: 2 },
    { pattern: compileLiteralPattern('U{4,}G'), priority: 2 },
    { pattern: compileLiteralPattern('U{5,}'), priority: 1 },
  ];

/** USE quality scoring: a UYU-style motif inside a USE region. */
const USE_QUALITY_UYU_PATTERN = compileLiteralPattern('U[CU]U');

/** DSE quality scoring: GU-rich region followed by a U-cluster. */
const DSE_QUALITY_GU_U_PATTERN = compileLiteralPattern('GU{2,}.*U{2,}');

/** DSE quality scoring: simple GU-rich region. */
const DSE_QUALITY_GU3_PATTERN = compileLiteralPattern('GU{3,}');

/** Cleavage-site context: poly-G run that inhibits cleavage. */
const POLY_G3_CONTEXT_PATTERN = compileLiteralPattern('G{3,}');

/** Cleavage-site context: A/U-rich region that favors cleavage. */
const AU_RICH_CONTEXT_PATTERN = compileLiteralPattern('[AU]{2,}');

/** Cleavage-site rejection: extended poly-G run that disqualifies a cleavage site. */
const POLY_G4_CONTEXT_PATTERN = compileLiteralPattern('G{4,}');

/**
 * Compiles a polyadenylation-signal RNA string into a {@link NucleotidePattern}, or returns
 * `undefined` if the signal is not a valid pattern. Used by {@link findPolyadenylationSites}
 * to tolerate ill-formed user-supplied signals.
 */
function tryCompileSignal(signal: string): NucleotidePattern | undefined {
  const result = parseNucleotidePattern(signal);
  return result.success ? result.data : undefined;
}

/**
 * Finds polyadenylation sites in an RNA sequence with enhanced analysis of signal strength,
 * regulatory elements, and biological constraints.
 *
 * @param rna - The RNA sequence to scan for polyadenylation signals
 * @param options - Optional configuration overriding the default polyA signals, USE/DSE
 * patterns, cleavage preference, and distance range
 * @returns Array of detected {@link PolyadenylationSite}, sorted by strength (highest first)
 * and then by position
 */
export function findPolyadenylationSites(
  rna: RNA,
  options: CleavageSiteOptions = DEFAULT_CLEAVAGE_OPTIONS,
): PolyadenylationSite[] {
  const sequence = rna.getSequence();

  if (sequence.length < MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH) {
    return [];
  }

  const sites: PolyadenylationSite[] = [];
  const opts: Required<CleavageSiteOptions> = { ...DEFAULT_CLEAVAGE_OPTIONS, ...options };

  for (const signal of opts.polyASignal) {
    const pattern = tryCompileSignal(signal);
    if (pattern === undefined) {
      continue;
    }
    const matches = pattern.findAll(rna);
    for (const match of matches) {
      const site = analyzePolyadenylationSite(sequence, match.start, signal, opts);
      if (site) {
        sites.push(site);
      }
    }
  }

  return sites.sort((a, b) => {
    if (a.strength !== b.strength) {
      return b.strength - a.strength;
    }
    return a.position - b.position;
  });
}

/**
 * Returns the polyadenylation site with the highest strength score.
 *
 * @param sites - Candidate polyadenylation sites to compare
 * @returns The site with the highest strength, or `undefined` if the input array is empty
 */
export function getStrongestPolyadenylationSite(
  sites: PolyadenylationSite[],
): PolyadenylationSite | undefined {
  if (sites.length === 0) {
    return undefined;
  }
  return sites.reduce((strongest, current) =>
    current.strength > strongest.strength ? current : strongest,
  );
}

/**
 * Filters polyadenylation sites by minimum strength threshold.
 *
 * @param sites - Candidate polyadenylation sites
 * @param minStrength - Minimum strength score required for inclusion (default `50`)
 * @returns Sites whose strength is at least `minStrength`
 */
export function filterPolyadenylationSites(
  sites: PolyadenylationSite[],
  minStrength: number = 50,
): PolyadenylationSite[] {
  return sites.filter(site => site.strength >= minStrength);
}

/**
 * Scores a candidate polyadenylation site at `position` using the supplied options. Returns
 * `null` when biological constraints reject the candidate or when its total strength falls
 * below {@link MIN_POLYA_SITE_STRENGTH}.
 */
function analyzePolyadenylationSite(
  sequence: string,
  position: number,
  signal: string,
  options: Required<CleavageSiteOptions>,
): PolyadenylationSite | null {
  const baseStrength = getSignalStrength(signal);
  let totalStrength = baseStrength;

  const upstreamUSE = findUpstreamUSE(sequence, position);
  if (upstreamUSE) {
    const useQuality = analyzeUSEQuality(sequence, upstreamUSE);
    totalStrength += Math.round(useQuality * USE_ELEMENT_MAX_BOOST);
  }

  const downstreamDSE = findDownstreamDSE(sequence, position + signal.length);
  if (downstreamDSE) {
    const dseQuality = analyzeDSEQuality(sequence, downstreamDSE);
    totalStrength += Math.round(dseQuality * DSE_ELEMENT_MAX_BOOST);
  }

  const cleavageSite = predictCleavageSite(
    sequence,
    position + signal.length,
    [...options.distanceRange] as [number, number],
    [...options.cleavagePreference],
  );

  if (!validateCleavageSiteConstraints(sequence, position, signal.length, cleavageSite, options)) {
    return null;
  }

  if (totalStrength < MIN_POLYA_SITE_STRENGTH) {
    return null;
  }

  return {
    position,
    signal,
    strength: Math.min(totalStrength, MAX_POLYA_SITE_STRENGTH_WITH_BOOST),
    upstreamUSE,
    downstreamDSE,
    cleavageSite,
  };
}

/**
 * Returns the strength score for a recognized polyadenylation signal, or the default fallback
 * for unrecognized signals.
 */
function getSignalStrength(signal: string): number {
  return POLYA_SIGNALS[signal as keyof typeof POLYA_SIGNALS] ?? DEFAULT_POLYA_SIGNAL_STRENGTH;
}

/**
 * Searches the {@link USE_SEARCH_UPSTREAM_BP} window upstream of `position` for the
 * highest-priority USE motif and returns the matching region, or `undefined` when no motif
 * matches.
 */
function findUpstreamUSE(sequence: string, position: number): GenomicRegion | undefined {
  const searchStart = Math.max(0, position - USE_SEARCH_UPSTREAM_BP);
  const searchEnd = position;
  if (searchEnd <= searchStart) {
    return undefined;
  }
  const rnaRegion = sequence.substring(searchStart, searchEnd).replace(/T/g, 'U');
  if (rnaRegion === '') {
    return undefined;
  }

  let bestMatch: { start: number; end: number; priority: number } | undefined;
  for (const { pattern, priority } of USE_PATTERNS) {
    for (const match of pattern.findAll(rnaRegion)) {
      if (!bestMatch || priority > bestMatch.priority) {
        bestMatch = {
          start: searchStart + match.start,
          end: searchStart + match.end,
          priority,
        };
      }
    }
  }
  return bestMatch ? { start: bestMatch.start, end: bestMatch.end, name: 'USE' } : undefined;
}

/**
 * Searches the {@link DSE_SEARCH_DOWNSTREAM_BP} window downstream of `position` for the
 * highest-priority DSE motif and returns the matching region, or `undefined` when no motif
 * matches.
 */
function findDownstreamDSE(sequence: string, position: number): GenomicRegion | undefined {
  const searchStart = position;
  const searchEnd = Math.min(sequence.length, position + DSE_SEARCH_DOWNSTREAM_BP);
  if (searchEnd <= searchStart) {
    return undefined;
  }
  const rnaRegion = sequence.substring(searchStart, searchEnd).replace(/T/g, 'U');
  if (rnaRegion === '') {
    return undefined;
  }

  let bestMatch: { start: number; end: number; priority: number } | undefined;
  for (const { pattern, priority } of DSE_PATTERNS) {
    for (const match of pattern.findAll(rnaRegion)) {
      if (!bestMatch || priority > bestMatch.priority) {
        bestMatch = {
          start: searchStart + match.start,
          end: searchStart + match.end,
          priority,
        };
      }
    }
  }
  return bestMatch ? { start: bestMatch.start, end: bestMatch.end, name: 'DSE' } : undefined;
}

/**
 * Scores a USE region: top score for a UGUA motif, high score for a UYU motif, moderate for
 * generally U-rich, baseline otherwise.
 */
function analyzeUSEQuality(sequence: string, useRegion: GenomicRegion): number {
  const useSequence = sequence.substring(useRegion.start, useRegion.end).replace(/T/g, 'U');
  if (useSequence === '') {
    return BASE_POLYA_SCORE;
  }
  let score = BASE_POLYA_SCORE;
  if (useSequence.includes('UGUA')) {
    score = PERFECT_USE_SCORE;
  } else if (USE_QUALITY_UYU_PATTERN.matches(useSequence)) {
    score = HIGH_USE_SCORE;
  } else if (
    (useSequence.match(/U/g) ?? []).length / useSequence.length >
    HIGH_U_CONTENT_THRESHOLD
  ) {
    score = MODERATE_USE_SCORE;
  }
  return Math.min(score, PERFECT_USE_SCORE);
}

/**
 * Scores a DSE region: top score for GU-rich with U clusters, high for plain GU-rich,
 * moderate for generally U-rich, baseline otherwise.
 */
function analyzeDSEQuality(sequence: string, dseRegion: GenomicRegion): number {
  const dseSequence = sequence.substring(dseRegion.start, dseRegion.end).replace(/T/g, 'U');
  if (dseSequence === '') {
    return BASE_POLYA_SCORE;
  }
  let score = BASE_POLYA_SCORE;
  if (DSE_QUALITY_GU_U_PATTERN.matches(dseSequence)) {
    score = PERFECT_DSE_SCORE;
  } else if (DSE_QUALITY_GU3_PATTERN.matches(dseSequence)) {
    score = HIGH_DSE_SCORE;
  } else if (
    (dseSequence.match(/U/g) ?? []).length / dseSequence.length >
    MODERATE_U_CONTENT_THRESHOLD
  ) {
    score = MODERATE_USE_SCORE;
  }
  return Math.min(score, PERFECT_USE_SCORE);
}

/**
 * Predicts the cleavage-site position downstream of `startPosition` by scanning the
 * configured distance range and picking the highest-scoring nucleotide under the cleavage
 * preference order, with context-aware boosts (A/U-rich neighborhoods) and penalties (poly-G
 * neighborhoods).
 */
function predictCleavageSite(
  sequence: string,
  startPosition: number,
  distanceRange: [number, number],
  preferences: string[],
): number | undefined {
  const [minDistance, maxDistance] = distanceRange;
  const searchStart = startPosition + minDistance;
  const searchEnd = Math.min(sequence.length, startPosition + maxDistance);

  let bestPosition: number | undefined;
  let bestScore = -1;

  for (let pos = searchStart; pos < searchEnd; pos++) {
    const rawNucleotide = sequence[pos];
    if (rawNucleotide === undefined) {
      break;
    }
    const nucleotide = rawNucleotide.toUpperCase().replace('T', 'U');
    const preferenceIndex = preferences.indexOf(nucleotide);
    if (preferenceIndex === -1) {
      continue;
    }
    let score = preferences.length - preferenceIndex;
    const context = sequence.substring(Math.max(0, pos - 2), Math.min(sequence.length, pos + 3));
    if (context !== '') {
      if (POLY_G3_CONTEXT_PATTERN.matches(context)) {
        score *= INHIBITORY_G_RUN_PENALTY;
      } else {
        const auContext = context.replace(/T/g, 'U');
        if (auContext !== '' && AU_RICH_CONTEXT_PATTERN.matches(auContext)) {
          score *= AU_RICH_CONTEXT_BOOST;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPosition = pos;
    }
  }
  return bestPosition;
}

/**
 * Validates biological constraints for a candidate cleavage site: the cleavage must exist,
 * fall within the configured distance range from the *matched* signal (not from
 * `polyASignal[0]`), and not land inside a poly-G stretch.
 *
 * Takes `signalLength` rather than indexing `options.polyASignal[0].length` (the old
 * implementation's bug, surfaced in PLAN.md Followups: it sized the distance check against
 * the first configured signal instead of against the one that actually matched).
 */
function validateCleavageSiteConstraints(
  sequence: string,
  signalPosition: number,
  signalLength: number,
  cleavagePosition: number | undefined,
  options: Required<CleavageSiteOptions>,
): boolean {
  if (cleavagePosition === undefined) {
    return false;
  }
  const distance = cleavagePosition - (signalPosition + signalLength);
  const [minDist, maxDist] = options.distanceRange;
  if (distance < minDist || distance > maxDist) {
    return false;
  }
  const context = sequence.substring(
    Math.max(0, cleavagePosition - 3),
    Math.min(sequence.length, cleavagePosition + 3),
  );
  if (context === '') {
    return true;
  }
  if (POLY_G4_CONTEXT_PATTERN.matches(context)) {
    return false;
  }
  return true;
}
