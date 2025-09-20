/**
 * Replisome Class
 *
 * Represents the coordinated enzyme complex responsible for DNA replication.
 * The replisome coordinates helicase, primase, polymerases, ligase, and
 * exonuclease activities to ensure proper replication fork progression.
 */

import {
  Helicase,
  Primase,
  DNAPolymerase,
  DNALigase,
  Exonuclease,
  EnzymeFactory,
} from './enzyme/index.js';
import { ReplicationFork } from './ReplicationFork.js';
import { OkazakiFragment } from './OkazakiFragment.js';
import { RNAPrimer } from './RNAPrimer.js';
import {
  OrganismProfile,
  ReplicationEvent,
  ReplicationRuntimeState,
  EnzymePosition,
} from '../../types/replication-types.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';

/**
 * Configuration for replisome assembly.
 */
export interface ReplisomeConfig {
  /** Leading strand polymerase variant */
  leadingPolymerase?: 'PolI' | 'PolII' | 'PolIII';

  /** Lagging strand polymerase variant */
  laggingPolymerase?: 'PolI' | 'PolII' | 'PolIII';

  /** Enable proofreading activity */
  enableProofreading?: boolean;

  /** Enable detailed event logging */
  enableDetailedLogging?: boolean;
}

/**
 * The replisome - coordinated DNA replication machinery.
 */
export class Replisome {
  private helicase!: Helicase;
  private primase!: Primase;
  private leadingPolymerase!: DNAPolymerase;
  private laggingPolymerase!: DNAPolymerase;
  private ligase!: DNALigase;
  private exonuclease!: Exonuclease;

  private readonly activeFragments: Map<string, OkazakiFragment> = new Map();
  private readonly completedFragments: OkazakiFragment[] = [];
  private readonly eventLog: ReplicationEvent[] = [];

  private fragmentCounter = 0;

  /**
   * Creates a new replisome complex.
   *
   * @param fork - Replication fork this replisome is advancing
   * @param organism - Organism profile for biological parameters
   * @param config - Configuration options
   */
  constructor(
    private readonly fork: ReplicationFork,
    public readonly organism: OrganismProfile,
    private readonly config: ReplisomeConfig = {},
  ) {
    this.initializeEnzymes();
  }

  /**
   * Creates a replisome with validation.
   *
   * @param fork - Replication fork
   * @param organism - Organism profile
   * @param config - Configuration options
   * @returns ValidationResult containing Replisome or error
   */
  static create(
    fork: ReplicationFork,
    organism: OrganismProfile,
    config: ReplisomeConfig = {},
  ): ValidationResult<Replisome> {
    try {
      return success(new Replisome(fork, organism, config));
    } catch (error) {
      return failure(
        `Failed to create replisome: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Advances the replication fork by the specified number of base pairs.
   * Coordinates all enzyme activities.
   *
   * @param basePairs - Number of base pairs to advance
   * @returns Array of replication events that occurred
   */
  advanceFork(basePairs: number): ReplicationEvent[] {
    const events: ReplicationEvent[] = [];

    if (!this.fork.canAdvance() || basePairs <= 0) {
      return events;
    }

    const actualAdvancement = this.fork.safeAdvance(basePairs);

    // 1. Helicase unwinds DNA ahead of the fork
    events.push(this.helicaseUnwind(actualAdvancement));

    // 2. Leading strand synthesis (continuous)
    events.push(...this.synthesizeLeadingStrand(actualAdvancement));

    // 3. Lagging strand synthesis (discontinuous)
    events.push(...this.synthesizeLaggingStrand(actualAdvancement));

    // 4. Process completed fragments
    events.push(...this.processCompletedFragments());

    // Log events if detailed logging is enabled
    if (this.config.enableDetailedLogging) {
      this.eventLog.push(...events);
    }

    return events;
  }

  /**
   * Gets the current state of replication.
   */
  getCurrentState(): ReplicationRuntimeState {
    return {
      forkPosition: this.fork.position,
      completionPercentage: this.fork.getCompletionPercentage(),
      leadingStrandProgress: this.fork.position, // Leading strand keeps up with fork
      laggingStrandProgress: this.getlaggingStrandProgress(),
      activeFragments: Array.from(this.activeFragments.values()),
      activeEnzymes: this.getEnzymePositions(),
    };
  }

  /**
   * Checks if replication is complete.
   */
  isComplete(): boolean {
    return this.fork.isComplete() && this.activeFragments.size === 0;
  }

  /**
   * Gets all completed Okazaki fragments.
   */
  getCompletedFragments(): OkazakiFragment[] {
    return [...this.completedFragments];
  }

  /**
   * Gets all replication events (if logging enabled).
   */
  getEventLog(): ReplicationEvent[] {
    return [...this.eventLog];
  }

  /**
   * Gets statistics about the replication process.
   */
  getStatistics(): {
    position: number;
    totalLength: number;
    completionPercentage: number;
    remainingDistance: number;
    estimatedTimeRemaining: number;
    expectedFragmentsRemaining: number;
    organismType: string;
    speed: number;
    activeFragments: number;
    completedFragments: number;
    averageFragmentSize: number;
    totalFragmentsSynthesized: number;
    eventsGenerated: number;
    laggingStrandProgress: number;
  } {
    const fragmentStats = this.calculateFragmentStatistics();

    const result = {
      ...this.fork.getStatistics(),
      activeFragments: this.activeFragments.size,
      completedFragments: this.completedFragments.length,
      averageFragmentSize: fragmentStats.averageSize,
      totalFragmentsSynthesized: fragmentStats.total,
      eventsGenerated: this.eventLog.length,
      laggingStrandProgress: this.getlaggingStrandProgress(),
    };

    return result;
  }

  /**
   * Private: Initialize all enzymes in the replisome.
   */
  private initializeEnzymes(): void {
    const startPosition = this.fork.position;

    // Create enzymes with error handling
    const helicaseResult = EnzymeFactory.createHelicase(startPosition);
    const primaseResult = EnzymeFactory.createPrimase(startPosition);
    const leadingPolResult = EnzymeFactory.createPolymerase(
      startPosition,
      this.config.leadingPolymerase ?? 'PolIII',
    );
    const laggingPolResult = EnzymeFactory.createPolymerase(
      startPosition,
      this.config.laggingPolymerase ?? 'PolIII',
    );
    const ligaseResult = EnzymeFactory.createLigase(startPosition);
    const exonucleaseResult = EnzymeFactory.createExonuclease(startPosition);

    // Check for enzyme creation failures
    if (!helicaseResult.success) {
      throw new Error(helicaseResult.error);
    }
    if (!primaseResult.success) {
      throw new Error(primaseResult.error);
    }
    if (!leadingPolResult.success) {
      throw new Error(leadingPolResult.error);
    }
    if (!laggingPolResult.success) {
      throw new Error(laggingPolResult.error);
    }
    if (!ligaseResult.success) {
      throw new Error(ligaseResult.error);
    }
    if (!exonucleaseResult.success) {
      throw new Error(exonucleaseResult.error);
    }

    this.helicase = helicaseResult.data;
    this.primase = primaseResult.data;
    this.leadingPolymerase = leadingPolResult.data;
    this.laggingPolymerase = laggingPolResult.data;
    this.ligase = ligaseResult.data;
    this.exonuclease = exonucleaseResult.data;
  }

  /**
   * Private: Helicase unwinds DNA.
   */
  private helicaseUnwind(basePairs: number): ReplicationEvent {
    const initialPosition = this.helicase.position;
    this.helicase.moveTo(this.fork.position);

    return {
      type: 'unwind',
      position: initialPosition,
      enzyme: this.helicase.type,
      strand: 'leading', // Helicase affects both strands
      basePairsAdded: basePairs,
    };
  }

  /**
   * Private: Synthesize leading strand (continuous).
   */
  private synthesizeLeadingStrand(basePairs: number): ReplicationEvent[] {
    this.leadingPolymerase.moveTo(this.fork.position - basePairs);
    const synthesisEvent = this.leadingPolymerase.synthesize(basePairs, 'leading');

    const events = [synthesisEvent];

    // Add proofreading if enabled
    if (this.config.enableProofreading) {
      events.push(this.leadingPolymerase.proofread('leading'));
    }

    return events;
  }

  /**
   * Private: Synthesize lagging strand (discontinuous).
   */
  private synthesizeLaggingStrand(basePairs: number): ReplicationEvent[] {
    const events: ReplicationEvent[] = [];

    // Check if we need to start a new Okazaki fragment
    if (this.shouldStartNewFragment()) {
      events.push(...this.initiateNewFragment());
    }

    // Continue synthesis on active fragments
    for (const fragment of this.activeFragments.values()) {
      if (this.canContinueFragment(fragment)) {
        events.push(...this.continueFragmentSynthesis(fragment, basePairs));
      }
    }

    return events;
  }

  /**
   * Private: Check if a new Okazaki fragment should be started.
   */
  private shouldStartNewFragment(): boolean {
    // Start new fragment if no active fragments or if fork has progressed enough
    if (this.activeFragments.size === 0) {
      return true;
    }

    // Find the fragment with the highest end position (most recent)
    const fragments = Array.from(this.activeFragments.values());
    const lastFragment = fragments.reduce((latest, current) =>
      current.endPosition > latest.endPosition ? current : latest,
    );

    const expectedSize = this.fork.getExpectedFragmentSize();
    const distanceFromLast = this.fork.position - lastFragment.endPosition;

    return distanceFromLast >= expectedSize * 0.8; // Start when 80% through expected size
  }

  /**
   * Private: Initiate a new Okazaki fragment.
   */
  private initiateNewFragment(): ReplicationEvent[] {
    const events: ReplicationEvent[] = [];
    const fragmentId = `okazaki_${++this.fragmentCounter}`;
    const startPos = this.fork.position;
    const fragmentSize = this.fork.getExpectedFragmentSize();
    const primerLength = this.fork.getExpectedPrimerLength();

    // Primase synthesizes primer
    const primerEvent = this.primase.synthesizePrimer(primerLength, 'lagging');
    primerEvent.fragmentId = fragmentId;
    events.push(primerEvent);

    // Create RNA primer
    const primerResult = RNAPrimer.generateRandom(primerLength, startPos);
    if (!primerResult.success) {
      throw new Error(`Failed to create primer: ${primerResult.error}`);
    }

    // Create Okazaki fragment
    const fragmentResult = OkazakiFragment.create(
      fragmentId,
      startPos,
      startPos + fragmentSize,
      primerResult.data,
    );

    if (!fragmentResult.success) {
      throw new Error(`Failed to create fragment: ${fragmentResult.error}`);
    }

    this.activeFragments.set(fragmentId, fragmentResult.data);

    return events;
  }

  /**
   * Private: Check if fragment synthesis can continue.
   */
  private canContinueFragment(fragment: OkazakiFragment): boolean {
    return !fragment.isComplete() && fragment.endPosition > this.fork.position;
  }

  /**
   * Private: Continue synthesis on existing fragment.
   */
  private continueFragmentSynthesis(
    fragment: OkazakiFragment,
    maxBasePairs: number,
  ): ReplicationEvent[] {
    const events: ReplicationEvent[] = [];
    const remainingBP = fragment.endPosition - this.fork.position;
    const synthesizeBP = Math.min(maxBasePairs, remainingBP);

    if (synthesizeBP > 0) {
      const synthesisEvent = this.laggingPolymerase.synthesize(synthesizeBP, 'lagging');
      synthesisEvent.fragmentId = fragment.id;
      events.push(synthesisEvent);

      if (this.config.enableProofreading) {
        const proofreadEvent = this.laggingPolymerase.proofread('lagging');
        proofreadEvent.fragmentId = fragment.id;
        events.push(proofreadEvent);
      }
    }

    return events;
  }

  /**
   * Private: Process completed Okazaki fragments.
   */
  private processCompletedFragments(): ReplicationEvent[] {
    const events: ReplicationEvent[] = [];
    const completedIds: string[] = [];

    for (const [id, fragment] of this.activeFragments.entries()) {
      // Process fragments that have reached the fork position OR when fork is complete
      const shouldProcess =
        (fragment.endPosition <= this.fork.position || this.fork.isComplete()) &&
        !fragment.isComplete();

      if (shouldProcess) {
        // Remove primer
        if (!fragment.isPrimerRemoved) {
          const primerRemovalEvent = this.exonuclease.removePrimer(
            fragment.primer.getLength(),
            fragment.id,
          );
          events.push(primerRemovalEvent);
          fragment.removePrimer();
        }

        // Ligate fragment
        if (!fragment.isLigated) {
          const ligationEvent = this.ligase.ligate(fragment.id);
          events.push(ligationEvent);
          fragment.ligate();
        }

        if (fragment.isComplete()) {
          completedIds.push(id);
        }
      }
    }

    // Move completed fragments
    for (const id of completedIds) {
      const fragment = this.activeFragments.get(id);
      if (fragment) {
        this.completedFragments.push(fragment);
        this.activeFragments.delete(id);
      }
    }

    return events;
  }

  /**
   * Private: Get lagging strand progress.
   */
  private getlaggingStrandProgress(): number {
    if (this.completedFragments.length === 0) {
      return 0;
    }

    const lastCompleted = this.completedFragments[this.completedFragments.length - 1];
    return lastCompleted.endPosition;
  }

  /**
   * Private: Get positions of all enzymes.
   */
  private getEnzymePositions(): EnzymePosition[] {
    return [
      {
        type: this.helicase.type,
        position: this.helicase.position,
        strand: 'leading' as const,
        isActive: this.helicase.isActive,
      },
      {
        type: this.primase.type,
        position: this.primase.position,
        strand: 'lagging' as const,
        isActive: this.primase.isActive,
      },
      {
        type: this.leadingPolymerase.type,
        position: this.leadingPolymerase.position,
        strand: 'leading' as const,
        isActive: this.leadingPolymerase.isActive,
      },
      {
        type: this.laggingPolymerase.type,
        position: this.laggingPolymerase.position,
        strand: 'lagging' as const,
        isActive: this.laggingPolymerase.isActive,
      },
      {
        type: this.ligase.type,
        position: this.ligase.position,
        strand: 'lagging' as const,
        isActive: this.ligase.isActive,
      },
      {
        type: this.exonuclease.type,
        position: this.exonuclease.position,
        strand: 'lagging' as const,
        isActive: this.exonuclease.isActive,
      },
    ];
  }

  /**
   * Private: Calculate fragment statistics.
   */
  private calculateFragmentStatistics(): { total: number; averageSize: number } {
    const allFragments = [...this.completedFragments, ...Array.from(this.activeFragments.values())];

    if (allFragments.length === 0) {
      return { total: 0, averageSize: 0 };
    }

    const totalSize = allFragments.reduce((sum, frag) => sum + frag.getLength(), 0);

    return {
      total: allFragments.length,
      averageSize: totalSize / allFragments.length,
    };
  }
}
