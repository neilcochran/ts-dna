/**
 * Module-private trusted constructors for {@link AminoAcid} and {@link Polypeptide}. Reserved
 * for `translation/`-internal callers (the {@link parseAminoAcid} parser, the `translate`
 * pipeline). Not re-exported from `src/translation/index.ts`.
 *
 * @internal
 */

import { unsafeRNA } from '../sequence/internal-factories.js';
import type { RNA } from '../sequence/index.js';
import type { MRNA } from '../processing/index.js';
import { AminoAcid } from './AminoAcid.js';
import type { AminoAcidData } from './AminoAcidData.js';
import { Polypeptide } from './Polypeptide.js';
import { UNSAFE_AMINO_ACID_KEY, UNSAFE_POLYPEPTIDE_KEY } from './internal-keys.js';

/**
 * Constructs an {@link AminoAcid} without re-running validation.
 *
 * @param codon - The validated RNA codon
 * @param data - The validated amino-acid data
 * @returns A new `AminoAcid`
 *
 * @internal
 */
export function unsafeAminoAcid(codon: RNA, data: AminoAcidData): AminoAcid {
  return new AminoAcid(codon, data, UNSAFE_AMINO_ACID_KEY);
}

/**
 * Constructs an {@link AminoAcid} from a trusted codon string and the matching data entry.
 * Skips both RNA parsing and codon-table lookup; the caller is asserting both are already
 * known to be consistent.
 *
 * @param codonString - A validated RNA codon string (3 characters over `{A, C, G, U}`)
 * @param data - The validated amino-acid data for that codon
 * @returns A new `AminoAcid`
 *
 * @internal
 */
export function unsafeAminoAcidFromString(codonString: string, data: AminoAcidData): AminoAcid {
  return unsafeAminoAcid(unsafeRNA(codonString), data);
}

/**
 * Constructs a {@link Polypeptide} without re-running validation. Provides symmetry with the
 * other gated types' unsafe factories.
 *
 * @param mRNA - The mRNA whose coding sequence produced this polypeptide
 * @param aminoAcids - The validated, in-order amino-acid sequence
 * @returns A new `Polypeptide`
 *
 * @internal
 */
export function unsafePolypeptide(mRNA: MRNA, aminoAcids: readonly AminoAcid[]): Polypeptide {
  return new Polypeptide(mRNA, aminoAcids, UNSAFE_POLYPEPTIDE_KEY);
}
