import { Result, success, failure } from '../result/index.js';
import type { DNA } from '../sequence/index.js';
import type { RNAPrimer } from './RNAPrimer.js';
import type { OkazakiFragmentError } from './errors.js';

/**
 * Module-private construction key gating the {@link OkazakiFragment} constructor. Not
 * re-exported from the package barrel; in-tree callers reach it via
 * {@link unsafeOkazakiFragment}.
 *
 * @internal
 */
const UNSAFE_OKAZAKI_KEY: unique symbol = Symbol('unsafe-okazaki-fragment');

/**
 * An immutable Okazaki fragment - a short stretch of newly synthesized DNA on the lagging
 * strand, initiated by an RNA primer.
 *
 * Fragments are represented by a single shape regardless of lifecycle stage. Optional fields
 * capture progress: `sequence` is `undefined` until DNA synthesis has filled the fragment;
 * `isPrimerRemoved` and `isLigated` track the post-synthesis processing steps. The event log
 * returned by `replicate` narrates the state transitions for each fragment; snapshots
 * yielded by `replicateSteps` carry fragments at varying lifecycle points.
 *
 * Instances are immutable. Transformations return new instances; there are no public
 * mutators. Public callers construct fragments via {@link parseOkazakiFragment}.
 */
export class OkazakiFragment {
  /**
   * Stable identifier for cross-referencing events that target this fragment. Unique within
   * the output of a single `replicate` / `replicateSteps` call; not guaranteed unique across
   * separate calls (a fresh counter starts each call).
   */
  public readonly id: string;

  /** 0-based start position on the lagging-strand template (inclusive). */
  public readonly startPosition: number;

  /** 0-based end position on the lagging-strand template (exclusive). */
  public readonly endPosition: number;

  /** The RNA primer that initiated synthesis of this fragment. */
  public readonly primer: RNAPrimer;

  /**
   * Newly synthesized DNA filling the fragment. `undefined` until DNA synthesis has
   * completed; populated thereafter.
   */
  public readonly sequence?: DNA;

  /** Whether the RNA primer has been excised by 5'-to-3' exonuclease. */
  public readonly isPrimerRemoved: boolean;

  /** Whether this fragment has been ligated to its 5'-adjacent fragment by DNA ligase. */
  public readonly isLigated: boolean;

  /**
   * Constructs an {@link OkazakiFragment} from already-validated inputs.
   *
   * Public callers must use {@link parseOkazakiFragment} (which validates positions and
   * primer-position consistency) or one of the `replication/`-internal `unsafe*` factories.
   * The constructor is gated by a module-private sentinel.
   *
   * @param id - Stable identifier
   * @param startPosition - 0-based start position (inclusive)
   * @param endPosition - 0-based end position (exclusive)
   * @param primer - The initiating RNA primer
   * @param sequence - Optional newly-synthesized DNA filling the fragment
   * @param isPrimerRemoved - Whether the primer has been excised
   * @param isLigated - Whether the fragment has been ligated
   * @param trustedKey - Module-private construction key.
   *
   * @throws Error if `trustedKey` is missing or does not match the sentinel
   */
  constructor(
    id: string,
    startPosition: number,
    endPosition: number,
    primer: RNAPrimer,
    sequence: DNA | undefined,
    isPrimerRemoved: boolean,
    isLigated: boolean,
    trustedKey: typeof UNSAFE_OKAZAKI_KEY,
  ) {
    if (trustedKey !== UNSAFE_OKAZAKI_KEY) {
      throw new Error('OkazakiFragment constructor is module-private; use parseOkazakiFragment');
    }
    this.id = id;
    this.startPosition = startPosition;
    this.endPosition = endPosition;
    this.primer = primer;
    this.sequence = sequence;
    this.isPrimerRemoved = isPrimerRemoved;
    this.isLigated = isLigated;
  }

  /**
   * Returns the length of this fragment in base pairs.
   *
   * @returns Length in base pairs
   */
  length(): number {
    return this.endPosition - this.startPosition;
  }

  /**
   * Returns `true` if this fragment has reached the final lifecycle stage (DNA synthesized,
   * primer removed, ligated to neighbor).
   *
   * @returns Whether the fragment is fully processed
   */
  isComplete(): boolean {
    return this.sequence !== undefined && this.isPrimerRemoved && this.isLigated;
  }

  /**
   * Returns a new {@link OkazakiFragment} with the given DNA `sequence` filled in. Used by
   * the replication pipeline as it advances a fragment from "primer-only" to
   * "DNA-synthesized" state.
   *
   * @param sequence - The DNA sequence to attach
   * @returns A new fragment carrying the supplied sequence
   *
   * @internal
   */
  withSequence(sequence: DNA): OkazakiFragment {
    return new OkazakiFragment(
      this.id,
      this.startPosition,
      this.endPosition,
      this.primer,
      sequence,
      this.isPrimerRemoved,
      this.isLigated,
      UNSAFE_OKAZAKI_KEY,
    );
  }

  /**
   * Returns a new {@link OkazakiFragment} marked as primer-removed. Used by the replication
   * pipeline to narrate the exonuclease step.
   *
   * @returns A new fragment with `isPrimerRemoved === true`
   *
   * @internal
   */
  withPrimerRemoved(): OkazakiFragment {
    return new OkazakiFragment(
      this.id,
      this.startPosition,
      this.endPosition,
      this.primer,
      this.sequence,
      true,
      this.isLigated,
      UNSAFE_OKAZAKI_KEY,
    );
  }

  /**
   * Returns a new {@link OkazakiFragment} marked as ligated. Used by the replication
   * pipeline to narrate the ligation step.
   *
   * @returns A new fragment with `isLigated === true`
   *
   * @internal
   */
  withLigated(): OkazakiFragment {
    return new OkazakiFragment(
      this.id,
      this.startPosition,
      this.endPosition,
      this.primer,
      this.sequence,
      this.isPrimerRemoved,
      true,
      UNSAFE_OKAZAKI_KEY,
    );
  }
}

/**
 * Parses raw fragment inputs into a validated {@link OkazakiFragment}.
 *
 * Validates: positions are non-negative integers, `endPosition > startPosition`, the primer's
 * `position` equals `startPosition`, and the supplied `sequence` (when present) has length
 * equal to `endPosition - startPosition`.
 *
 * @param id - Stable identifier
 * @param startPosition - 0-based start position (inclusive)
 * @param endPosition - 0-based end position (exclusive)
 * @param primer - The initiating RNA primer; its `position` must equal `startPosition`
 * @param options - Optional lifecycle fields (`sequence`, `isPrimerRemoved`, `isLigated`)
 * @returns `Result.success` containing the `OkazakiFragment`, or `Result.failure` carrying
 * an {@link OkazakiFragmentError}
 */
export function parseOkazakiFragment(
  id: string,
  startPosition: number,
  endPosition: number,
  primer: RNAPrimer,
  options?: {
    /** Newly-synthesized DNA filling the fragment. */
    sequence?: DNA;
    /** Whether the primer has been excised. Defaults to `false`. */
    isPrimerRemoved?: boolean;
    /** Whether the fragment has been ligated. Defaults to `false`. */
    isLigated?: boolean;
  },
): Result<OkazakiFragment, OkazakiFragmentError> {
  if (id.length === 0) {
    return failure({ kind: 'empty-id' });
  }
  if (!Number.isInteger(startPosition) || startPosition < 0) {
    return failure({ kind: 'invalid-position', position: startPosition, field: 'startPosition' });
  }
  if (!Number.isInteger(endPosition) || endPosition <= startPosition) {
    return failure({ kind: 'invalid-range', startPosition, endPosition });
  }
  if (primer.position !== startPosition) {
    return failure({
      kind: 'primer-position-mismatch',
      primerPosition: primer.position,
      startPosition,
    });
  }
  const sequence = options?.sequence;
  if (sequence !== undefined && sequence.sequence.length !== endPosition - startPosition) {
    return failure({
      kind: 'sequence-length-mismatch',
      sequenceLength: sequence.sequence.length,
      expectedLength: endPosition - startPosition,
    });
  }
  return success(
    new OkazakiFragment(
      id,
      startPosition,
      endPosition,
      primer,
      sequence,
      options?.isPrimerRemoved === true,
      options?.isLigated === true,
      UNSAFE_OKAZAKI_KEY,
    ),
  );
}

/**
 * Constructs an {@link OkazakiFragment} without re-validating the inputs. Reserved for
 * `replication/`-internal callers (the `replicate` pipeline) that already know the inputs
 * are well-formed.
 *
 * @internal
 */
export function unsafeOkazakiFragment(
  id: string,
  startPosition: number,
  endPosition: number,
  primer: RNAPrimer,
  sequence?: DNA,
  isPrimerRemoved: boolean = false,
  isLigated: boolean = false,
): OkazakiFragment {
  return new OkazakiFragment(
    id,
    startPosition,
    endPosition,
    primer,
    sequence,
    isPrimerRemoved,
    isLigated,
    UNSAFE_OKAZAKI_KEY,
  );
}
