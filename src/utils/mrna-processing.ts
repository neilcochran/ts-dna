import { PreMRNA } from '../model/nucleic-acids/PreMRNA.js';
import { MRNA } from '../model/nucleic-acids/MRNA.js';
import { ValidationResult, success, failure, isSuccess } from '../types/validation-result.js';
import { spliceRNA } from './rna-processing.js';
import { findPolyadenylationSites, getStrongestPolyadenylationSite } from './polyadenylation.js';
import { START_CODON, STOP_CODONS } from './nucleic-acids.js';
import {
  DEFAULT_POLY_A_TAIL_LENGTH,
  CODON_LENGTH,
  DEFAULT_CLEAVAGE_OFFSET,
} from '../constants/biological-constants.js';

/**
 * Processes a pre-mRNA through the complete RNA processing pipeline to produce mature mRNA.
 *
 * The pipeline performs these steps in order:
 * 1. Add 5' methylguanosine cap
 * 2. Splice out introns (join exons)
 * 3. Find polyadenylation signal and cleavage site
 * 4. Add 3' poly-A tail
 * 5. Identify coding sequence boundaries
 * 6. Return mature MRNA ready for translation
 *
 * @param preMRNA - The pre-mRNA to process
 * @param options - Optional processing configuration
 * @returns ValidationResult containing mature MRNA or error message
 *
 * @example
 * ```typescript
 * const gene = new Gene(sequence, exons);
 * const preMRNA = transcribe(gene).unwrap();
 * const mRNA = processRNA(preMRNA).unwrap();
 *
 * console.log(`Mature mRNA: ${mRNA.getCodingSequence()}`);
 * console.log(`Has cap: ${mRNA.hasFivePrimeCap()}`);
 * console.log(`Poly-A length: ${mRNA.getPolyATailLength()}`);
 * ```
 */
export function processRNA(
  preMRNA: PreMRNA,
  options: RNAProcessingOptions = DEFAULT_RNA_PROCESSING_OPTIONS,
): ValidationResult<MRNA> {
  const opts = { ...DEFAULT_RNA_PROCESSING_OPTIONS, ...options };

  try {
    // Step 1 & 2: Splice out introns to create mature RNA sequence
    const splicingResult = spliceRNA(preMRNA);
    if (!isSuccess(splicingResult)) {
      return failure(`Splicing failed: ${splicingResult.error}`);
    }

    const splicedRNA = splicingResult.data;
    const processedSequence = splicedRNA.getSequence();

    // Step 3: Find polyadenylation site and determine cleavage site
    let cleavageSite = processedSequence.length;
    const polyATailLength = opts.polyATailLength;

    if (opts.addPolyATail) {
      const polySites = findPolyadenylationSites(splicedRNA);
      if (polySites.length > 0) {
        const strongestSite = getStrongestPolyadenylationSite(polySites);
        if (strongestSite) {
          cleavageSite =
            strongestSite.cleavageSite ??
            strongestSite.position + strongestSite.signal.length + DEFAULT_CLEAVAGE_OFFSET;

          // Ensure cleavage site is within sequence bounds
          cleavageSite = Math.min(cleavageSite, processedSequence.length);
        }
      }
    }

    // Step 4: Cleave at polyadenylation site and add poly-A tail
    let finalSequence = processedSequence;
    let polyATail = '';

    if (opts.addPolyATail) {
      // If polyadenylation site found and cleavage needed, cleave the sequence
      if (cleavageSite < processedSequence.length) {
        finalSequence = processedSequence.substring(0, cleavageSite);
      }
      // Always add poly-A tail when option is enabled
      polyATail = 'A'.repeat(polyATailLength);
      finalSequence += polyATail;
    }

    // Step 5: Identify coding sequence boundaries
    const codingBoundaries = findCodingSequence(finalSequence, polyATail.length);
    if (!isSuccess(codingBoundaries)) {
      return failure(`Failed to identify coding sequence: ${codingBoundaries.error}`);
    }

    const { codingStart, codingEnd, codingSequence } = codingBoundaries.data;

    // Step 6: Create mature MRNA with all processing modifications
    const mRNA = new MRNA(
      finalSequence,
      codingSequence,
      codingStart,
      codingEnd,
      opts.addFivePrimeCap,
      polyATail,
    );

    return success(mRNA);
  } catch (error) {
    return failure(
      `RNA processing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Configuration options for RNA processing pipeline.
 */
export interface RNAProcessingOptions {
  /** Whether to add 5' methylguanosine cap (default: true) */
  readonly addFivePrimeCap?: boolean;

  /** Whether to add 3' poly-A tail (default: true) */
  readonly addPolyATail?: boolean;

  /** Length of poly-A tail to add (default: 200) */
  readonly polyATailLength?: number;

  /** Whether to validate coding sequence has start/stop codons (default: true) */
  readonly validateCodons?: boolean;

  /** Minimum coding sequence length in nucleotides (default: 3) */
  readonly minimumCodingLength?: boolean;
}

/**
 * Default RNA processing options.
 */
export const DEFAULT_RNA_PROCESSING_OPTIONS: Required<RNAProcessingOptions> = {
  addFivePrimeCap: true,
  addPolyATail: true,
  polyATailLength: DEFAULT_POLY_A_TAIL_LENGTH,
  validateCodons: true,
  minimumCodingLength: true,
};

/**
 * Information about coding sequence boundaries within processed mRNA.
 */
interface CodingSequenceInfo {
  readonly codingStart: number;
  readonly codingEnd: number;
  readonly codingSequence: string;
}

/**
 * Finds the coding sequence boundaries within a processed mRNA sequence.
 *
 * @param sequence - The full mRNA sequence including any poly-A tail
 * @param polyATailLength - Length of poly-A tail to exclude from search
 * @returns ValidationResult with coding sequence information
 */
function findCodingSequence(
  sequence: string,
  polyATailLength: number = 0,
): ValidationResult<CodingSequenceInfo> {
  // Search region excludes poly-A tail
  const searchSequence = sequence.substring(0, sequence.length - polyATailLength);

  // Find start codon (AUG)
  const startCodonIndex = searchSequence.indexOf(START_CODON);
  if (startCodonIndex === -1) {
    return failure(`No start codon (${START_CODON}) found in sequence`);
  }

  // Find stop codon in frame after start codon
  let stopCodonIndex = -1;
  for (
    let i = startCodonIndex + CODON_LENGTH;
    i <= searchSequence.length - CODON_LENGTH;
    i += CODON_LENGTH
  ) {
    const codon = searchSequence.substring(i, i + CODON_LENGTH);
    if (STOP_CODONS.includes(codon)) {
      stopCodonIndex = i + CODON_LENGTH; // Include stop codon in coding sequence
      break;
    }
  }

  if (stopCodonIndex === -1) {
    return failure('No in-frame stop codon found after start codon');
  }

  const codingSequence = searchSequence.substring(startCodonIndex, stopCodonIndex);

  return success({
    codingStart: startCodonIndex,
    codingEnd: stopCodonIndex,
    codingSequence,
  });
}

/**
 * Converts a ProcessedRNA instance to the new MRNA class.
 * This is a migration utility for transitioning from the temporary ProcessedRNA class.
 *
 * @param processedRNA - The ProcessedRNA instance to convert
 * @returns ValidationResult containing the equivalent MRNA instance
 *
 * @example
 * ```typescript
 * const processedRNA = add5PrimeCap(someRNA);
 * const mRNA = convertProcessedRNAToMRNA(processedRNA).unwrap();
 * ```
 */
export function convertProcessedRNAToMRNA(processedRNA: {
  getSequence(): string;
  polyATail?: string;
  hasFivePrimeCap?: boolean;
}): ValidationResult<MRNA> {
  try {
    const sequence = processedRNA.getSequence();
    const polyATail = processedRNA.polyATail ?? '';
    const hasCap = processedRNA.hasFivePrimeCap ?? false;

    // Find coding sequence in the processed RNA
    const codingBoundaries = findCodingSequence(sequence + polyATail, polyATail.length);
    if (!isSuccess(codingBoundaries)) {
      return failure(`Failed to identify coding sequence: ${codingBoundaries.error}`);
    }

    const { codingStart, codingEnd, codingSequence } = codingBoundaries.data;
    const fullSequence = sequence + polyATail;

    const mRNA = new MRNA(fullSequence, codingSequence, codingStart, codingEnd, hasCap, polyATail);

    return success(mRNA);
  } catch (error) {
    return failure(
      `Failed to convert ProcessedRNA to MRNA: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
