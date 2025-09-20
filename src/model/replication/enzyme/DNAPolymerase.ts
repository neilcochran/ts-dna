/**
 * DNA Polymerase - Synthesizes DNA by adding nucleotides to growing strand.
 *
 * DNA polymerase is the key enzyme responsible for DNA synthesis,
 * adding nucleotides in the 5' to 3' direction using a template strand.
 */

import { EnzymeType, OrganismProfile, ReplicationEvent } from '../../../types/replication-types.js';
import { Enzyme } from './Enzyme.js';
import {
  DNA_POL_I_SPEED_FACTOR,
  DNA_POL_II_SPEED_FACTOR,
  DNA_POL_III_SPEED_FACTOR,
} from '../../../constants/biological-constants.js';

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
        return organism.polymeraseSpeed * DNA_POL_I_SPEED_FACTOR; // 5% for primer removal/repair
      case 'PolII':
        return organism.polymeraseSpeed * DNA_POL_II_SPEED_FACTOR; // 4% for repair
      case 'PolIII':
        return organism.polymeraseSpeed * DNA_POL_III_SPEED_FACTOR; // Full speed for main replication
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
