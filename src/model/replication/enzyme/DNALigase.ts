/**
 * DNA Ligase - Joins Okazaki fragments by forming phosphodiester bonds.
 *
 * DNA ligase seals the gaps between Okazaki fragments on the lagging strand
 * by forming phosphodiester bonds between adjacent nucleotides.
 */

import { EnzymeType, OrganismProfile, ReplicationEvent } from '../../../types/replication-types.js';
import { Enzyme } from './Enzyme.js';

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
