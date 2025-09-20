/**
 * Okazaki Fragment Class
 *
 * Represents an Okazaki fragment synthesized during discontinuous
 * lagging strand DNA replication. These fragments are short DNA
 * sequences that are later joined by DNA ligase.
 *
 * Biological characteristics:
 * - Prokaryotes: 1000-2000 nucleotides
 * - Eukaryotes: 100-200 nucleotides
 * - Each requires an RNA primer for initiation
 * - Must be processed (primer removal and ligation)
 */

import { RNAPrimer } from './RNAPrimer.js';
import { DNA } from '../nucleic-acids/DNA.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';
import { OrganismProfile } from '../../types/replication-types.js';

/**
 * Represents an Okazaki fragment on the lagging strand.
 */
export class OkazakiFragment {
  private _sequence?: DNA;

  /**
   * Creates a new Okazaki fragment.
   *
   * @param id - Unique identifier for this fragment
   * @param startPosition - Starting position (0-based, inclusive)
   * @param endPosition - Ending position (0-based, exclusive)
   * @param primer - RNA primer that initiated this fragment
   * @param isPrimerRemoved - Whether RNA primer has been removed
   * @param isLigated - Whether fragment has been ligated to previous fragment
   * @throws Error if positions are invalid or fragment size is unrealistic
   */
  constructor(
    public readonly id: string,
    public readonly startPosition: number,
    public readonly endPosition: number,
    public readonly primer: RNAPrimer,
    public isPrimerRemoved: boolean = false,
    public isLigated: boolean = false,
  ) {
    this.validatePositions();
    this.validateSize();
  }

  /**
   * Creates an Okazaki fragment with validation.
   *
   * @param id - Unique identifier
   * @param startPosition - Start position
   * @param endPosition - End position
   * @param primer - RNA primer
   * @param isPrimerRemoved - Primer removal status
   * @param isLigated - Ligation status
   * @returns ValidationResult containing OkazakiFragment or error
   */
  static create(
    id: string,
    startPosition: number,
    endPosition: number,
    primer: RNAPrimer,
    isPrimerRemoved: boolean = false,
    isLigated: boolean = false,
  ): ValidationResult<OkazakiFragment> {
    try {
      // Validate ID
      if (!id || id.trim().length === 0) {
        return failure('Fragment ID cannot be empty');
      }

      // Validate positions
      if (startPosition < 0) {
        return failure(`Start position must be non-negative. Provided: ${startPosition}`);
      }

      if (endPosition <= startPosition) {
        return failure(
          `End position (${endPosition}) must be greater than start position (${startPosition})`,
        );
      }

      // Validate fragment size (reasonable biological limits)
      const length = endPosition - startPosition;
      if (length < 10) {
        return failure(`Fragment too short: ${length} bp. Minimum: 10 bp`);
      }

      if (length > 10000) {
        return failure(`Fragment too long: ${length} bp. Maximum: 10000 bp`);
      }

      return success(
        new OkazakiFragment(id, startPosition, endPosition, primer, isPrimerRemoved, isLigated),
      );
    } catch (error) {
      return failure(
        `Failed to create Okazaki fragment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Gets the length of this fragment in base pairs.
   */
  getLength(): number {
    return this.endPosition - this.startPosition;
  }

  /**
   * Checks if this fragment is completely processed.
   * A fragment is complete when its primer is removed and it's ligated.
   */
  isComplete(): boolean {
    return this.isPrimerRemoved && this.isLigated;
  }

  /**
   * Checks if this fragment needs processing.
   */
  needsProcessing(): boolean {
    return !this.isPrimerRemoved || !this.isLigated;
  }

  /**
   * Sets the DNA sequence for this fragment.
   *
   * @param sequence - DNA sequence
   * @throws Error if sequence length doesn't match fragment length
   */
  setSequence(sequence: string): void {
    if (sequence.length !== this.getLength()) {
      throw new Error(
        `Sequence length (${sequence.length}) doesn't match fragment length (${this.getLength()})`,
      );
    }
    this._sequence = new DNA(sequence);
  }

  /**
   * Gets the DNA sequence of this fragment (if set).
   */
  getSequence(): string | undefined {
    return this._sequence?.getSequence();
  }

  /**
   * Gets the DNA object for this fragment (if sequence is set).
   */
  getDNA(): DNA | undefined {
    return this._sequence;
  }

  /**
   * Marks the primer as removed.
   * This simulates 5' to 3' exonuclease activity.
   */
  removePrimer(): void {
    (this as { isPrimerRemoved: boolean }).isPrimerRemoved = true;
    this.primer.markAsRemoved();
  }

  /**
   * Marks this fragment as ligated to the previous fragment.
   * This simulates DNA ligase activity.
   */
  ligate(): void {
    (this as { isLigated: boolean }).isLigated = true;
  }

  /**
   * Checks if this fragment overlaps with another fragment.
   *
   * @param other - Other fragment to check
   * @returns True if fragments overlap
   */
  overlapsWith(other: OkazakiFragment): boolean {
    return !(this.endPosition <= other.startPosition || other.endPosition <= this.startPosition);
  }

  /**
   * Checks if this fragment is adjacent to another fragment.
   *
   * @param other - Other fragment to check
   * @returns True if fragments are adjacent (this fragment comes before other)
   */
  isAdjacentTo(other: OkazakiFragment): boolean {
    return this.endPosition === other.startPosition;
  }

  /**
   * Gets the processing status of this fragment.
   */
  getProcessingStatus(): {
    primerRemoved: boolean;
    ligated: boolean;
    complete: boolean;
    nextStep: string | null;
  } {
    let nextStep: string | null = null;

    if (!this.isPrimerRemoved) {
      nextStep = 'remove_primer';
    } else if (!this.isLigated) {
      nextStep = 'ligate';
    }

    return {
      primerRemoved: this.isPrimerRemoved,
      ligated: this.isLigated,
      complete: this.isComplete(),
      nextStep,
    };
  }

  /**
   * Validates fragment against organism-specific constraints.
   *
   * @param organism - Organism profile to validate against
   * @returns Validation result
   */
  validateForOrganism(organism: OrganismProfile): ValidationResult<boolean> {
    const length = this.getLength();
    const [minSize, maxSize] = organism.fragmentSize;

    if (length < minSize || length > maxSize) {
      return failure(
        `Fragment length (${length}) outside expected range for ${organism.type}: ${minSize}-${maxSize} bp`,
      );
    }

    return success(true);
  }

  /**
   * Generates a random Okazaki fragment for the given organism.
   *
   * @param id - Fragment identifier
   * @param startPosition - Starting position
   * @param organism - Organism profile for size constraints
   * @returns ValidationResult containing random OkazakiFragment
   */
  static generateRandom(
    id: string,
    startPosition: number,
    organism: OrganismProfile,
  ): ValidationResult<OkazakiFragment> {
    try {
      // Generate random fragment size within organism constraints
      const [minSize, maxSize] = organism.fragmentSize;
      const fragmentSize = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
      const endPosition = startPosition + fragmentSize;

      // Generate random primer
      const [minPrimerLen, maxPrimerLen] = organism.primerLength;
      const primerLength =
        Math.floor(Math.random() * (maxPrimerLen - minPrimerLen + 1)) + minPrimerLen;

      const primerResult = RNAPrimer.generateRandom(primerLength, startPosition);
      if (!primerResult.success) {
        return failure(`Failed to generate primer: ${primerResult.error}`);
      }

      return OkazakiFragment.create(id, startPosition, endPosition, primerResult.data);
    } catch (error) {
      return failure(
        `Failed to generate random fragment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Returns a string representation of this fragment.
   */
  toString(): string {
    const status = this.isComplete() ? 'complete' : 'processing';
    return `OkazakiFragment(${this.id}, ${this.startPosition}-${this.endPosition}, ${this.getLength()}bp, ${status})`;
  }

  /**
   * Private method to validate positions.
   */
  private validatePositions(): void {
    if (this.startPosition < 0) {
      throw new Error(`Start position must be non-negative. Provided: ${this.startPosition}`);
    }

    if (this.endPosition <= this.startPosition) {
      throw new Error(
        `End position (${this.endPosition}) must be greater than start position (${this.startPosition})`,
      );
    }
  }

  /**
   * Private method to validate fragment size.
   */
  private validateSize(): void {
    const length = this.getLength();

    // Minimum reasonable size
    if (length < 10) {
      throw new Error(`Fragment too short: ${length} bp. Minimum: 10 bp`);
    }

    // Maximum reasonable size (even larger than typical eukaryotic introns)
    if (length > 10000) {
      throw new Error(`Fragment too long: ${length} bp. Maximum: 10000 bp`);
    }
  }
}
