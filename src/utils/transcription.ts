import { Gene } from '../model/nucleic-acids/Gene.js';
import { PreMRNA } from '../model/nucleic-acids/PreMRNA.js';
import { DNA } from '../model/nucleic-acids/DNA.js';
import { NucleotidePattern } from '../model/nucleic-acids/NucleotidePattern.js';
import {
  ValidationResult,
  success,
  failure,
  isFailure,
  isSuccess,
} from '../types/validation-result.js';
import { findPromoters, identifyTSS, PromoterSearchOptions } from './promoter-recognition.js';
import { convertToRNA } from './nucleic-acids.js';
import {
  DEFAULT_MAX_PROMOTER_SEARCH_DISTANCE,
  DEFAULT_DOWNSTREAM_SEARCH_DISTANCE,
  POLYA_SIGNAL_OFFSET,
  DEFAULT_MIN_PROMOTER_STRENGTH,
  FORCE_TSS_DISABLED,
  CANONICAL_POLYA_SIGNAL_DNA,
} from '../constants/biological-constants.js';
import { TATA_BOX } from '../data/promoter-elements.js';

/**
 * Configuration options for transcription.
 */
export interface TranscriptionOptions {
  /** Specific promoter pattern to look for (if not provided, will auto-detect) */
  promoterPattern?: NucleotidePattern;

  /** Maximum distance upstream to search for promoters (default: 1000bp) */
  maxPromoterSearchDistance?: number;

  /** Require a minimum promoter strength score (default: 5) */
  minPromoterStrength?: number;

  /** Force transcription from a specific position even without promoter */
  forceTranscriptionStartSite?: number;
}

/**
 * Gets default transcription options with lazy initialization.
 */
function getDefaultTranscriptionOptions(): Required<TranscriptionOptions> {
  return {
    promoterPattern: TATA_BOX.pattern, // Use existing TATA box consensus (TATAWAR)
    maxPromoterSearchDistance: DEFAULT_MAX_PROMOTER_SEARCH_DISTANCE,
    minPromoterStrength: DEFAULT_MIN_PROMOTER_STRENGTH,
    forceTranscriptionStartSite: FORCE_TSS_DISABLED,
  };
}

/**
 * Transcribes a gene into pre-mRNA by finding promoters and converting DNA to RNA.
 *
 * This function models the biological process of transcription:
 * 1. Searches for promoter elements upstream of the gene
 * 2. Determines the transcription start site (TSS)
 * 3. Transcribes the entire gene (exons + introns) into RNA
 * 4. Looks for polyadenylation signals to determine transcript end
 * 5. Returns PreMRNA with complete transcript and structural information
 *
 * @param gene - The gene to transcribe
 * @param options - Optional transcription configuration
 * @returns ValidationResult containing PreMRNA or error message
 *
 * @example
 * ```typescript
 * const gene = new Gene(dnaSequence, exons);
 * const result = transcribe(gene);
 *
 * if (isSuccess(result)) {
 *     const preMRNA = result.data;
 *     console.log(`Transcribed ${preMRNA.getSequence().length}nt pre-mRNA`);
 *     console.log(`Has ${preMRNA.getIntronRegions().length} introns to splice`);
 * } else {
 *     console.error('Transcription failed:', result.error);
 * }
 * ```
 */
export function transcribe(
  gene: Gene,
  options: TranscriptionOptions = {},
): ValidationResult<PreMRNA> {
  const opts = { ...getDefaultTranscriptionOptions(), ...options };

  try {
    // Step 1: Determine transcription start site
    let transcriptionStartSite: number;

    if (opts.forceTranscriptionStartSite >= 0) {
      // Use forced TSS if provided
      transcriptionStartSite = opts.forceTranscriptionStartSite;
    } else {
      // Find promoters to determine TSS
      const tssResult = findTranscriptionStartSite(gene, opts);
      if (isFailure(tssResult)) {
        return failure(tssResult.error);
      }
      transcriptionStartSite = tssResult.data;
    }

    // Step 2: Validate TSS is within reasonable bounds
    if (transcriptionStartSite < 0 || transcriptionStartSite >= gene.getSequence().length) {
      return failure(`Transcription start site ${transcriptionStartSite} is outside gene bounds`);
    }

    // Step 2.5: Validate TSS is compatible with gene exon structure
    const exonCompatibilityResult = validateTSSExonCompatibility(gene, transcriptionStartSite);
    if (isFailure(exonCompatibilityResult)) {
      return failure(exonCompatibilityResult.error);
    }

    // Step 3: Find polyadenylation site
    const polyAResult = findPolyadenylationSite(gene, transcriptionStartSite);
    const polyadenylationSite = isSuccess(polyAResult) ? polyAResult.data : undefined;

    // Step 4: Determine transcript end position
    const transcriptEnd = polyadenylationSite ?? gene.getSequence().length;

    // Step 5: Extract and transcribe the sequence
    const geneSequence = gene.getSequence();
    const transcriptDNA = geneSequence.substring(transcriptionStartSite, transcriptEnd);

    // Convert DNA to RNA
    const transcriptDNAObj = new DNA(transcriptDNA);
    const transcriptRNA = convertToRNA(transcriptDNAObj).getSequence();

    // Step 6: Create PreMRNA with structural information
    const preMRNA = new PreMRNA(
      transcriptRNA,
      gene,
      transcriptionStartSite,
      polyadenylationSite ? polyadenylationSite - transcriptionStartSite : undefined,
    );

    return success(preMRNA);
  } catch (error) {
    return failure(
      `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Finds the transcription start site by searching for promoters upstream of the gene.
 *
 * @param gene - The gene to analyze
 * @param options - Transcription options
 * @returns ValidationResult with TSS position or error
 */
function findTranscriptionStartSite(
  gene: Gene,
  options: Required<TranscriptionOptions>,
): ValidationResult<number> {
  try {
    // Create a DNA region upstream of the first exon to search for promoters
    const firstExon = gene.getExons()[0];
    if (!firstExon) {
      return failure('Gene has no exons');
    }

    const searchStart = Math.max(0, firstExon.start - options.maxPromoterSearchDistance);
    const searchEnd = firstExon.start + DEFAULT_DOWNSTREAM_SEARCH_DISTANCE; // Include some downstream region

    const searchRegion = gene.getSequence().substring(searchStart, searchEnd);
    const searchDNA = new DNA(searchRegion);

    // Configure promoter search options
    const promoterOptions: PromoterSearchOptions = {
      maxUpstreamDistance: options.maxPromoterSearchDistance,
      maxDownstreamDistance: DEFAULT_DOWNSTREAM_SEARCH_DISTANCE,
      minStrengthScore: options.minPromoterStrength,
      minElements: 1,
    };

    // Find promoters in the search region
    const promoters = findPromoters(searchDNA, promoterOptions);

    if (promoters.length === 0) {
      return failure(
        `No promoters found upstream of gene within ${options.maxPromoterSearchDistance}bp`,
      );
    }

    // Use the strongest promoter (they're returned sorted by strength)
    const bestPromoter = promoters[0];

    // Get TSS positions for this promoter
    const tssPositions = identifyTSS(bestPromoter, searchDNA);

    if (tssPositions.length === 0) {
      return failure('Could not determine transcription start site from promoter');
    }

    // Use the first TSS and adjust for the search region offset
    const tssInSearchRegion = tssPositions[0];
    const tssInGene = searchStart + tssInSearchRegion;

    return success(tssInGene);
  } catch (error) {
    return failure(`TSS search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Searches for polyadenylation signals (AATAAA in DNA, which becomes AAUAAA in RNA) to determine transcript end.
 *
 * @param gene - The gene to analyze
 * @param tss - Transcription start site position
 * @returns ValidationResult with polyadenylation site position or failure
 */
function findPolyadenylationSite(gene: Gene, tss: number): ValidationResult<number> {
  try {
    const sequence = gene.getSequence();
    const searchStart = tss;

    // Search for DNA polyadenylation signal AATAAA (becomes AAUAAA in RNA)
    const searchRegion = sequence.substring(searchStart);
    const searchDNA = new DNA(searchRegion);

    // Look for canonical polyadenylation signal AATAAA in DNA
    const polyAPattern = new NucleotidePattern(CANONICAL_POLYA_SIGNAL_DNA);
    const matches = polyAPattern.findMatches(searchDNA);

    if (matches.length === 0) {
      return failure('No polyadenylation signal found');
    }

    // Use the first (closest to TSS) polyadenylation site
    // Add POLYA_SIGNAL_OFFSET to get past the AATAAA signal itself
    const polyASite = searchStart + matches[0].start + POLYA_SIGNAL_OFFSET;

    return success(polyASite);
  } catch (error) {
    return failure(
      `Polyadenylation site search failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Validates that the detected TSS is compatible with the gene's exon structure.
 *
 * This prevents the common issue where promoter-detected TSS places exons at
 * negative coordinates after coordinate transformation.
 *
 * @param gene - The gene with exon definitions
 * @param tss - The detected transcription start site
 * @returns ValidationResult indicating compatibility
 */
function validateTSSExonCompatibility(gene: Gene, tss: number): ValidationResult<void> {
  const exons = gene.getExons();

  if (exons.length === 0) {
    return success(undefined);
  }

  // Check if any exons would have negative coordinates after TSS transformation
  const invalidExons = exons.filter(exon => exon.start < tss);

  if (invalidExons.length > 0) {
    const exonDetails = invalidExons
      .map(exon => `exon "${exon.name ?? 'unnamed'}" (${exon.start}-${exon.end})`)
      .join(', ');

    return failure(
      `TSS at position ${tss} conflicts with gene exon structure. ` +
        `The following exons would have negative coordinates: ${exonDetails}. ` +
        `Consider using forceTranscriptionStartSite option to manually set TSS, ` +
        `or adjust exon coordinates to start after position ${tss}.`,
    );
  }

  // Warn if TSS is very close to first exon (might indicate design issue)
  const firstExon = exons[0];
  if (firstExon && firstExon.start - tss < 3) {
    // Don't fail, but this might indicate a potential issue
    // We could add logging here in the future
  }

  return success(undefined);
}
