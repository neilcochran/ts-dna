import { GenomicRegion } from './genomic-region';
import {
  DEFAULT_POLYA_SIGNALS,
  DEFAULT_UPSTREAM_USE_PATTERN,
  DEFAULT_DOWNSTREAM_DSE_PATTERN,
  DEFAULT_CLEAVAGE_PREFERENCE,
  DEFAULT_CLEAVAGE_DISTANCE_RANGE,
} from '../constants/biological-constants';

/**
 * Represents a polyadenylation site with detailed information about
 * the polyadenylation signal and surrounding regulatory elements.
 */
export interface PolyadenylationSite {
  /** Position of the polyadenylation signal in the sequence */
  readonly position: number;

  /** The actual signal sequence found (e.g., "AAUAAA", "AUUAAA") */
  readonly signal: string;

  /** Strength score based on signal type and context (0-100) */
  readonly strength: number;

  /** Upstream sequence elements (U-rich and UGUA motifs) that enhance efficiency */
  readonly upstreamUSE?: GenomicRegion;

  /** Downstream sequence elements (U-rich and GU-rich) that enhance efficiency */
  readonly downstreamDSE?: GenomicRegion;

  /** Predicted cleavage position (11-23 bp downstream of signal) */
  readonly cleavageSite?: number;
}

/**
 * Options for configuring polyadenylation site recognition.
 */
export interface CleavageSiteOptions {
  /** Polyadenylation signals to search for, in order of preference */
  readonly polyASignal?: readonly string[];

  /** Pattern for upstream sequence elements (USE) */
  readonly upstreamUSE?: string;

  /** Pattern for downstream sequence elements (DSE) */
  readonly downstreamDSE?: string;

  /** Nucleotide preference at cleavage site: A \> U \> C \>\> G */
  readonly cleavagePreference?: readonly string[];

  /** Distance range from poly-A signal to cleavage site [min, max] */
  readonly distanceRange?: readonly [number, number];
}

/**
 * Default polyadenylation signal recognition options based on biological data.
 */
export const DEFAULT_CLEAVAGE_OPTIONS: CleavageSiteOptions = {
  polyASignal: DEFAULT_POLYA_SIGNALS,
  upstreamUSE: DEFAULT_UPSTREAM_USE_PATTERN,
  downstreamDSE: DEFAULT_DOWNSTREAM_DSE_PATTERN,
  cleavagePreference: DEFAULT_CLEAVAGE_PREFERENCE,
  distanceRange: DEFAULT_CLEAVAGE_DISTANCE_RANGE,
} as const;
