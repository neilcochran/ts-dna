/**
 * Module-private trusted constructors for the `gene/` domain types. Reserved for callers
 * that have already validated their inputs (via `parseGene` / `parsePromoter` /
 * `parsePromoterElement` or by construction-mathematics) and want to skip the re-validation
 * cost.
 *
 * Not re-exported from `src/gene/index.ts`; package consumers reach the validated
 * construction path through the parsers. Other in-tree modules (e.g. the consensus
 * promoter-element instances) import these factories directly from this file.
 *
 * @internal
 */

import type { DNA } from '../sequence/index.js';
import type { GeneCoord, GenomicRegion } from '../coordinates/index.js';
import type { NucleotidePattern } from '../pattern/index.js';
import type { AlternativeSplicingProfile } from '../variants/index.js';
import { Gene } from './Gene.js';
import { Promoter } from './Promoter.js';
import { PromoterElement } from './PromoterElement.js';
import {
  UNSAFE_GENE_KEY,
  UNSAFE_PROMOTER_KEY,
  UNSAFE_PROMOTER_ELEMENT_KEY,
} from './internal-keys.js';

/**
 * Constructs a {@link Gene} without re-running validation. Reserved for `gene/`-internal
 * callers.
 *
 * @param sequence - Validated DNA sequence
 * @param exons - Validated, branded exon regions
 * @param introns - Validated, branded intron regions
 * @param name - Optional gene name
 * @param splicingProfile - Optional, validated alternative-splicing profile
 * @returns A new `Gene`
 *
 * @internal
 */
export function unsafeGene(
  sequence: DNA,
  exons: readonly GenomicRegion<GeneCoord>[],
  introns: readonly GenomicRegion<GeneCoord>[],
  name: string | undefined,
  splicingProfile: AlternativeSplicingProfile | undefined,
): Gene {
  return new Gene(sequence, exons, introns, name, splicingProfile, UNSAFE_GENE_KEY);
}

/**
 * Constructs a {@link Promoter} without re-running validation. Reserved for `gene/`-internal
 * callers.
 *
 * @param transcriptionStartSite - Validated, branded gene-coordinate TSS
 * @param elements - Validated promoter elements
 * @param name - Optional promoter name
 * @returns A new `Promoter`
 *
 * @internal
 */
export function unsafePromoter(
  transcriptionStartSite: GeneCoord,
  elements: readonly PromoterElement[],
  name: string | undefined,
): Promoter {
  return new Promoter(transcriptionStartSite, elements, name, UNSAFE_PROMOTER_KEY);
}

/**
 * Constructs a {@link PromoterElement} without re-running validation. Reserved for
 * `gene/`-internal callers (parsers, the consensus-table module).
 *
 * @param name - Validated element name
 * @param pattern - IUPAC nucleotide pattern
 * @param position - Validated TSS-relative position
 * @param scoreWeight - Validated score weight
 * @returns A new `PromoterElement`
 *
 * @internal
 */
export function unsafePromoterElement(
  name: string,
  pattern: NucleotidePattern,
  position: number,
  scoreWeight: number,
): PromoterElement {
  return new PromoterElement(name, pattern, position, scoreWeight, UNSAFE_PROMOTER_ELEMENT_KEY);
}
