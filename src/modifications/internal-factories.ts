/**
 * Module-private trusted constructor for {@link MRNA}. Reserved for `modifications/`-internal
 * callers (the {@link parseMRNA} parser, the `processRNA` pipeline) and the splice-variant
 * processors inside `splicing/`. Not re-exported from `src/modifications/index.ts`.
 *
 * @internal
 */

import type { RNA } from '../sequence/index.js';
import type { MatureMRNACoord } from '../coordinates/index.js';
import { MRNA } from './MRNA.js';
import { UNSAFE_MRNA_KEY } from './internal-keys.js';

/**
 * Constructs an {@link MRNA} without re-running validation.
 *
 * @param sequence - Validated RNA sequence
 * @param codingStart - Validated, branded coding-sequence start (0-based inclusive)
 * @param codingEnd - Validated, branded coding-sequence end (0-based exclusive)
 * @param fivePrimeCap - 5'-cap flag
 * @param polyATailLength - Poly-A tail length in nucleotides
 * @returns A new `MRNA`
 *
 * @internal
 */
export function unsafeMRNA(
  sequence: RNA,
  codingStart: MatureMRNACoord,
  codingEnd: MatureMRNACoord,
  fivePrimeCap: boolean,
  polyATailLength: number,
): MRNA {
  return new MRNA(sequence, codingStart, codingEnd, fivePrimeCap, polyATailLength, UNSAFE_MRNA_KEY);
}
