/**
 * Fork Coordinator
 *
 * Coordinates the movement and activities of the replication fork,
 * managing both leading and lagging strand synthesis to ensure
 * proper synchronized DNA replication.
 */

import { DNA } from '../../model/nucleic-acids/DNA.js';
import { Replisome } from '../../model/replication/Replisome.js';
import { ReplicationFork } from '../../model/replication/ReplicationFork.js';
import { LeadingStrandSynthesis } from './LeadingStrandSynthesis.js';
import { LaggingStrandSynthesis } from './LaggingStrandSynthesis.js';
import {
  OrganismProfile,
  ReplicationEvent,
  ReplicationRuntimeState,
} from '../../types/replication-types.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';

/**
 * Coordinates replication fork progression and strand synthesis activities.
 */
export class ForkCoordinator {
  private readonly replisome: Replisome;
  private readonly leadingStrand: LeadingStrandSynthesis;
  private readonly laggingStrand: LaggingStrandSynthesis;
  private readonly allEvents: ReplicationEvent[] = [];
  private actualStepsTaken: number = 0;

  /**
   * Creates a new fork coordinator.
   *
   * @param dna - DNA sequence being replicated
   * @param fork - Replication fork managing position and progress
   * @param organism - Organism profile for biological parameters
   */
  constructor(
    private readonly dna: DNA,
    private readonly fork: ReplicationFork,
    private readonly organism: OrganismProfile,
  ) {
    this.replisome = new Replisome(fork, organism);
    this.leadingStrand = new LeadingStrandSynthesis(organism, fork.position);
    this.laggingStrand = new LaggingStrandSynthesis(organism, fork.position);
  }

  /**
   * Initializes replication by setting up both strands and the replisome.
   *
   * @returns Validation result with initialization events
   */
  initializeReplication(): ValidationResult<ReplicationEvent[]> {
    const events: ReplicationEvent[] = [];

    try {
      // Initialize leading strand synthesis
      const leadingInit = this.leadingStrand.initiateSynthesis(this.fork.position);
      if (!leadingInit.success) {
        return failure(`Failed to initialize leading strand: ${leadingInit.error}`);
      }

      // Initialize lagging strand synthesis
      const laggingInit = this.laggingStrand.initiateSynthesis(this.fork.position);
      if (!laggingInit.success) {
        return failure(`Failed to initialize lagging strand: ${laggingInit.error}`);
      }
      events.push(...laggingInit.data);

      this.allEvents.push(...events);
      return success(events);
    } catch (error) {
      return failure(
        `Replication initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Advances the replication fork by the specified number of base pairs.
   * Coordinates helicase unwinding, primer synthesis, DNA synthesis, and processing.
   *
   * @param basePairs - Number of base pairs to advance
   * @returns Validation result with replication state
   */
  advanceFork(basePairs: number): ValidationResult<ReplicationRuntimeState> {
    if (basePairs <= 0) {
      return failure('Base pairs to advance must be positive');
    }

    if (this.fork.isComplete()) {
      return failure('Replication is already complete');
    }

    try {
      const events: ReplicationEvent[] = [];

      // Advance the replisome (helicase unwinding, enzyme coordination)
      const replisomeEvents = this.replisome.advanceFork(basePairs);
      events.push(...replisomeEvents);

      // Coordinate leading strand synthesis
      const leadingEvents = this.leadingStrand.advance(basePairs);
      events.push(...leadingEvents);

      // Coordinate lagging strand synthesis
      const laggingEvents = this.laggingStrand.advance(this.fork.position, basePairs);
      events.push(...laggingEvents);

      // Store events for history
      this.allEvents.push(...events);

      // Create current state snapshot
      const state = this.getCurrentState();
      return success(state);
    } catch (error) {
      return failure(
        `Fork advancement failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Advances replication to completion or until blocked.
   *
   * @param maxSteps - Maximum number of advancement steps to prevent infinite loops
   * @returns Validation result with final state
   */
  completeReplication(maxSteps: number = 10000): ValidationResult<ReplicationRuntimeState> {
    let steps = 0;
    const stepSize = Math.max(1, Math.floor(this.dna.getSequence().length / 100)); // 1% increments

    while (!this.fork.isComplete() && steps < maxSteps) {
      const remainingLength = this.dna.getSequence().length - this.fork.position;
      const advanceBy = Math.min(stepSize, remainingLength);

      const result = this.advanceFork(advanceBy);
      if (!result.success) {
        return failure(`Replication failed at step ${steps}: ${result.error}`);
      }

      steps++;
    }

    // Store the actual steps taken for accurate reporting
    this.actualStepsTaken = steps;

    if (steps >= maxSteps) {
      return failure(`Replication did not complete within ${maxSteps} steps`);
    }

    // Finalize any remaining processing
    this.finalizeReplication();

    return success(this.getCurrentState());
  }

  /**
   * Finalizes replication by completing any remaining fragment processing.
   */
  private finalizeReplication(): void {
    // Stop synthesis on both strands
    this.leadingStrand.stopSynthesis();
    this.laggingStrand.stopSynthesis();

    // The replisome should handle final cleanup of remaining fragments
    // This is already managed by the existing replisome implementation
  }

  /**
   * Gets the current state of replication including both strands and fork position.
   *
   * @returns Current replication runtime state
   */
  getCurrentState(): ReplicationRuntimeState {
    const replisomeState = this.replisome.getCurrentState();

    return {
      forkPosition: this.fork.position,
      completionPercentage: this.fork.getCompletionPercentage(),
      leadingStrandProgress: this.leadingStrand.getCurrentPosition(),
      laggingStrandProgress: this.laggingStrand.getTotalSynthesizedLength(),
      activeFragments: replisomeState.activeFragments,
      activeEnzymes: replisomeState.activeEnzymes,
    };
  }

  /**
   * Gets all replication events that have occurred.
   *
   * @returns Array of all replication events
   */
  getAllEvents(): ReplicationEvent[] {
    return [...this.allEvents];
  }

  /**
   * Gets events of a specific type.
   *
   * @param eventType - Type of events to filter
   * @returns Array of events of the specified type
   */
  getEventsByType(eventType: ReplicationEvent['type']): ReplicationEvent[] {
    return this.allEvents.filter(event => event.type === eventType);
  }

  /**
   * Gets statistics about the replication process.
   *
   * @returns Replication statistics
   */
  getStatistics(): {
    totalEvents: number;
    actualSteps: number;
    fork: {
      position: number;
      completion: number;
      isComplete: boolean;
    };
    leadingStrand: {
      position: number;
      synthesizedLength: number;
      isActive: boolean;
      speed: number;
    };
    laggingStrand: {
      totalFragments: number;
      completedFragments: number;
      activeFragments: number;
      synthesizedLength: number;
      isActive: boolean;
    };
    eventCounts: {
      unwind: number;
      primerSynthesis: number;
      dnaSynthesis: number;
      ligation: number;
      proofreading: number;
      primerRemoval: number;
    };
  } {
    const leadingState = this.leadingStrand.getState();
    const laggingState = this.laggingStrand.getState();

    return {
      totalEvents: this.allEvents.length,
      actualSteps: this.actualStepsTaken,
      fork: {
        position: this.fork.position,
        completion: this.fork.getCompletionPercentage(),
        isComplete: this.fork.isComplete(),
      },
      leadingStrand: {
        position: leadingState.position,
        synthesizedLength: leadingState.synthesizedLength,
        isActive: leadingState.isActive,
        speed: leadingState.speed,
      },
      laggingStrand: {
        totalFragments: laggingState.totalFragments,
        completedFragments: laggingState.completedFragments,
        activeFragments: laggingState.activeFragments,
        synthesizedLength: laggingState.totalSynthesizedLength,
        isActive: laggingState.isActive,
      },
      eventCounts: {
        unwind: this.getEventsByType('unwind').length,
        primerSynthesis: this.getEventsByType('primer_synthesis').length,
        dnaSynthesis: this.getEventsByType('dna_synthesis').length,
        ligation: this.getEventsByType('ligation').length,
        proofreading: this.getEventsByType('proofreading').length,
        primerRemoval: this.getEventsByType('primer_removal').length,
      },
    };
  }

  /**
   * Checks if replication is complete.
   *
   * @returns True if replication is complete
   */
  isComplete(): boolean {
    return this.fork.isComplete();
  }

  /**
   * Gets the DNA sequence being replicated.
   *
   * @returns DNA instance
   */
  getDNA(): DNA {
    return this.dna;
  }

  /**
   * Gets the organism profile being used.
   *
   * @returns Organism profile
   */
  getOrganism(): OrganismProfile {
    return this.organism;
  }
}
