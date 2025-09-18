import { GenomicRegion } from '../types/genomic-region';
import {
  MIN_INTRON_LENGTH_FOR_SPLICING,
  DONOR_SPLICE_CONSENSUS,
  ACCEPTOR_SPLICE_CONSENSUS,
  DEFAULT_MAX_INTRON_SEARCH,
} from '../constants/biological-constants';

/**
 * Common splice site donor sequences (5' splice sites).
 * GT is the canonical donor site found in ~99% of introns.
 */
export const SPLICE_DONOR_SEQUENCES = [DONOR_SPLICE_CONSENSUS] as const;

/**
 * Common splice site acceptor sequences (3' splice sites).
 * AG is the canonical acceptor site found in ~99% of introns.
 */
export const SPLICE_ACCEPTOR_SEQUENCES = [ACCEPTOR_SPLICE_CONSENSUS] as const;

/**
 * Validates that introns follow GT-AG splice site consensus sequences.
 * Checks that each intron starts with GT (donor) and ends with AG (acceptor).
 *
 * @param sequence - The complete gene sequence
 * @param introns - Array of intron regions to validate
 * @returns Object containing validation result and details
 *
 * @example
 * ```typescript
 * const sequence = 'ATGGTCCCAGTTAAA';
 * const introns = [{ start: 3, end: 11 }];
 * const result = validateSpliceSites(sequence, introns);
 * // result.isValid = true (intron sequence 'GTCCCAG' starts with GT, ends with AG)
 * ```
 */
export function validateSpliceSites(
  sequence: string,
  introns: GenomicRegion[],
): {
  isValid: boolean;
  invalidIntrons: Array<{
    intron: GenomicRegion;
    reason: string;
    sequence: string;
  }>;
} {
  const invalidIntrons: Array<{
    intron: GenomicRegion;
    reason: string;
    sequence: string;
  }> = [];

  for (const intron of introns) {
    const intronSequence = sequence.substring(intron.start, intron.end);

    // Check minimum length (need at least 4 bases for GT...AG)
    if (intronSequence.length < MIN_INTRON_LENGTH_FOR_SPLICING) {
      invalidIntrons.push({
        intron,
        reason: `Intron too short (${intronSequence.length} bases). Minimum length is ${MIN_INTRON_LENGTH_FOR_SPLICING} for GT-AG splice sites.`,
        sequence: intronSequence,
      });
      continue;
    }

    const donor = intronSequence.substring(0, 2);
    const acceptor = intronSequence.substring(intronSequence.length - 2);

    // Check donor site (5' splice site)
    if (!SPLICE_DONOR_SEQUENCES.includes(donor as (typeof SPLICE_DONOR_SEQUENCES)[number])) {
      invalidIntrons.push({
        intron,
        reason: `Invalid donor site '${donor}'. Expected one of: ${SPLICE_DONOR_SEQUENCES.join(', ')}`,
        sequence: intronSequence,
      });
    }

    // Check acceptor site (3' splice site)
    if (
      !SPLICE_ACCEPTOR_SEQUENCES.includes(acceptor as (typeof SPLICE_ACCEPTOR_SEQUENCES)[number])
    ) {
      invalidIntrons.push({
        intron,
        reason: `Invalid acceptor site '${acceptor}'. Expected one of: ${SPLICE_ACCEPTOR_SEQUENCES.join(', ')}`,
        sequence: intronSequence,
      });
    }
  }

  return {
    isValid: invalidIntrons.length === 0,
    invalidIntrons,
  };
}

/**
 * Finds potential splice sites in a DNA sequence.
 * Searches for GT (donor) and AG (acceptor) sequences that could form valid introns.
 *
 * @param sequence - DNA sequence to search
 * @param minIntronLength - Minimum intron length (default: 4)
 * @param maxIntronLength - Maximum intron length (default: {@link DEFAULT_MAX_INTRON_SEARCH})
 * @returns Array of potential intron regions with GT-AG splice sites
 */
export function findPotentialSpliceSites(
  sequence: string,
  minIntronLength: number = MIN_INTRON_LENGTH_FOR_SPLICING,
  maxIntronLength: number = DEFAULT_MAX_INTRON_SEARCH,
): GenomicRegion[] {
  const potentialIntrons: GenomicRegion[] = [];

  // Find all GT positions (potential donors)
  const gtPositions: number[] = [];
  for (let i = 0; i <= sequence.length - 2; i++) {
    if (sequence.substring(i, i + 2) === DONOR_SPLICE_CONSENSUS) {
      gtPositions.push(i);
    }
  }

  // Find all AG positions (potential acceptors)
  const agPositions: number[] = [];
  for (let i = 0; i <= sequence.length - 2; i++) {
    if (sequence.substring(i, i + 2) === ACCEPTOR_SPLICE_CONSENSUS) {
      agPositions.push(i);
    }
  }

  // Match GT-AG pairs within size constraints
  for (const gtPos of gtPositions) {
    for (const agPos of agPositions) {
      // AG should be after GT
      if (agPos <= gtPos) {
        continue;
      }

      const intronStart = gtPos;
      const intronEnd = agPos + 2; // Include the AG
      const intronLength = intronEnd - intronStart;

      if (
        intronLength >= minIntronLength &&
        intronLength <= maxIntronLength &&
        intronEnd <= sequence.length
      ) {
        potentialIntrons.push({
          start: intronStart,
          end: intronEnd,
          name: `potential_intron_${intronStart}_${intronEnd}`,
        });
      }
    }
  }

  return potentialIntrons.sort((a, b) => a.start - b.start);
}
