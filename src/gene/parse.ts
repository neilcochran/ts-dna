import { Result, success, failure, isFailure } from '../result/index.js';
import { parseDNA } from '../sequence/index.js';
import type { DNA } from '../sequence/index.js';
import { geneCoord, type GeneCoord, type GenomicRegion } from '../coordinates/index.js';
import type { NucleotidePattern } from '../pattern/index.js';
import type { AlternativeSplicingProfile } from '../types/alternative-splicing.js';
import { Gene } from './Gene.js';
import { Promoter } from './Promoter.js';
import { PromoterElement } from './PromoterElement.js';
import {
  UNSAFE_GENE_KEY,
  UNSAFE_PROMOTER_KEY,
  UNSAFE_PROMOTER_ELEMENT_KEY,
} from './internal-keys.js';
import type { GeneError, PromoterError, PromoterElementError } from './errors.js';
import { validateExons } from './validate-exons.js';

/**
 * Parses an untrusted DNA-sequence string and exon list into a {@link Gene}.
 *
 * The pipeline is, in order:
 * 1. Parse the sequence string into a {@link DNA} via {@link parseDNA} (returns
 *    `invalid-sequence` on failure)
 * 2. Run {@link validateExons} against the parsed sequence length (returns the structured
 *    exon-rule failure on failure)
 * 3. If a splicing profile is supplied, validate it against the exon count (returns
 *    `invalid-splicing-profile` on failure)
 * 4. Brand the exons as {@link GeneCoord} regions, derive intron regions, and construct the
 *    {@link Gene}
 *
 * @param sequence - Candidate DNA sequence (case-insensitive)
 * @param exons - Exon regions in gene-relative coordinates
 * @param name - Optional gene name
 * @param splicingProfile - Optional alternative-splicing profile
 * @returns `Result` whose success branch carries a `Gene` and whose failure branch carries
 * a {@link GeneError}
 *
 * @example
 * ```typescript
 * const result = parseGene('ATGCCCGGGAAATTTAAA', [
 *   { start: 0, end: 6, name: 'exon1' },
 *   { start: 12, end: 18, name: 'exon2' },
 * ], 'BRCA1');
 * if (result.success) {
 *   console.log(result.data.exons.length); // 2
 * }
 * ```
 */
export function parseGene(
  sequence: string,
  exons: readonly GenomicRegion[],
  name?: string,
  splicingProfile?: AlternativeSplicingProfile,
): Result<Gene, GeneError> {
  const dnaResult = parseDNA(sequence);
  if (isFailure(dnaResult)) {
    return failure({ kind: 'invalid-sequence', cause: dnaResult.error });
  }
  const dna = dnaResult.data;

  const exonValidation = validateExons(exons, dna.getSequence().length);
  if (isFailure(exonValidation)) {
    return failure(exonValidation.error);
  }

  if (splicingProfile !== undefined) {
    const profileValidation = validateSplicingProfile(splicingProfile, exons.length);
    if (isFailure(profileValidation)) {
      return failure(profileValidation.error);
    }
  }

  const brandedExons: GenomicRegion<GeneCoord>[] = exons.map(exon => ({
    start: geneCoord(exon.start),
    end: geneCoord(exon.end),
    name: exon.name,
  }));
  const brandedIntrons = deriveIntrons(brandedExons);

  return success(unsafeGene(dna, brandedExons, brandedIntrons, name, splicingProfile));
}

/**
 * Parses a transcription start site, element list, and optional name into a {@link Promoter}.
 *
 * @param transcriptionStartSite - TSS position (must be a finite non-negative integer)
 * @param elements - Validated promoter elements
 * @param name - Optional promoter name
 * @returns `Result<Promoter, PromoterError>`
 */
export function parsePromoter(
  transcriptionStartSite: number,
  elements: readonly PromoterElement[],
  name?: string,
): Result<Promoter, PromoterError> {
  if (!Number.isFinite(transcriptionStartSite) || transcriptionStartSite < 0) {
    return failure({ kind: 'invalid-tss', tss: transcriptionStartSite });
  }
  return success(unsafePromoter(transcriptionStartSite, elements, name));
}

/**
 * Parses an element name, IUPAC pattern, position, and score weight into a
 * {@link PromoterElement}.
 *
 * @param name - Element name (must be non-empty)
 * @param pattern - IUPAC nucleotide pattern matching the element
 * @param position - Position relative to TSS, in base pairs (must be a finite integer)
 * @param scoreWeight - Score contribution for promoter-strength calculation (must be finite)
 * @returns `Result<PromoterElement, PromoterElementError>`
 */
export function parsePromoterElement(
  name: string,
  pattern: NucleotidePattern,
  position: number,
  scoreWeight: number,
): Result<PromoterElement, PromoterElementError> {
  if (name.length === 0) {
    return failure({ kind: 'empty-name' });
  }
  if (!Number.isFinite(position)) {
    return failure({ kind: 'invalid-position', position });
  }
  if (!Number.isFinite(scoreWeight)) {
    return failure({ kind: 'invalid-score-weight', scoreWeight });
  }
  return success(unsafePromoterElement(name, pattern, position, scoreWeight));
}

/**
 * Constructs a {@link Gene} without re-running validation. Reserved for `gene/`-internal
 * callers (parsers, the consensus-table module). Not exported from the package barrel.
 *
 * @param sequence - Validated DNA backing this gene
 * @param exons - Validated, branded exon regions
 * @param introns - Validated, branded intron regions
 * @param name - Optional gene name
 * @param splicingProfile - Optional alternative-splicing profile
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
 * callers. Not exported from the package barrel.
 *
 * @param transcriptionStartSite - Validated TSS position
 * @param elements - Validated promoter elements
 * @param name - Optional promoter name
 * @returns A new `Promoter`
 *
 * @internal
 */
export function unsafePromoter(
  transcriptionStartSite: number,
  elements: readonly PromoterElement[],
  name: string | undefined,
): Promoter {
  return new Promoter(transcriptionStartSite, elements, name, UNSAFE_PROMOTER_KEY);
}

/**
 * Constructs a {@link PromoterElement} without re-running validation. Reserved for
 * `gene/`-internal callers (parsers, the consensus-table module). Not exported from the
 * package barrel.
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

/**
 * Validates an alternative-splicing profile against the gene's exon count.
 *
 * Enforces:
 * - profile must contain at least one variant
 * - the named default variant must exist in the list
 * - each variant must include at least one exon
 * - each variant's exon indices must be in range
 * - exon indices within a variant must be unique
 * - variant names within the profile must be unique
 *
 * @param profile - The splicing profile to validate
 * @param totalExons - The gene's total exon count
 * @returns `Result<void, GeneError>`
 */
function validateSplicingProfile(
  profile: AlternativeSplicingProfile,
  totalExons: number,
): Result<void, GeneError> {
  if (profile.variants.length === 0) {
    return failure({
      kind: 'invalid-splicing-profile',
      reason: 'Splicing profile must contain at least one variant',
    });
  }

  const defaultExists = profile.variants.some(v => v.name === profile.defaultVariant);
  if (!defaultExists) {
    return failure({
      kind: 'invalid-splicing-profile',
      reason: `Default variant '${profile.defaultVariant}' not found in variants list`,
    });
  }

  for (const variant of profile.variants) {
    if (variant.includedExons.length === 0) {
      return failure({
        kind: 'invalid-splicing-profile',
        reason: `Variant '${variant.name}' must include at least one exon`,
      });
    }
    for (const exonIndex of variant.includedExons) {
      if (exonIndex < 0 || exonIndex >= totalExons) {
        return failure({
          kind: 'invalid-splicing-profile',
          reason: `Variant '${variant.name}' references invalid exon index ${exonIndex}. Gene has ${totalExons} exons.`,
        });
      }
    }
    const unique = new Set(variant.includedExons);
    if (unique.size !== variant.includedExons.length) {
      return failure({
        kind: 'invalid-splicing-profile',
        reason: `Variant '${variant.name}' contains duplicate exon indices`,
      });
    }
  }

  const variantNames = profile.variants.map(v => v.name);
  if (new Set(variantNames).size !== variantNames.length) {
    return failure({
      kind: 'invalid-splicing-profile',
      reason: 'Splicing profile contains duplicate variant names',
    });
  }

  return success(undefined);
}

/**
 * Derives intron regions from a validated exon list.
 *
 * Sorts the exons by `start`, then emits an intron for each adjacent pair where the gap is
 * positive. Naming follows the historical convention (`intron1`, `intron2`, ...).
 *
 * @param exons - Validated, branded exon regions
 * @returns Branded intron regions in gene-coordinate order
 */
function deriveIntrons(exons: readonly GenomicRegion<GeneCoord>[]): GenomicRegion<GeneCoord>[] {
  if (exons.length <= 1) {
    return [];
  }
  const sorted = [...exons].sort((a, b) => a.start - b.start);
  const introns: GenomicRegion<GeneCoord>[] = [];
  let intronCount = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.end < next.start) {
      introns.push({
        start: current.end,
        end: next.start,
        name: `intron${intronCount++}`,
      });
    }
  }
  return introns;
}
