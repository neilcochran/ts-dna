import { Result, success, failure } from '../result/index.js';
import { CODON_LENGTH, START_CODON, isStopCodon, transcribeSequence } from '../sequence/index.js';
import { unsafeDNA } from '../sequence/internal-factories.js';
import type { Gene } from '../gene/Gene.js';
import type { SpliceVariant, AlternativeSplicingOptions } from './splice-variant.js';
import { DEFAULT_ALTERNATIVE_SPLICING_OPTIONS } from './splice-variant.js';
import type { VariantValidationError } from './errors.js';

/**
 * Validates a splice variant against a gene's exon structure and the supplied
 * {@link AlternativeSplicingOptions}.
 *
 * Checks performed (in order): exon-index range, first-exon presence, last-exon presence,
 * minimum-exon count, reading-frame divisibility, start/stop codons.
 *
 * @param variant - The splice variant to validate
 * @param gene - The source gene
 * @param options - Validation options (defaults applied where omitted)
 * @returns `Result<void, VariantValidationError>` carrying the first failing rule on the
 * failure branch
 */
export function validateSpliceVariant(
  variant: SpliceVariant,
  gene: Gene,
  options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS,
): Result<void, VariantValidationError> {
  const opts = { ...DEFAULT_ALTERNATIVE_SPLICING_OPTIONS, ...options };
  const totalExons = gene.exons.length;

  for (const exonIndex of variant.includedExons) {
    if (exonIndex < 0 || exonIndex >= totalExons) {
      return failure({
        kind: 'variant-invalid-exon-index',
        variantName: variant.name,
        exonIndex,
        totalExons,
      });
    }
  }

  if (!opts.allowSkipFirstExon && !variant.includedExons.includes(0)) {
    return failure({ kind: 'variant-skips-first-exon', variantName: variant.name });
  }
  if (!opts.allowSkipLastExon && !variant.includedExons.includes(totalExons - 1)) {
    return failure({ kind: 'variant-skips-last-exon', variantName: variant.name });
  }

  if (opts.requireMinimumExons) {
    const minimum = opts.minimumExonCount ?? 1;
    if (variant.includedExons.length < minimum) {
      return failure({
        kind: 'variant-below-minimum-exons',
        variantName: variant.name,
        included: variant.includedExons.length,
        minimum,
      });
    }
  }

  if (opts.validateReadingFrames === true || opts.validateCodons === true) {
    const variantSequence = gene.getVariantSequence(variant);
    if (opts.validateReadingFrames === true && variantSequence.length % CODON_LENGTH !== 0) {
      return failure({
        kind: 'variant-not-in-frame',
        variantName: variant.name,
        length: variantSequence.length,
      });
    }
    if (opts.validateCodons && variantSequence.length >= CODON_LENGTH) {
      const variantRNA = transcribeSequence(unsafeDNA(variantSequence)).sequence;
      const startCodon = variantRNA.substring(0, CODON_LENGTH);
      if (startCodon !== START_CODON) {
        return failure({
          kind: 'variant-missing-start-codon',
          variantName: variant.name,
          found: startCodon,
        });
      }
      const lastCodon = variantRNA.substring(variantRNA.length - CODON_LENGTH);
      if (!isStopCodon(lastCodon)) {
        return failure({
          kind: 'variant-missing-stop-codon',
          variantName: variant.name,
          found: lastCodon,
        });
      }
    }
  }

  return success(undefined);
}
