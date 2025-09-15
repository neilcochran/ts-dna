import { GenomicRegion } from './genomic-region';

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

    /** Nucleotide preference at cleavage site: A > U > C >> G */
    readonly cleavagePreference?: readonly string[];

    /** Distance range from poly-A signal to cleavage site [min, max] */
    readonly distanceRange?: readonly [number, number];
}

/**
 * Default polyadenylation signal recognition options based on biological data.
 */
export const DEFAULT_CLEAVAGE_OPTIONS: CleavageSiteOptions = {
    polyASignal: ['AAUAAA', 'AUUAAA', 'AGUAAA', 'AAUAUA', 'AAUACA'],
    upstreamUSE: 'U{3,}|UGUA',
    downstreamDSE: 'U{3,}|GU{2,}',
    cleavagePreference: ['A', 'U', 'C', 'G'],
    distanceRange: [11, 23]
} as const;