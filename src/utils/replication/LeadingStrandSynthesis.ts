/**
 * Leading Strand Synthesis
 *
 * Manages continuous DNA synthesis on the leading strand during replication.
 * The leading strand is synthesized continuously in the 5' to 3' direction
 * as the replication fork progresses.
 */

import { DNAPolymerase } from '../../model/replication/enzyme/DNAPolymerase.js';
import { OrganismProfile, ReplicationEvent } from '../../types/replication-types.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';
import { DNA_PROOFREADING_THRESHOLD } from '../../constants/biological-constants.js';

/**
 * Manages continuous synthesis of the leading strand during DNA replication.
 */
export class LeadingStrandSynthesis {
  private readonly polymerase: DNAPolymerase;
  private synthesizedLength: number = 0;
  private isActive: boolean = false;

  /**
   * Creates a new leading strand synthesis manager.
   *
   * @param organism - Organism profile for biological parameters
   * @param startPosition - Starting position for synthesis
   */
  constructor(
    private readonly organism: OrganismProfile,
    startPosition: number = 0,
  ) {
    this.polymerase = new DNAPolymerase(startPosition, 'PolIII');
  }

  /**
   * Initiates leading strand synthesis with a primer.
   *
   * @param primerPosition - Position where primer is located
   * @returns Validation result with success/failure
   */
  initiateSynthesis(primerPosition: number): ValidationResult<void> {
    if (primerPosition < 0) {
      return failure(`Invalid primer position: ${primerPosition}. Must be non-negative`);
    }

    this.polymerase.moveTo(primerPosition);
    this.isActive = true;
    this.synthesizedLength = 0;

    return success(undefined);
  }

  /**
   * Advances leading strand synthesis by the specified number of base pairs.
   *
   * @param basePairs - Number of base pairs to synthesize
   * @returns Array of replication events generated during synthesis
   */
  advance(basePairs: number): ReplicationEvent[] {
    if (!this.isActive) {
      return [];
    }

    if (basePairs <= 0) {
      return [];
    }

    const events: ReplicationEvent[] = [];
    // Speed and position tracking not needed for current implementation

    // Perform continuous synthesis
    const synthesisEvent = this.polymerase.synthesize(basePairs, 'leading');
    events.push(synthesisEvent);

    // Update synthesis tracking
    this.synthesizedLength += basePairs;

    // Add proofreading event if synthesis was significant
    if (basePairs >= this.getProofreadingThreshold()) {
      const proofreadEvent = this.polymerase.proofread('leading');
      events.push(proofreadEvent);
    }

    return events;
  }

  /**
   * Gets the current synthesis speed for the organism.
   *
   * @returns Speed in base pairs per second
   */
  getSpeed(): number {
    return this.polymerase.getSpeed(this.organism);
  }

  /**
   * Gets the current position of the polymerase.
   *
   * @returns Current position
   */
  getCurrentPosition(): number {
    return this.polymerase.position;
  }

  /**
   * Gets the total length of DNA synthesized.
   *
   * @returns Total synthesized length in base pairs
   */
  getSynthesizedLength(): number {
    return this.synthesizedLength;
  }

  /**
   * Checks if synthesis is currently active.
   *
   * @returns True if synthesis is active
   */
  isSynthesizing(): boolean {
    return this.isActive;
  }

  /**
   * Stops leading strand synthesis.
   */
  stopSynthesis(): void {
    this.isActive = false;
  }

  /**
   * Calculates synthesis progress from start position to current position.
   *
   * @param totalLength - Total length of DNA being replicated
   * @returns Progress as percentage (0-100)
   */
  getProgress(totalLength: number): number {
    if (totalLength <= 0) {
      return 100;
    }
    return Math.min(100, (this.synthesizedLength / totalLength) * 100);
  }

  /**
   * Gets the threshold for triggering proofreading events.
   * Based on biological research, proofreading occurs periodically during synthesis.
   *
   * @returns Minimum base pairs before proofreading
   */
  private getProofreadingThreshold(): number {
    return DNA_PROOFREADING_THRESHOLD;
  }

  /**
   * Creates a summary of current synthesis state.
   *
   * @returns Synthesis state summary
   */
  getState(): {
    position: number;
    synthesizedLength: number;
    isActive: boolean;
    speed: number;
  } {
    return {
      position: this.polymerase.position,
      synthesizedLength: this.synthesizedLength,
      isActive: this.isActive,
      speed: this.getSpeed(),
    };
  }
}
