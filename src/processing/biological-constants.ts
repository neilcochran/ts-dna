/**
 * Biological / algorithmic constants for the RNA processing pipeline.
 *
 * Covers poly-A tail behaviour, polyadenylation signal recognition and scoring, USE / DSE
 * regulatory-element scoring, cleavage-site selection, and splicing-length minimums. Sizes
 * are in nucleotides; thresholds are normalized 0-1 unless noted.
 */

/** Default mammalian poly-A tail length (adenines). */
export const DEFAULT_POLY_A_TAIL_LENGTH = 200;

/** Minimum tail length used to detect an existing poly-A tail (consecutive A's). */
export const MIN_POLY_A_DETECTION_LENGTH = 10;

/** Maximum allowed poly-A tail length. */
export const MAX_POLY_A_TAIL_LENGTH = 1000;

/** Regex pattern matching a trailing poly-A run. */
export const POLY_A_TAIL_PATTERN = /A+$/;

/** Offset (bp) from the AATAAA/AAUAAA hexamer to the typical cleavage site. */
export const POLYA_SIGNAL_OFFSET = 6;

/** Default cleavage-site offset used when no specific signal context is supplied. */
export const DEFAULT_CLEAVAGE_OFFSET = 15;

/** Canonical polyadenylation signal in DNA (becomes AAUAAA in RNA). */
export const CANONICAL_POLYA_SIGNAL_DNA = 'AATAAA';

/**
 * Recognized polyadenylation signal variants paired with their relative strengths (0-100).
 * AAUAAA is the canonical signal; the variants reflect experimentally measured cleavage
 * efficiencies.
 */
export const POLYA_SIGNALS = {
  AAUAAA: 100,
  AUUAAA: 80,
  AGUAAA: 30,
  AAUAUA: 25,
  AAUACA: 20,
  CAUAAA: 18,
  GAUAAA: 15,
  AAAAAG: 12,
  AAAACA: 10,
} as const;

/** Fallback strength for an unrecognized polyadenylation signal. */
export const DEFAULT_POLYA_SIGNAL_STRENGTH = 8;

/** Minimum intron length permitting GT-AG recognition by the spliceosome. */
export const MIN_INTRON_LENGTH_FOR_SPLICING = 4;

/** Minimum RNA length required before the polyadenylation analyzer will scan. */
export const MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH = 20;

/** Maximum strength boost from upstream USE (Upstream Sequence Element) motifs. */
export const USE_ELEMENT_MAX_BOOST = 30;

/** Maximum strength boost from downstream DSE (Downstream Sequence Element) motifs. */
export const DSE_ELEMENT_MAX_BOOST = 20;

/** Base score used when computing polyadenylation site quality. */
export const BASE_POLYA_SCORE = 0.3;

/** Threshold (0-1) for considering a USE region high U-content. */
export const HIGH_U_CONTENT_THRESHOLD = 0.7;

/** Threshold (0-1) for considering a USE region moderately U-rich. */
export const MODERATE_U_CONTENT_THRESHOLD = 0.6;

/** Score awarded to moderate-quality USE elements. */
export const MODERATE_USE_SCORE = 0.6;

/** Penalty multiplier applied to cleavage candidates inside a poly-G run. */
export const INHIBITORY_G_RUN_PENALTY = 0.3;

/** Boost multiplier applied to cleavage candidates in A/U-rich context. */
export const AU_RICH_CONTEXT_BOOST = 1.2;

/** Score awarded to optimal USE motifs (UGUA). */
export const PERFECT_USE_SCORE = 1.0;

/** Score awarded to high-quality USE motifs (UYU). */
export const HIGH_USE_SCORE = 0.8;

/** Score awarded to optimal DSE motifs (GU-rich with U clusters). */
export const PERFECT_DSE_SCORE = 1.0;

/** Score awarded to high-quality DSE motifs (plain GU-rich). */
export const HIGH_DSE_SCORE = 0.8;

/** Minimum total strength score required for a polyadenylation site to be reported. */
export const MIN_POLYA_SITE_STRENGTH = 25;

/** Default ordered list of polyadenylation signals scanned during analysis. */
export const DEFAULT_POLYA_SIGNALS = ['AAUAAA', 'AUUAAA', 'AGUAAA', 'AAUAUA', 'AAUACA'] as const;

/** Default USE motif pattern. */
export const DEFAULT_UPSTREAM_USE_PATTERN = 'U{3,}|UGUA';

/** Default DSE motif pattern. */
export const DEFAULT_DOWNSTREAM_DSE_PATTERN = 'U{3,}|GU{2,}';

/** Default cleavage-site preference order (nucleotides, most-preferred first). */
export const DEFAULT_CLEAVAGE_PREFERENCE = ['A', 'U', 'C', 'G'] as const;

/** Default range (inclusive) of distances from the signal to a valid cleavage site. */
export const DEFAULT_CLEAVAGE_DISTANCE_RANGE = [11, 23] as const;
