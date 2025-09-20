/**
 * Core types and interfaces for DNA replication simulation.
 *
 * This module defines the fundamental data structures used throughout
 * the DNA replication process, including replication state, enzyme positions,
 * Okazaki fragments, and organism-specific parameters.
 */

/**
 * Represents the current state of DNA replication at a replication fork.
 * This interface defines the data structure for replication state.
 */
export interface ReplicationState {
  /** Current position of the replication fork (0-based) */
  forkPosition: number;

  /** Percentage of replication completed (0-100) */
  completionPercentage: number;

  /** Progress of continuous leading strand synthesis */
  leadingStrandProgress: number;

  /** Progress of discontinuous lagging strand synthesis */
  laggingStrandProgress: number;

  /** Currently active Okazaki fragments being synthesized */
  activeFragments: import('../model/replication/OkazakiFragment.js').OkazakiFragment[];

  /** Positions and states of all active enzymes */
  activeEnzymes: EnzymePosition[];
}

/**
 * Represents the actual runtime state returned by Replisome.getCurrentState().
 * Uses actual class instances rather than interface data structures.
 */
export interface ReplicationRuntimeState {
  /** Current position of the replication fork (0-based) */
  forkPosition: number;

  /** Percentage of replication completed (0-100) */
  completionPercentage: number;

  /** Progress of continuous leading strand synthesis */
  leadingStrandProgress: number;

  /** Progress of discontinuous lagging strand synthesis */
  laggingStrandProgress: number;

  /** Currently active Okazaki fragments (class instances) */
  activeFragments: import('../model/replication/OkazakiFragment.js').OkazakiFragment[];

  /** Positions and states of all active enzymes */
  activeEnzymes: EnzymePosition[];
}

/**
 * Represents the position and state of an enzyme in the replication machinery.
 */
export interface EnzymePosition {
  /** Type of enzyme */
  type: EnzymeType;

  /** Current position of the enzyme (0-based) */
  position: number;

  /** Which strand this enzyme is working on */
  strand: 'leading' | 'lagging';

  /** Whether this enzyme is currently active */
  isActive: boolean;
}

/**
 * Types of enzymes involved in DNA replication.
 */
export enum EnzymeType {
  /** DNA helicase - unwinds the DNA double helix */
  HELICASE = 'helicase',

  /** DNA primase - synthesizes RNA primers */
  PRIMASE = 'primase',

  /** DNA polymerase - synthesizes DNA */
  POLYMERASE = 'polymerase',

  /** DNA ligase - joins Okazaki fragments */
  LIGASE = 'ligase',

  /** 5' to 3' exonuclease - removes RNA primers */
  EXONUCLEASE = 'exonuclease',
}

/**
 * Organism-specific parameters that affect DNA replication.
 *
 * Different organisms have different replication characteristics
 * based on their cellular organization and DNA packaging.
 */
export interface OrganismProfile {
  /** DNA polymerase speed in base pairs per second */
  polymeraseSpeed: number;

  /** Range of Okazaki fragment sizes [min, max] in nucleotides */
  fragmentSize: [number, number];

  /** Range of RNA primer lengths [min, max] in nucleotides */
  primerLength: [number, number];

  /** Whether this organism packages DNA in nucleosomes */
  hasNucleosomes: boolean;

  /** Organism type for reference */
  type: 'prokaryotic' | 'eukaryotic';
}

/**
 * Represents a single molecular event during DNA replication.
 */
export interface ReplicationEvent {
  /** Type of replication event */
  type:
    | 'unwind'
    | 'primer_synthesis'
    | 'dna_synthesis'
    | 'ligation'
    | 'proofreading'
    | 'primer_removal';

  /** Position where the event occurred */
  position: number;

  /** Enzyme responsible for this event */
  enzyme: EnzymeType;

  /** Strand where the event occurred */
  strand: 'leading' | 'lagging';

  /** Timestamp of the event (optional, for timing simulations) */
  timestamp?: number;

  /** ID of associated Okazaki fragment (for lagging strand events) */
  fragmentId?: string;

  /** Number of base pairs added in this event */
  basePairsAdded?: number;

  /** Additional event-specific data */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration options for DNA replication simulation.
 */
export interface ReplicationOptions {
  /** Organism profile to use for biological parameters */
  organism?: OrganismProfile;

  /** Override polymerase variant (for prokaryotes) */
  polymerase?: 'PolI' | 'PolII' | 'PolIII';

  /** Override fragment size range */
  fragmentSize?: [number, number];

  /** Override primer length range */
  primerLength?: [number, number];

  /** Enable biological timing calculations */
  enableTiming?: boolean;

  /** Temperature in Celsius (affects enzyme speeds) */
  temperature?: number;

  /** Enable proofreading simulation */
  enableProofreading?: boolean;

  /** Error rate per base pair (for mutation simulation) */
  errorRate?: number;
}

/**
 * Pre-defined organism profiles based on biological research.
 */
export const ORGANISM_PROFILES = {
  /**
   * E. coli (prokaryotic) replication parameters.
   * Based on research: 1000 bp/s, 1000-2000 nt fragments, 3-10 nt primers.
   */
  E_COLI: {
    polymeraseSpeed: 1000,
    fragmentSize: [1000, 2000] as [number, number],
    primerLength: [3, 10] as [number, number],
    hasNucleosomes: false,
    type: 'prokaryotic' as const,
  },

  /**
   * Human (eukaryotic) replication parameters.
   * Based on research: 50 bp/s, 100-200 nt fragments, 3-10 nt primers.
   */
  HUMAN: {
    polymeraseSpeed: 50,
    fragmentSize: [100, 200] as [number, number],
    primerLength: [3, 10] as [number, number],
    hasNucleosomes: true,
    type: 'eukaryotic' as const,
  },
} as const;

/**
 * E. coli organism profile for convenient import.
 */
export const E_COLI = ORGANISM_PROFILES.E_COLI;

/**
 * Human organism profile for convenient import.
 */
export const HUMAN = ORGANISM_PROFILES.HUMAN;
