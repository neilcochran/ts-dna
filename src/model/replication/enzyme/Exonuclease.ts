/**
 * 5' to 3' Exonuclease - Removes RNA primers from Okazaki fragments.
 *
 * Exonuclease removes RNA primers from the 5' end of Okazaki fragments,
 * preparing them for ligation by DNA ligase.
 */

import { EnzymeType, OrganismProfile, ReplicationEvent } from '../../../types/replication-types.js';
import { Enzyme } from './Enzyme.js';

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
