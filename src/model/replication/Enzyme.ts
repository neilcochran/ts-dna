/**
 * DNA Replication Enzyme Classes
 *
 * Represents the various enzymes involved in DNA replication,
 * including their positions, activities, and coordination within
 * the replisome complex.
 */

import { EnzymeType, OrganismProfile, ReplicationEvent } from '../../types/replication-types.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';

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

/**
 * DNA Helicase - Unwinds the DNA double helix ahead of the replication fork.
 */
export class Helicase extends Enzyme {
  constructor(position: number, isActive: boolean = true) {
    super(position, EnzymeType.HELICASE, isActive);
  }

  getSpeed(organism: OrganismProfile): number {
    // Helicase typically moves at same speed as polymerase
    return organism.polymeraseSpeed;
  }

  canOperate(position: number): boolean {
    // Helicase can operate anywhere there's double-stranded DNA
    return position >= 0;
  }

  /**
   * Unwinds DNA at the current position.
   *
   * @param basePairs - Number of base pairs to unwind
   * @returns Replication event for unwinding
   */
  unwind(basePairs: number): ReplicationEvent {
    const initialPosition = this.position;
    this.advance(basePairs);

    return {
      type: 'unwind',
      position: initialPosition,
      enzyme: this.type,
      strand: 'leading', // Helicase affects both strands
      basePairsAdded: basePairs,
      metadata: {
        endPosition: this.position,
      },
    };
  }
}

/**
 * DNA Primase - Synthesizes RNA primers for DNA polymerase initiation.
 */
export class Primase extends Enzyme {
  constructor(position: number, isActive: boolean = true) {
    super(position, EnzymeType.PRIMASE, isActive);
  }

  getSpeed(organism: OrganismProfile): number {
    // Primase is typically slower than polymerase
    return organism.polymeraseSpeed * 0.1; // 10% of polymerase speed
  }

  canOperate(position: number): boolean {
    // Primase needs single-stranded DNA template
    return position >= 0;
  }

  /**
   * Synthesizes an RNA primer.
   *
   * @param primerLength - Length of primer to synthesize
   * @param strand - Which strand the primer is for
   * @returns Replication event for primer synthesis
   */
  synthesizePrimer(primerLength: number, strand: 'leading' | 'lagging'): ReplicationEvent {
    if (primerLength < 3 || primerLength > 10) {
      throw new Error(`Invalid primer length: ${primerLength}. Must be 3-10 nucleotides`);
    }

    return {
      type: 'primer_synthesis',
      position: this.position,
      enzyme: this.type,
      strand,
      basePairsAdded: primerLength,
      metadata: {
        primerLength,
      },
    };
  }
}

/**
 * DNA Polymerase - Synthesizes DNA by adding nucleotides to growing strand.
 */
export class DNAPolymerase extends Enzyme {
  /**
   * Creates a DNA polymerase.
   *
   * @param position - Starting position
   * @param variant - Polymerase variant (affects speed and function)
   * @param isActive - Whether enzyme is active
   */
  constructor(
    position: number,
    public readonly variant: 'PolI' | 'PolII' | 'PolIII' = 'PolIII',
    isActive: boolean = true,
  ) {
    super(position, EnzymeType.POLYMERASE, isActive);
  }

  getSpeed(organism: OrganismProfile): number {
    // Different polymerases have different speeds
    switch (this.variant) {
      case 'PolI':
        return organism.polymeraseSpeed * 0.05; // 5% for primer removal/repair
      case 'PolII':
        return organism.polymeraseSpeed * 0.04; // 4% for repair
      case 'PolIII':
        return organism.polymeraseSpeed; // Full speed for main replication
    }
  }

  canOperate(position: number): boolean {
    // Polymerase needs a primer with 3'-OH group
    return position >= 0;
  }

  /**
   * Synthesizes DNA at the current position.
   *
   * @param basePairs - Number of base pairs to synthesize
   * @param strand - Which strand is being synthesized
   * @returns Replication event for DNA synthesis
   */
  synthesize(basePairs: number, strand: 'leading' | 'lagging'): ReplicationEvent {
    if (basePairs <= 0) {
      throw new Error(`Invalid synthesis length: ${basePairs}`);
    }

    const initialPosition = this.position;
    this.advance(basePairs);

    return {
      type: 'dna_synthesis',
      position: initialPosition,
      enzyme: this.type,
      strand,
      basePairsAdded: basePairs,
      metadata: {
        polymeraseVariant: this.variant,
        endPosition: this.position,
      },
    };
  }

  /**
   * Performs proofreading (3' to 5' exonuclease activity).
   *
   * @param strand - Strand being proofread
   * @returns Replication event for proofreading
   */
  proofread(strand: 'leading' | 'lagging'): ReplicationEvent {
    return {
      type: 'proofreading',
      position: this.position,
      enzyme: this.type,
      strand,
      metadata: {
        polymeraseVariant: this.variant,
      },
    };
  }
}

/**
 * DNA Ligase - Joins Okazaki fragments by forming phosphodiester bonds.
 */
export class DNALigase extends Enzyme {
  constructor(position: number, isActive: boolean = true) {
    super(position, EnzymeType.LIGASE, isActive);
  }

  getSpeed(organism: OrganismProfile): number {
    // Ligase is typically fast but works on discrete fragments
    return organism.polymeraseSpeed * 2; // Fast ligation
  }

  canOperate(position: number): boolean {
    // Ligase needs adjacent DNA fragments with 3'-OH and 5'-phosphate
    return position >= 0;
  }

  /**
   * Ligates two adjacent DNA fragments.
   *
   * @param fragmentId - ID of fragment being ligated
   * @returns Replication event for ligation
   */
  ligate(fragmentId: string): ReplicationEvent {
    return {
      type: 'ligation',
      position: this.position,
      enzyme: this.type,
      strand: 'lagging', // Ligation primarily occurs on lagging strand
      fragmentId,
      metadata: {
        ligationSite: this.position,
      },
    };
  }
}

/**
 * 5' to 3' Exonuclease - Removes RNA primers from Okazaki fragments.
 */
export class Exonuclease extends Enzyme {
  constructor(position: number, isActive: boolean = true) {
    super(position, EnzymeType.EXONUCLEASE, isActive);
  }

  getSpeed(organism: OrganismProfile): number {
    // Exonuclease activity is typically part of Pol I
    return organism.polymeraseSpeed * 0.1; // Similar to primase
  }

  canOperate(position: number): boolean {
    // Exonuclease needs RNA-DNA junction
    return position >= 0;
  }

  /**
   * Removes an RNA primer.
   *
   * @param primerLength - Length of primer being removed
   * @param fragmentId - ID of fragment the primer belongs to
   * @returns Replication event for primer removal
   */
  removePrimer(primerLength: number, fragmentId: string): ReplicationEvent {
    return {
      type: 'primer_removal',
      position: this.position,
      enzyme: this.type,
      strand: 'lagging', // Primer removal primarily on lagging strand
      fragmentId,
      basePairsAdded: -primerLength, // Negative because nucleotides are removed
      metadata: {
        primerLength,
        removalSite: this.position,
      },
    };
  }
}

/**
 * Factory class for creating enzymes with validation.
 */
export class EnzymeFactory {
  /**
   * Creates a helicase with validation.
   */
  static createHelicase(position: number): ValidationResult<Helicase> {
    try {
      return success(new Helicase(position));
    } catch (error) {
      return failure(
        `Failed to create helicase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates a primase with validation.
   */
  static createPrimase(position: number): ValidationResult<Primase> {
    try {
      return success(new Primase(position));
    } catch (error) {
      return failure(
        `Failed to create primase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates a DNA polymerase with validation.
   */
  static createPolymerase(
    position: number,
    variant: 'PolI' | 'PolII' | 'PolIII' = 'PolIII',
  ): ValidationResult<DNAPolymerase> {
    try {
      return success(new DNAPolymerase(position, variant));
    } catch (error) {
      return failure(
        `Failed to create polymerase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates a DNA ligase with validation.
   */
  static createLigase(position: number): ValidationResult<DNALigase> {
    try {
      return success(new DNALigase(position));
    } catch (error) {
      return failure(
        `Failed to create ligase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates an exonuclease with validation.
   */
  static createExonuclease(position: number): ValidationResult<Exonuclease> {
    try {
      return success(new Exonuclease(position));
    } catch (error) {
      return failure(
        `Failed to create exonuclease: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
