/**
 * DNA Primase - Synthesizes RNA primers for DNA polymerase initiation.
 *
 * Primase creates short RNA primers that provide the 3'-OH group
 * required by DNA polymerase to begin synthesis.
 */

import { EnzymeType, OrganismProfile, ReplicationEvent } from '../../../types/replication-types.js';
import { Enzyme } from './Enzyme.js';

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
