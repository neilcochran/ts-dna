/**
 * DNA Helicase - Unwinds the DNA double helix ahead of the replication fork.
 *
 * Helicase is responsible for separating the two strands of DNA to create
 * the replication fork, allowing other enzymes access to the template strands.
 */

import { EnzymeType, OrganismProfile, ReplicationEvent } from '../../../types/replication-types.js';
import { Enzyme } from './Enzyme.js';

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
