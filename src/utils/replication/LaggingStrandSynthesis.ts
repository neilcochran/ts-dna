/**
 * Lagging Strand Synthesis
 *
 * Manages discontinuous DNA synthesis on the lagging strand during replication.
 * The lagging strand is synthesized discontinuously as Okazaki fragments
 * in the 5' to 3' direction, but away from the replication fork movement.
 */

import { DNAPolymerase } from '../../model/replication/enzyme/DNAPolymerase.js';
import { Primase } from '../../model/replication/enzyme/Primase.js';
import { DNALigase } from '../../model/replication/enzyme/DNALigase.js';
import { Exonuclease } from '../../model/replication/enzyme/Exonuclease.js';
import { OkazakiFragment } from '../../model/replication/OkazakiFragment.js';
import { RNAPrimer } from '../../model/replication/RNAPrimer.js';
import { OrganismProfile, ReplicationEvent } from '../../types/replication-types.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';
import { DNA_PROOFREADING_THRESHOLD } from '../../constants/biological-constants.js';

/**
 * Manages discontinuous synthesis of the lagging strand during DNA replication.
 */
export class LaggingStrandSynthesis {
  private readonly primase: Primase;
  private readonly polymerase: DNAPolymerase;
  private readonly ligase: DNALigase;
  private readonly exonuclease: Exonuclease;
  private readonly fragments: OkazakiFragment[] = [];
  private currentFragment?: OkazakiFragment;
  private totalSynthesizedLength: number = 0;
  private isActive: boolean = false;

  /**
   * Creates a new lagging strand synthesis manager.
   *
   * @param organism - Organism profile for biological parameters
   * @param startPosition - Starting position for synthesis
   */
  constructor(
    private readonly organism: OrganismProfile,
    startPosition: number = 0,
  ) {
    this.primase = new Primase(startPosition);
    this.polymerase = new DNAPolymerase(startPosition, 'PolIII');
    this.ligase = new DNALigase(startPosition);
    this.exonuclease = new Exonuclease(startPosition);
  }

  /**
   * Initiates lagging strand synthesis by starting the first Okazaki fragment.
   *
   * @param forkPosition - Current position of the replication fork
   * @returns Validation result with success/failure
   */
  initiateSynthesis(forkPosition: number): ValidationResult<ReplicationEvent[]> {
    if (forkPosition < 0) {
      return failure(`Invalid fork position: ${forkPosition}. Must be non-negative`);
    }

    this.isActive = true;
    const events: ReplicationEvent[] = [];

    // Start first Okazaki fragment
    const fragmentResult = this.initiateFragment(forkPosition);
    if (fragmentResult.success) {
      events.push(...fragmentResult.data);
    } else {
      return failure(`Failed to initiate first fragment: ${fragmentResult.error}`);
    }

    return success(events);
  }

  /**
   * Advances lagging strand synthesis by progressing current fragment
   * and potentially starting new fragments.
   *
   * @param forkPosition - Current position of the replication fork
   * @param basePairs - Number of base pairs the fork has advanced
   * @returns Array of replication events generated
   */
  advance(forkPosition: number, basePairs: number): ReplicationEvent[] {
    if (!this.isActive || basePairs <= 0) {
      return [];
    }

    const events: ReplicationEvent[] = [];

    // Process current fragment
    if (this.currentFragment) {
      const fragmentEvents = this.continueFragmentSynthesis(basePairs);
      events.push(...fragmentEvents);

      // Check if current fragment is complete
      if (this.isFragmentComplete(this.currentFragment, forkPosition)) {
        const processingEvents = this.processCompletedFragment(this.currentFragment);
        events.push(...processingEvents);
        this.currentFragment = undefined;
      }
    }

    // Start new fragment if needed
    if (this.shouldStartNewFragment(forkPosition)) {
      const newFragmentResult = this.initiateFragment(forkPosition);
      if (newFragmentResult.success) {
        events.push(...newFragmentResult.data);
      }
    }

    return events;
  }

  /**
   * Initiates a new Okazaki fragment with primer synthesis.
   *
   * @param position - Position where the fragment should start
   * @returns Validation result with replication events
   */
  private initiateFragment(position: number): ValidationResult<ReplicationEvent[]> {
    const events: ReplicationEvent[] = [];

    try {
      // Generate primer
      const primer = this.synthesizePrimer(position);
      const primerEvent = this.primase.synthesizePrimer(primer.getSequence().length, 'lagging');
      events.push(primerEvent);

      // Calculate fragment size based on organism
      const fragmentSize = this.getFragmentSize();

      // Create new Okazaki fragment
      const fragmentId = this.generateFragmentId();
      const fragment = new OkazakiFragment(fragmentId, position, position + fragmentSize, primer);

      this.fragments.push(fragment);
      this.currentFragment = fragment;

      return success(events);
    } catch (error) {
      return failure(
        `Failed to initiate fragment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Continues synthesis of the current Okazaki fragment.
   *
   * @param basePairs - Number of base pairs to synthesize
   * @returns Array of replication events
   */
  private continueFragmentSynthesis(basePairs: number): ReplicationEvent[] {
    if (!this.currentFragment) {
      return [];
    }

    const events: ReplicationEvent[] = [];
    const synthesisEvent = this.polymerase.synthesize(basePairs, 'lagging');
    events.push(synthesisEvent);

    this.totalSynthesizedLength += basePairs;

    // Add proofreading if significant synthesis occurred
    if (basePairs >= DNA_PROOFREADING_THRESHOLD) {
      const proofreadEvent = this.polymerase.proofread('lagging');
      events.push(proofreadEvent);
    }

    return events;
  }

  /**
   * Processes a completed Okazaki fragment (primer removal and ligation).
   *
   * @param fragment - The completed fragment to process
   * @returns Array of replication events
   */
  private processCompletedFragment(fragment: OkazakiFragment): ReplicationEvent[] {
    const events: ReplicationEvent[] = [];

    // Remove primer
    const primerLength = fragment.primer.getSequence().length;
    const removalEvent = this.exonuclease.removePrimer(primerLength, fragment.id);
    events.push(removalEvent);
    fragment.removePrimer();

    // Ligate fragment
    const ligationEvent = this.ligase.ligate(fragment.id);
    events.push(ligationEvent);
    fragment.ligate();

    return events;
  }

  /**
   * Checks if the current fragment is complete based on fork position.
   *
   * @param fragment - Fragment to check
   * @param forkPosition - Current fork position
   * @returns True if fragment is complete
   */
  private isFragmentComplete(fragment: OkazakiFragment, forkPosition: number): boolean {
    // Fragment is complete when fork has moved past its end position
    return forkPosition >= fragment.endPosition;
  }

  /**
   * Determines if a new Okazaki fragment should be started.
   *
   * @param forkPosition - Current fork position
   * @returns True if new fragment should be started
   */
  private shouldStartNewFragment(forkPosition: number): boolean {
    // Start new fragment if no current fragment or if fork has advanced enough
    if (!this.currentFragment) {
      return true;
    }

    // Start new fragment when fork is close to current fragment's end
    const distanceToEnd = this.currentFragment.endPosition - forkPosition;
    const fragmentGap = this.getFragmentSize() * 0.1; // 10% overlap prevention

    return distanceToEnd <= fragmentGap;
  }

  /**
   * Generates a random fragment size based on organism profile.
   *
   * @returns Fragment size in base pairs
   */
  private getFragmentSize(): number {
    const [min, max] = this.organism.fragmentSize;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Synthesizes an RNA primer of appropriate length for the organism.
   *
   * @param position - Position where primer will be placed
   * @returns RNA primer
   */
  private synthesizePrimer(position: number): RNAPrimer {
    const [minLen, maxLen] = this.organism.primerLength;
    const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;

    // Generate random RNA sequence of appropriate length
    const nucleotides = ['A', 'U', 'G', 'C'];
    const sequence = Array.from(
      { length },
      () => nucleotides[Math.floor(Math.random() * nucleotides.length)],
    ).join('');

    return new RNAPrimer(sequence, position);
  }

  /**
   * Generates a unique ID for a new Okazaki fragment.
   *
   * @returns Unique fragment ID
   */
  private generateFragmentId(): string {
    return `okazaki_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets all completed Okazaki fragments.
   *
   * @returns Array of completed fragments
   */
  getCompletedFragments(): OkazakiFragment[] {
    return this.fragments.filter(fragment => fragment.isComplete());
  }

  /**
   * Gets all active (incomplete) fragments.
   *
   * @returns Array of active fragments
   */
  getActiveFragments(): OkazakiFragment[] {
    return this.fragments.filter(fragment => !fragment.isComplete());
  }

  /**
   * Gets the total length of DNA synthesized on the lagging strand.
   *
   * @returns Total synthesized length in base pairs
   */
  getTotalSynthesizedLength(): number {
    return this.totalSynthesizedLength;
  }

  /**
   * Checks if synthesis is currently active.
   *
   * @returns True if synthesis is active
   */
  isSynthesizing(): boolean {
    return this.isActive;
  }

  /**
   * Stops lagging strand synthesis.
   */
  stopSynthesis(): void {
    this.isActive = false;
  }

  /**
   * Calculates synthesis progress based on total DNA length.
   *
   * @param totalLength - Total length of DNA being replicated
   * @returns Progress as percentage (0-100)
   */
  getProgress(totalLength: number): number {
    if (totalLength <= 0) {
      return 100;
    }
    return Math.min(100, (this.totalSynthesizedLength / totalLength) * 100);
  }

  /**
   * Creates a summary of current synthesis state.
   *
   * @returns Synthesis state summary
   */
  getState(): {
    totalFragments: number;
    completedFragments: number;
    activeFragments: number;
    totalSynthesizedLength: number;
    isActive: boolean;
    currentFragmentId?: string;
  } {
    return {
      totalFragments: this.fragments.length,
      completedFragments: this.getCompletedFragments().length,
      activeFragments: this.getActiveFragments().length,
      totalSynthesizedLength: this.totalSynthesizedLength,
      isActive: this.isActive,
      currentFragmentId: this.currentFragment?.id,
    };
  }
}
