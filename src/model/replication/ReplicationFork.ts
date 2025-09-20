/**
 * Replication Fork Class
 *
 * Represents the Y-shaped structure formed when DNA helicase unwinds
 * the double helix during replication. Manages the progression of
 * replication and tracks biological constraints.
 */

import { OrganismProfile } from '../../types/replication-types.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';

/**
 * Represents a DNA replication fork and its progression.
 */
export class ReplicationFork {
  /**
   * Creates a new replication fork.
   *
   * @param position - Current position of the fork (0-based)
   * @param dnaLength - Total length of DNA being replicated
   * @param organism - Organism profile for biological constraints
   * @throws Error if parameters are invalid
   */
  constructor(
    public position: number = 0,
    public readonly dnaLength: number,
    public readonly organism: OrganismProfile,
  ) {
    this.validateParameters();
  }

  /**
   * Creates a replication fork with validation.
   *
   * @param position - Starting position
   * @param dnaLength - Total DNA length
   * @param organism - Organism profile
   * @returns ValidationResult containing ReplicationFork or error
   */
  static create(
    position: number,
    dnaLength: number,
    organism: OrganismProfile,
  ): ValidationResult<ReplicationFork> {
    try {
      if (position < 0) {
        return failure(`Position must be non-negative. Provided: ${position}`);
      }

      if (dnaLength <= 0) {
        return failure(`DNA length must be positive. Provided: ${dnaLength}`);
      }

      if (position > dnaLength) {
        return failure(`Position (${position}) cannot exceed DNA length (${dnaLength})`);
      }

      return success(new ReplicationFork(position, dnaLength, organism));
    } catch (error) {
      return failure(
        `Failed to create replication fork: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Gets the completion percentage of replication (0-100).
   */
  getCompletionPercentage(): number {
    if (this.dnaLength === 0) {
      return 100;
    }
    return Math.min(100, (this.position / this.dnaLength) * 100);
  }

  /**
   * Checks if replication can advance further.
   */
  canAdvance(): boolean {
    return this.position < this.dnaLength;
  }

  /**
   * Checks if replication is complete.
   */
  isComplete(): boolean {
    return this.position >= this.dnaLength;
  }

  /**
   * Gets the remaining distance to replicate.
   */
  getRemainingDistance(): number {
    return Math.max(0, this.dnaLength - this.position);
  }

  /**
   * Advances the fork by the specified number of base pairs.
   *
   * @param basePairs - Number of base pairs to advance
   * @returns New position after advancement
   * @throws Error if advancement would exceed DNA length
   */
  advance(basePairs: number): number {
    if (basePairs < 0) {
      throw new Error(`Cannot advance by negative amount: ${basePairs}`);
    }

    const newPosition = this.position + basePairs;
    if (newPosition > this.dnaLength) {
      throw new Error(`Advancement would exceed DNA length: ${newPosition} > ${this.dnaLength}`);
    }

    this.position = newPosition;
    return this.position;
  }

  /**
   * Safely advances the fork, capping at DNA length.
   *
   * @param basePairs - Number of base pairs to advance
   * @returns Actual distance advanced
   */
  safeAdvance(basePairs: number): number {
    const maxAdvancement = this.getRemainingDistance();
    const actualAdvancement = Math.min(basePairs, maxAdvancement);
    this.position += actualAdvancement;
    return actualAdvancement;
  }

  /**
   * Gets an expected Okazaki fragment size for this organism.
   * Returns a random size within the organism's biological range.
   */
  getExpectedFragmentSize(): number {
    const [min, max] = this.organism.fragmentSize;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Gets an expected RNA primer length for this organism.
   * Returns a random length within the organism's biological range.
   */
  getExpectedPrimerLength(): number {
    const [min, max] = this.organism.primerLength;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Gets the theoretical time to complete replication at maximum speed.
   * Returns time in seconds.
   */
  getEstimatedCompletionTime(): number {
    const remainingBP = this.getRemainingDistance();
    return remainingBP / this.organism.polymeraseSpeed;
  }

  /**
   * Gets the current replication speed based on organism profile.
   * Returns speed in base pairs per second.
   */
  getCurrentSpeed(): number {
    return this.organism.polymeraseSpeed;
  }

  /**
   * Calculates how many Okazaki fragments are expected for the remaining distance.
   */
  getExpectedFragmentCount(): number {
    const remainingBP = this.getRemainingDistance();
    const [minSize, maxSize] = this.organism.fragmentSize;
    const avgFragmentSize = (minSize + maxSize) / 2;
    return Math.ceil(remainingBP / avgFragmentSize);
  }

  /**
   * Gets current replication statistics.
   */
  getStatistics(): {
    position: number;
    totalLength: number;
    completionPercentage: number;
    remainingDistance: number;
    estimatedTimeRemaining: number;
    expectedFragmentsRemaining: number;
    organismType: string;
    speed: number;
  } {
    return {
      position: this.position,
      totalLength: this.dnaLength,
      completionPercentage: this.getCompletionPercentage(),
      remainingDistance: this.getRemainingDistance(),
      estimatedTimeRemaining: this.getEstimatedCompletionTime(),
      expectedFragmentsRemaining: this.getExpectedFragmentCount(),
      organismType: this.organism.type,
      speed: this.getCurrentSpeed(),
    };
  }

  /**
   * Checks if the fork position is valid relative to fragment boundaries.
   *
   * @param fragmentEnd - End position of the last completed fragment
   * @returns True if fork position is consistent
   */
  isConsistentWith(fragmentEnd: number): boolean {
    return this.position >= fragmentEnd;
  }

  /**
   * Creates a copy of this replication fork.
   */
  copy(): ReplicationFork {
    return new ReplicationFork(this.position, this.dnaLength, this.organism);
  }

  /**
   * Returns a string representation of this replication fork.
   */
  toString(): string {
    const completion = this.getCompletionPercentage().toFixed(1);
    return `ReplicationFork(pos: ${this.position}/${this.dnaLength}, ${completion}% complete, ${this.organism.type})`;
  }

  /**
   * Compares this fork with another for equality.
   */
  equals(other: ReplicationFork): boolean {
    return (
      this.position === other.position &&
      this.dnaLength === other.dnaLength &&
      this.organism.type === other.organism.type &&
      this.organism.polymeraseSpeed === other.organism.polymeraseSpeed
    );
  }

  /**
   * Private method to validate constructor parameters.
   */
  private validateParameters(): void {
    if (this.position < 0) {
      throw new Error(`Position must be non-negative. Provided: ${this.position}`);
    }

    if (this.dnaLength <= 0) {
      throw new Error(`DNA length must be positive. Provided: ${this.dnaLength}`);
    }

    if (this.position > this.dnaLength) {
      throw new Error(`Position (${this.position}) cannot exceed DNA length (${this.dnaLength})`);
    }

    if (!this.organism) {
      throw new Error('Organism profile is required');
    }

    if (this.organism.polymeraseSpeed <= 0) {
      throw new Error(
        `Polymerase speed must be positive. Provided: ${this.organism.polymeraseSpeed}`,
      );
    }
  }
}
