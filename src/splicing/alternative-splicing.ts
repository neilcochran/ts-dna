import { Result, success, failure, isFailure } from '../result/index.js';
import { CODON_LENGTH, transcribeSequence } from '../sequence/index.js';
import { unsafeDNA } from '../sequence/DNA.js';
import { mRNACoord } from '../coordinates/index.js';
import type { Gene } from '../gene/index.js';
import type { PreMRNA } from '../transcription/index.js';
import { unsafeMRNA } from '../modifications/MRNA.js';
import type { MRNA } from '../modifications/MRNA.js';
import { SplicingOutcome } from './splicing-outcome.js';
import {
  validateSpliceVariant,
  DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
  type SpliceVariant,
  type AlternativeSplicingOptions,
} from '../variants/index.js';
import type { SplicingError } from './errors.js';

/**
 * Processes a pre-mRNA against a specific splice variant, producing the mature
 * {@link MRNA} that variant codes for.
 *
 * The variant's mature sequence is taken from the source gene's DNA, transcribed to RNA, and
 * wrapped in an `MRNA` with the entire transcript treated as coding sequence (no 5'/3' UTR
 * carve-out, no poly-A tail). Callers needing UTR boundaries or a poly-A tail should run the
 * variant through `processRNA` instead.
 *
 * @param preMRNA - The pre-mRNA whose source gene the variant references
 * @param variant - The splice variant to apply
 * @param options - Validation options
 * @returns `Result<MRNA, SplicingError>` carrying the mature mRNA on success
 */
export function spliceRNAWithVariant(
  preMRNA: PreMRNA,
  variant: SpliceVariant,
  options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
): Result<MRNA, SplicingError> {
  const sourceGene = preMRNA.sourceGene;
  const validation = validateSpliceVariant(variant, sourceGene, options);
  if (isFailure(validation)) {
    return failure(validation.error);
  }

  const variantSequence = sourceGene.getVariantSequence(variant);
  const rnaSequence = transcribeSequence(unsafeDNA(variantSequence));
  const length = rnaSequence.sequence.length;
  return success(unsafeMRNA(rnaSequence, mRNACoord(0), mRNACoord(length), true, 0));
}

/**
 * Processes every splice variant in a gene's splicing profile, producing a
 * {@link SplicingOutcome} per variant.
 *
 * Variants that fail processing are skipped silently in the output; if every variant fails
 * (and at least one was tried), the function still returns success with an empty array.
 *
 * @param preMRNA - The pre-mRNA whose source gene supplies the splicing profile
 * @param options - Validation options for each variant
 * @returns `Result<SplicingOutcome[], SplicingError>` listing every successfully-processed
 * variant, or `no-splicing-profile` on failure
 */
export function processAllSplicingVariants(
  preMRNA: PreMRNA,
  options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
): Result<SplicingOutcome[], SplicingError> {
  const sourceGene = preMRNA.sourceGene;
  const profile = sourceGene.splicingProfile;
  if (!profile) {
    return failure({ kind: 'no-splicing-profile' });
  }

  const outcomes: SplicingOutcome[] = [];
  for (const variant of profile.variants) {
    const splicingResult = spliceRNAWithVariant(preMRNA, variant, options);
    if (splicingResult.success) {
      const matureRNA = splicingResult.data;
      const codingSequence = matureRNA.sequence.sequence;
      const polypeptideLength = Math.floor(codingSequence.length / CODON_LENGTH);
      outcomes.push(new SplicingOutcome(variant, matureRNA, codingSequence, polypeptideLength));
    }
  }
  return success(outcomes);
}

/**
 * Resolves a gene's default splice variant and processes the pre-mRNA against it.
 *
 * @param preMRNA - The pre-mRNA whose source gene supplies the default variant
 * @param options - Validation options applied to the default variant
 * @returns `Result<MRNA, SplicingError>` carrying the mature mRNA on success
 */
export function processDefaultSpliceVariant(
  preMRNA: PreMRNA,
  options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
): Result<MRNA, SplicingError> {
  const sourceGene = preMRNA.sourceGene;
  const defaultVariant = sourceGene.getDefaultSplicingVariant();
  if (!defaultVariant) {
    return failure({ kind: 'no-default-variant' });
  }
  return spliceRNAWithVariant(preMRNA, defaultVariant, options);
}

/**
 * Lazy iterator yielding every splice variant of a gene that satisfies the supplied
 * {@link AlternativeSplicingOptions}.
 *
 * The iterator yields variants one at a time as the consumer pulls them, so callers can
 * `break` early, `take(n)`, or filter without paying for variants they never observe.
 *
 * Filtering applies the structural rules (first/last exon presence, minimum exon count) and,
 * when enabled, the reading-frame and start/stop-codon checks. Variants that fail validation
 * are skipped (not surfaced as errors); the iterator never throws.
 *
 * @param gene - The source gene
 * @param options - Validation options governing which variants are surfaced
 * @returns A generator over the matching variants in ascending bitmask order
 *
 * @example
 * ```typescript
 * for (const variant of enumerateSpliceVariants(gene)) {
 *   if (variant.includedExons.length === 3) {
 *     console.log(variant.name);
 *     break;
 *   }
 * }
 * ```
 */
export function* enumerateSpliceVariants(
  gene: Gene,
  options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
): Generator<SpliceVariant, void, undefined> {
  const totalExons = gene.exons.length;
  if (totalExons === 0) {
    return;
  }
  const maxCombinations = 1 << totalExons;
  for (let mask = 1; mask < maxCombinations; mask++) {
    const includedExons: number[] = [];
    for (let e = 0; e < totalExons; e++) {
      if (mask & (1 << e)) {
        includedExons.push(e);
      }
    }

    const variant: SpliceVariant = {
      name: `generated-variant-${includedExons.join('-')}`,
      includedExons,
    };

    if (isFailure(validateSpliceVariant(variant, gene, options))) {
      continue;
    }

    yield variant;
  }
}
