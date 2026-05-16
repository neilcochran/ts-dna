import { RNA } from '../sequence/index.js';
import { NucleotidePattern, parseNucleotidePattern } from '../pattern/index.js';
import {
  PolyadenylationSite,
  CleavageSiteOptions,
  DEFAULT_CLEAVAGE_OPTIONS,
} from '../types/polyadenylation-site.js';
import {
  POLYA_SIGNALS,
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
} from '../constants/biological-constants.js';
import { GenomicRegion } from '../coordinates/index.js';

/**
 * Static priority-ranked USE (upstream sequence element) patterns, compiled once at module
 * load. Higher priority indicates a stronger biological signal.
 */
const USE_PATTERNS: readonly { readonly pattern: NucleotidePattern; readonly priority: number }[] =
  [
    { pattern: new NucleotidePattern('UGUA'), priority: 3 },
    { pattern: new NucleotidePattern('U[CU]U'), priority: 2 },
    { pattern: new NucleotidePattern('UUU[UG]'), priority: 2 },
    { pattern: new NucleotidePattern('U{4,}'), priority: 1 },
  ];

/**
 * Static priority-ranked DSE (downstream sequence element) patterns, compiled once at module
 * load.
 */
const DSE_PATTERNS: readonly { readonly pattern: NucleotidePattern; readonly priority: number }[] =
  [
    { pattern: new NucleotidePattern('GU{2,}[ACGU]{0,3}U{2,}'), priority: 3 },
    { pattern: new NucleotidePattern('GU{3,}'), priority: 2 },
    { pattern: new NucleotidePattern('U{4,}G'), priority: 2 },
    { pattern: new NucleotidePattern('U{5,}'), priority: 1 },
  ];

/** USE quality scoring: a UYU-style motif inside a USE region. */
const USE_QUALITY_UYU_PATTERN = new NucleotidePattern('U[CU]U');

/** DSE quality scoring: GU-rich region followed by a U-cluster. */
const DSE_QUALITY_GU_U_PATTERN = new NucleotidePattern('GU{2,}.*U{2,}');

/** DSE quality scoring: simple GU-rich region. */
const DSE_QUALITY_GU3_PATTERN = new NucleotidePattern('GU{3,}');

/** Cleavage-site context: poly-G run that inhibits cleavage. */
const POLY_G3_CONTEXT_PATTERN = new NucleotidePattern('G{3,}');

/** Cleavage-site context: A/U-rich region that favors cleavage. */
const AU_RICH_CONTEXT_PATTERN = new NucleotidePattern('[AU]{2,}');

/** Cleavage-site rejection: extended poly-G run that disqualifies a cleavage site. */
const POLY_G4_CONTEXT_PATTERN = new NucleotidePattern('G{4,}');

/**
 * Compiles a polyadenylation-signal RNA string into a {@link NucleotidePattern}, or returns
 * `undefined` if the signal is not a valid pattern. Used by {@link findPolyadenylationSites} to
 * tolerate ill-formed user-supplied signals.
 */
function tryCompileSignal(signal: string): NucleotidePattern | undefined {
  const result = parseNucleotidePattern(signal);
  return result.success ? result.data : undefined;
}

/**
 * Wraps an RNA-region substring (which may include the upper-case `T` characters introduced by
 * post-substring DNA-to-RNA touch-ups elsewhere in this module) in a typed {@link RNA} so the
 * pattern API can match against it. Normalization to `U` happens at the call site.
 */
function rnaFromRegion(rnaRegion: string): RNA {
  return new RNA(rnaRegion);
}

/**
 * Finds polyadenylation sites in an RNA sequence with enhanced analysis
 * of signal strength, regulatory elements, and biological constraints.
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

  // Minimum sequence length for meaningful analysis (signal + distance + context)
  if (sequence.length < MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH) {
    return [];
  }

  const sites: PolyadenylationSite[] = [];
  const opts = { ...DEFAULT_CLEAVAGE_OPTIONS, ...options };

  // Search for each polyadenylation signal with enhanced analysis
  for (const signal of opts.polyASignal!) {
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

  // Sort by strength (highest first), then by position
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
 * Analyzes polyadenylation sites with detailed USE/DSE scoring
 * and biological constraint validation.
 */
function analyzePolyadenylationSite(
  sequence: string,
  position: number,
  signal: string,
  options: CleavageSiteOptions,
): PolyadenylationSite | null {
  // Get base signal strength
  const baseStrength = getSignalStrength(signal);
  let totalStrength = baseStrength;

  // Upstream USE element analysis
  const upstreamUSE = findUpstreamUSE(sequence, position);
  if (upstreamUSE) {
    const useQuality = analyzeUSEQuality(sequence, upstreamUSE);
    totalStrength += Math.round(useQuality * USE_ELEMENT_MAX_BOOST); // Up to 30 point boost
  }

  // Downstream DSE element analysis
  const downstreamDSE = findDownstreamDSE(sequence, position + signal.length);
  if (downstreamDSE) {
    const dseQuality = analyzeDSEQuality(sequence, downstreamDSE);
    totalStrength += Math.round(dseQuality * DSE_ELEMENT_MAX_BOOST); // Up to 20 point boost
  }

  // Predict cleavage site with context scoring
  const cleavageSite = predictCleavageSite(
    sequence,
    position + signal.length,
    [...options.distanceRange!] as [number, number],
    [...options.cleavagePreference!],
  );

  // Validate biological constraints
  if (!validateCleavageSiteConstraints(sequence, position, cleavageSite, options)) {
    return null;
  }

  // Apply strength threshold
  if (totalStrength < MIN_POLYA_SITE_STRENGTH) {
    return null;
  }

  return {
    position,
    signal,
    strength: Math.min(totalStrength, 150), // Allow boost above 100 for USE/DSE
    upstreamUSE,
    downstreamDSE,
    cleavageSite,
  };
}

/**
 * Signal strength calculation with biological scoring.
 */
function getSignalStrength(signal: string): number {
  return POLYA_SIGNALS[signal as keyof typeof POLYA_SIGNALS] ?? DEFAULT_POLYA_SIGNAL_STRENGTH;
}

/**
 * Upstream USE element detection with multiple motif patterns.
 */
function findUpstreamUSE(sequence: string, position: number): GenomicRegion | undefined {
  const searchStart = Math.max(0, position - 60);
  const searchEnd = position; // Search right up to signal

  if (searchEnd <= searchStart) {
    return undefined;
  }

  const rnaRegion = sequence.substring(searchStart, searchEnd).replace(/T/g, 'U');
  if (rnaRegion === '') {
    return undefined;
  }
  const rna = rnaFromRegion(rnaRegion);

  let bestMatch: { start: number; end: number; priority: number } | undefined;

  for (const { pattern, priority } of USE_PATTERNS) {
    for (const match of pattern.findAll(rna)) {
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
 * Downstream DSE element detection with GU-rich and U-rich patterns.
 */
function findDownstreamDSE(sequence: string, position: number): GenomicRegion | undefined {
  const searchStart = position; // Start immediately after signal
  const searchEnd = Math.min(sequence.length, position + 80);

  if (searchEnd <= searchStart) {
    return undefined;
  }

  const rnaRegion = sequence.substring(searchStart, searchEnd).replace(/T/g, 'U');
  if (rnaRegion === '') {
    return undefined;
  }
  const rna = rnaFromRegion(rnaRegion);

  let bestMatch: { start: number; end: number; priority: number } | undefined;

  for (const { pattern, priority } of DSE_PATTERNS) {
    for (const match of pattern.findAll(rna)) {
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
 * Analyzes the quality of a USE element based on its sequence content.
 */
function analyzeUSEQuality(sequence: string, useRegion: GenomicRegion): number {
  const useSequence = sequence.substring(useRegion.start, useRegion.end).replace(/T/g, 'U');
  if (useSequence === '') {
    return BASE_POLYA_SCORE;
  }

  let score = BASE_POLYA_SCORE;

  // UGUA motif gets highest score
  if (useSequence.includes('UGUA')) {
    score = PERFECT_USE_SCORE;
  }
  // UYU motifs get high score
  else if (USE_QUALITY_UYU_PATTERN.matches(new RNA(useSequence))) {
    score = HIGH_USE_SCORE;
  }
  // High U content gets medium score
  else if ((useSequence.match(/U/g) ?? []).length / useSequence.length > HIGH_U_CONTENT_THRESHOLD) {
    score = MODERATE_USE_SCORE;
  }

  return Math.min(score, PERFECT_USE_SCORE);
}

/**
 * Analyzes the quality of a DSE element based on its sequence content.
 */
function analyzeDSEQuality(sequence: string, dseRegion: GenomicRegion): number {
  const dseSequence = sequence.substring(dseRegion.start, dseRegion.end).replace(/T/g, 'U');
  if (dseSequence === '') {
    return BASE_POLYA_SCORE;
  }
  const dseRNA = new RNA(dseSequence);

  let score = BASE_POLYA_SCORE;

  // GU-rich regions with U clusters get highest score
  if (DSE_QUALITY_GU_U_PATTERN.matches(dseRNA)) {
    score = PERFECT_DSE_SCORE;
  }
  // Simple GU-rich gets high score
  else if (DSE_QUALITY_GU3_PATTERN.matches(dseRNA)) {
    score = HIGH_DSE_SCORE;
  }
  // U-rich gets medium score
  else if (
    (dseSequence.match(/U/g) ?? []).length / dseSequence.length >
    MODERATE_U_CONTENT_THRESHOLD
  ) {
    score = MODERATE_USE_SCORE;
  }

  return Math.min(score, PERFECT_USE_SCORE);
}

/**
 * Cleavage site prediction with context-aware scoring.
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

  let bestPosition = undefined;
  let bestScore = -1;

  for (let pos = searchStart; pos < searchEnd; pos++) {
    if (pos >= sequence.length) {
      break;
    }

    const nucleotide = sequence[pos].toUpperCase().replace('T', 'U');
    const preferenceIndex = preferences.indexOf(nucleotide);

    if (preferenceIndex !== -1) {
      // Base score from nucleotide preference
      let score = preferences.length - preferenceIndex;

      // Context scoring: avoid problematic sequences
      const context = sequence.substring(Math.max(0, pos - 2), Math.min(sequence.length, pos + 3));

      if (context !== '') {
        // Penalize poly-G regions (difficult to cleave)
        if (POLY_G3_CONTEXT_PATTERN.matches(new RNA(context))) {
          score *= INHIBITORY_G_RUN_PENALTY;
        }
        // Favor A/U rich context
        else {
          const auContext = context.replace(/T/g, 'U');
          if (auContext !== '' && AU_RICH_CONTEXT_PATTERN.matches(new RNA(auContext))) {
            score *= AU_RICH_CONTEXT_BOOST;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestPosition = pos;
      }
    }
  }

  return bestPosition;
}

/**
 * Validates biological constraints for cleavage sites.
 */
function validateCleavageSiteConstraints(
  sequence: string,
  signalPosition: number,
  cleavagePosition: number | undefined,
  options: CleavageSiteOptions,
): boolean {
  // Must have a valid cleavage site
  if (cleavagePosition === undefined) {
    return false;
  }

  // Check distance constraints
  const distance = cleavagePosition - (signalPosition + options.polyASignal![0].length);
  const [minDist, maxDist] = options.distanceRange!;

  if (distance < minDist || distance > maxDist) {
    return false;
  }

  // Avoid cleavage in problematic regions
  const context = sequence.substring(
    Math.max(0, cleavagePosition - 3),
    Math.min(sequence.length, cleavagePosition + 3),
  );

  if (context === '') {
    return true;
  }

  // Reject if cleavage site is in a poly-G region (>= 4 consecutive Gs)
  if (POLY_G4_CONTEXT_PATTERN.matches(new RNA(context))) {
    return false;
  }

  return true;
}
