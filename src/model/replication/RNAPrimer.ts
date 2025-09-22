/**
 * RNA Primer Class
 *
 * Represents an RNA primer used to initiate DNA synthesis during replication.
 * RNA primers are short sequences (3-10 nucleotides) synthesized by primase
 * that provide the essential 3'-OH group required by DNA polymerase.
 */

import { RNA } from '../nucleic-acids/RNA.js';
import { validateNucleicAcid, unwrap } from '../../utils/validation.js';
import { NucleicAcidType } from '../../enums/nucleic-acid-type.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';
import {
  MIN_RNA_PRIMER_LENGTH,
  MAX_RNA_PRIMER_LENGTH,
} from '../../constants/biological-constants.js';

/**
 * RNA primer class for DNA replication initiation.
 *
 * Biological constraints:
 * - Length must be 3-10 nucleotides (based on biological research)
 * - Must be valid RNA sequence (A, U, G, C only)
 * - Provides 3'-OH group for DNA polymerase initiation
 */
export class RNAPrimer {
  private readonly rna: RNA;

  /**
   * Creates a new RNA primer.
   *
   * @param sequence - RNA sequence (3-10 nucleotides)
   * @param position - Position where primer is attached (0-based)
   * @param isRemoved - Whether this primer has been removed (default: false)
   * @throws InvalidSequenceError if sequence is invalid
   * @throws Error if sequence length is outside biological range
   */
  constructor(
    public readonly sequence: string,
    public readonly position: number,
    public isRemoved: boolean = false,
  ) {
    // Validate sequence length based on biological constraints
    if (sequence.length < MIN_RNA_PRIMER_LENGTH || sequence.length > MAX_RNA_PRIMER_LENGTH) {
      throw new Error(
        `RNA primers must be ${MIN_RNA_PRIMER_LENGTH}-${MAX_RNA_PRIMER_LENGTH} nucleotides long. Provided: ${sequence.length} nucleotides`,
      );
    }

    // Validate RNA sequence
    this.rna = new RNA(sequence);
  }

  /**
   * Creates an RNA primer with validation.
   *
   * @param sequence - RNA sequence to validate
   * @param position - Position for the primer
   * @param isRemoved - Whether primer is removed
   * @returns ValidationResult containing RNAPrimer or error
   */
  static create(
    sequence: string,
    position: number,
    isRemoved: boolean = false,
  ): ValidationResult<RNAPrimer> {
    try {
      // Validate length
      if (sequence.length < MIN_RNA_PRIMER_LENGTH || sequence.length > MAX_RNA_PRIMER_LENGTH) {
        return failure(
          `RNA primers must be ${MIN_RNA_PRIMER_LENGTH}-${MAX_RNA_PRIMER_LENGTH} nucleotides long. Provided: ${sequence.length} nucleotides`,
        );
      }

      // Validate position
      if (position < 0) {
        return failure(`Primer position must be non-negative. Provided: ${position}`);
      }

      // Validate RNA sequence
      const rnaValidation = validateNucleicAcid(sequence, NucleicAcidType.RNA);
      if (!rnaValidation.success) {
        return failure(`Invalid RNA sequence: ${rnaValidation.error}`);
      }

      return success(new RNAPrimer(sequence, position, isRemoved));
    } catch (error) {
      return failure(
        `Failed to create RNA primer: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Gets the RNA sequence of this primer.
   */
  getSequence(): string {
    return this.rna.getSequence();
  }

  /**
   * Gets the length of this primer in nucleotides.
   */
  getLength(): number {
    return this.rna.getSequence().length;
  }

  /**
   * Gets the RNA object for this primer.
   */
  getRNA(): RNA {
    return this.rna;
  }

  /**
   * Marks this primer as removed.
   * This is typically done by 5' to 3' exonuclease activity.
   */
  markAsRemoved(): void {
    (this as { isRemoved: boolean }).isRemoved = true;
  }

  /**
   * Checks if this primer is within the biological length range.
   */
  isValidLength(): boolean {
    const length = this.getLength();
    return length >= 3 && length <= 10;
  }

  /**
   * Generates a random RNA primer of the specified length.
   *
   * @param length - Length of primer (3-10 nucleotides)
   * @param position - Position for the primer
   * @returns ValidationResult containing random RNAPrimer
   */
  static generateRandom(length: number, position: number): ValidationResult<RNAPrimer> {
    if (length < 3 || length > 10) {
      return failure(`Primer length must be 3-10 nucleotides. Provided: ${length}`);
    }

    const nucleotides = ['A', 'U', 'G', 'C'];
    let sequence = '';

    for (let i = 0; i < length; i++) {
      sequence += nucleotides[Math.floor(Math.random() * nucleotides.length)];
    }

    return RNAPrimer.create(sequence, position);
  }

  /**
   * Creates a copy of this primer at a new position.
   *
   * @param newPosition - New position for the copied primer
   * @returns New RNAPrimer instance
   */
  copyToPosition(newPosition: number): RNAPrimer {
    return new RNAPrimer(this.getSequence(), newPosition, this.isRemoved);
  }

  /**
   * Returns a string representation of this primer.
   */
  toString(): string {
    const status = this.isRemoved ? 'removed' : 'active';
    return `RNAPrimer(${this.getSequence()}, pos: ${this.position}, ${status})`;
  }

  /**
   * Checks equality with another RNAPrimer.
   *
   * @param other - Other primer to compare
   * @returns True if primers are equivalent
   */
  equals(other: RNAPrimer): boolean {
    return (
      this.getSequence() === other.getSequence() &&
      this.position === other.position &&
      this.isRemoved === other.isRemoved
    );
  }
}
