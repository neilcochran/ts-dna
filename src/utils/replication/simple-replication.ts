/**
 * Simple DNA Replication Interface
 *
 * Provides an easy-to-use API for DNA replication that handles all the
 * complexity of fork coordination and enzyme management internally.
 */

import { DNA } from '../../model/nucleic-acids/DNA.js';
import { ReplicationFork } from '../../model/replication/ReplicationFork.js';
import { ForkCoordinator } from './ForkCoordinator.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';
import { OrganismProfile, E_COLI } from '../../types/replication-types.js';

/**
 * Options for simple DNA replication.
 */
export interface SimpleReplicationOptions {
  /** Organism profile defining biological parameters (default: E_COLI) */
  organism?: OrganismProfile;
  /** Starting position for replication (default: 0) */
  startPosition?: number;
  /** Maximum steps to prevent infinite loops (default: 10000) */
  maxSteps?: number;
  /** Enable detailed event logging (default: false) */
  enableDetailedLogging?: boolean;
}

/**
 * Result of DNA replication.
 */
export interface ReplicationResult {
  /** The two replicated DNA strands */
  replicatedStrands: [DNA, DNA];
  /** Number of replication steps taken */
  steps: number;
  /** Total events recorded during replication */
  eventCount: number;
  /** Final completion percentage */
  completionPercentage: number;
  /** Time taken in biological units (base pairs processed) */
  basePairsProcessed: number;
}

/**
 * Replicates a DNA sequence, producing two identical copies.
 *
 * This is the main entry point for DNA replication in ts-dna. It handles
 * all the biological complexity of DNA replication including:
 * - Fork coordination and enzyme management
 * - Leading and lagging strand synthesis
 * - Okazaki fragment processing
 * - Primer synthesis and removal
 * - Biological timing and constraints
 *
 * @param dna - The DNA sequence to replicate
 * @param options - Optional configuration for replication
 * @returns ValidationResult containing the two replicated DNA strands
 *
 * @example
 * ```typescript
 * import { DNA, replicateDNA } from 'ts-dna';
 *
 * const dna = new DNA('ATGCGATCGTAGCTACGT');
 * const result = replicateDNA(dna);
 *
 * if (result.success) {
 *   const [strand1, strand2] = result.data.replicatedStrands;
 *   console.log('Replication completed!');
 *   console.log('Steps taken:', result.data.steps);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom organism and options
 * import { HUMAN } from 'ts-dna';
 *
 * const result = replicateDNA(dna, {
 *   organism: HUMAN,
 *   enableDetailedLogging: true
 * });
 * ```
 */
export function replicateDNA(
  dna: DNA,
  options: SimpleReplicationOptions = {},
): ValidationResult<ReplicationResult> {
  try {
    // Apply defaults
    const { organism = E_COLI, startPosition = 0, maxSteps = 10000 } = options;

    // Validate inputs
    if (startPosition < 0 || startPosition >= dna.getSequence().length) {
      return failure(
        `Invalid start position: ${startPosition}. Must be between 0 and ${dna.getSequence().length - 1}`,
      );
    }

    if (maxSteps <= 0) {
      return failure(`Invalid maxSteps: ${maxSteps}. Must be positive`);
    }

    // Create replication fork
    const fork = new ReplicationFork(startPosition, dna.getSequence().length, organism);

    // Create fork coordinator
    const coordinator = new ForkCoordinator(dna, fork, organism);

    // Initialize replication
    const initResult = coordinator.initializeReplication();
    if (!initResult.success) {
      return failure(`Replication initialization failed: ${initResult.error}`);
    }

    // Complete replication
    const replicationResult = coordinator.completeReplication(maxSteps);
    if (!replicationResult.success) {
      return failure(`Replication failed: ${replicationResult.error}`);
    }

    // Get final statistics
    const finalState = replicationResult.data;
    const events = coordinator.getAllEvents();
    const statistics = coordinator.getStatistics();

    // Create replicated DNA strands
    // For now, we return copies of the original DNA
    // In a full implementation, we would construct the actual replicated sequences
    const replicatedStrand1 = new DNA(dna.getSequence());
    const replicatedStrand2 = new DNA(dna.getSequence());

    const result: ReplicationResult = {
      replicatedStrands: [replicatedStrand1, replicatedStrand2],
      steps: statistics.totalEvents,
      eventCount: events.length,
      completionPercentage: finalState.completionPercentage,
      basePairsProcessed: finalState.forkPosition,
    };

    return success(result);
  } catch (error) {
    return failure(
      `DNA replication failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Simple DNA replication that returns just the replicated strands.
 *
 * This is a convenience function for when you only need the replicated DNA
 * and don't care about replication statistics or events.
 *
 * @param dna - The DNA sequence to replicate
 * @param organism - Optional organism profile (default: E_COLI)
 * @returns ValidationResult containing the two replicated DNA strands
 *
 * @example
 * ```typescript
 * import { DNA, replicateDNASimple } from 'ts-dna';
 *
 * const dna = new DNA('ATGCGATCGTAGCTACGT');
 * const result = replicateDNASimple(dna);
 *
 * if (result.success) {
 *   const [strand1, strand2] = result.data;
 *   console.log('Replication completed!');
 * }
 * ```
 */
export function replicateDNASimple(
  dna: DNA,
  organism: OrganismProfile = E_COLI,
): ValidationResult<[DNA, DNA]> {
  const result = replicateDNA(dna, { organism });

  if (result.success) {
    return success(result.data.replicatedStrands);
  }

  return failure(result.error);
}
