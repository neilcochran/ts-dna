/**
 * Abstract base class for all DNA replication enzymes.
 *
 * Represents the common functionality shared by all enzymes involved
 * in DNA replication, including position tracking, activation state,
 * and basic movement operations.
 */

import { EnzymeType, OrganismProfile } from '../../../types/replication-types.js';

/**
 * Abstract base class for all DNA replication enzymes.
 */
export abstract class Enzyme {
  /**
   * Creates a new enzyme.
   *
   * @param position - Current position of the enzyme (0-based)
   * @param type - Type of enzyme
   * @param isActive - Whether enzyme is currently active
   */
  constructor(
    public position: number,
    public readonly type: EnzymeType,
    public isActive: boolean = true,
  ) {
    this.validatePosition();
  }

  /**
   * Gets the operating speed of this enzyme for the given organism.
   *
   * @param organism - Organism profile for speed calculation
   * @returns Speed in base pairs per second
   */
  abstract getSpeed(organism: OrganismProfile): number;

  /**
   * Checks if this enzyme can operate at the given position.
   *
   * @param position - Position to check
   * @returns True if enzyme can operate at this position
   */
  abstract canOperate(position: number): boolean;

  /**
   * Advances the enzyme by the specified distance.
   *
   * @param distance - Distance to advance in base pairs
   * @returns New position
   */
  advance(distance: number): number {
    if (distance < 0) {
      throw new Error(`Cannot advance by negative distance: ${distance}`);
    }
    this.position += distance;
    return this.position;
  }

  /**
   * Sets the enzyme's active state.
   */
  setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Moves the enzyme to a specific position.
   */
  moveTo(position: number): void {
    if (position < 0) {
      throw new Error(`Position must be non-negative: ${position}`);
    }
    this.position = position;
  }

  /**
   * Gets a string representation of this enzyme.
   */
  toString(): string {
    const status = this.isActive ? 'active' : 'inactive';
    return `${this.type}(pos: ${this.position}, ${status})`;
  }

  /**
   * Private method to validate position.
   */
  private validatePosition(): void {
    if (this.position < 0) {
      throw new Error(`Enzyme position must be non-negative: ${this.position}`);
    }
  }
}
