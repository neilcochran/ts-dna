import { RNA } from '../sequence/index.js';
import { PreMRNA } from '../transcription/index.js';
import { Result, success, failure, isFailure } from '../result/index.js';

/**
 * Splices a pre-mRNA by removing introns and joining exons to produce mature mRNA.
 * This function performs the core splicing operation that removes introns
 * and joins exons while maintaining proper reading frame.
 *
 * @param preMRNA - The pre-mRNA to splice
 * @param options - Splicing options. Set skipSpliceSiteValidation to true to skip
 *   splice site validation. Useful for mutation analysis where splice sites may be
 *   intentionally disrupted or mutations are far from splice boundaries.
 */
export function spliceRNA(
  preMRNA: PreMRNA,
  options: { skipSpliceSiteValidation?: boolean } = {},
): Result<RNA> {
  try {
    const exonRegions = preMRNA.exonRegions;
    const sequence = preMRNA.sequence.sequence;

    // Validate that we have exons to work with
    if (exonRegions.length === 0) {
      return failure('Cannot splice RNA: no exons found in pre-mRNA');
    }

    // Validate splice sites before proceeding using transcript coordinates (unless skipped)
    if (!options.skipSpliceSiteValidation) {
      const spliceSiteValidation = validateTranscriptSpliceSites(preMRNA);
      if (isFailure(spliceSiteValidation)) {
        return failure(`Splice site validation failed: ${spliceSiteValidation.error}`);
      }
    }

    // Extract and join exon sequences
    const exonSequences: string[] = [];

    for (const exon of exonRegions) {
      if (exon.start < 0 || exon.end > sequence.length) {
        return failure(`Exon region ${exon.start}-${exon.end} is outside sequence bounds`);
      }

      const exonSequence = sequence.substring(exon.start, exon.end);
      exonSequences.push(exonSequence);
    }

    // Join all exons to create mature mRNA sequence
    const matureSequence = exonSequences.join('');

    // Create and return mature RNA
    const matureRNA = new RNA(matureSequence);
    return success(matureRNA);
  } catch (error) {
    return failure(
      `RNA splicing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Validates splice sites using transcript coordinates and pre-mRNA sequence.
 * This fixes the coordinate system mismatch in the original validateAllSpliceSites function.
 *
 * @param preMRNA - The pre-mRNA to validate splice sites for
 * @returns Result indicating whether all splice sites are valid
 */
function validateTranscriptSpliceSites(preMRNA: PreMRNA): Result<boolean> {
  const intronRegions = preMRNA.intronRegions;

  if (intronRegions.length === 0) {
    // Single exon transcripts don't need splice site validation
    return success(true);
  }

  const transcriptSequence = preMRNA.sequence.sequence;

  for (let i = 0; i < intronRegions.length; i++) {
    const intron = intronRegions[i];

    // Check 5' splice site (donor) - should start with GT (or GU in RNA)
    if (intron.start + 1 < transcriptSequence.length) {
      const donorSite = transcriptSequence.substring(intron.start, intron.start + 2);
      if (donorSite !== 'GU') {
        // RNA uses U instead of T
        return failure(
          `Invalid 5' splice site at transcript position ${intron.start}: expected GU, found ${donorSite}`,
        );
      }
    }

    // Check 3' splice site (acceptor) - should end with AG
    if (intron.end >= 2) {
      const acceptorSite = transcriptSequence.substring(intron.end - 2, intron.end);
      if (acceptorSite !== 'AG') {
        return failure(
          `Invalid 3' splice site at transcript position ${intron.end - 2}: expected AG, found ${acceptorSite}`,
        );
      }
    }
  }

  return success(true);
}
