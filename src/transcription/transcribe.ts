import { Result, success, failure, isFailure } from '../result/index.js';
import { unsafeDNA, unsafeRNA } from '../sequence/parse.js';
import type { Gene } from '../gene/index.js';
import {
  geneCoord,
  transcriptCoord,
  type GeneCoord,
  type GenomicRegion,
  type TranscriptCoord,
} from '../coordinates/index.js';
import { NucleotidePattern, parseNucleotidePattern } from '../pattern/index.js';
import type { TranscriptionError } from './errors.js';
import type { PreMRNA } from './PreMRNA.js';
import { unsafePreMRNA } from './parse.js';
import { findPromoters, identifyTSS, type PromoterSearchOptions } from './promoter-recognition.js';
import {
  DEFAULT_MAX_PROMOTER_SEARCH_DISTANCE,
  DEFAULT_DOWNSTREAM_SEARCH_DISTANCE,
  POLYA_SIGNAL_OFFSET,
  DEFAULT_MIN_PROMOTER_STRENGTH,
  CANONICAL_POLYA_SIGNAL_DNA,
} from '../constants/biological-constants.js';

/**
 * Configuration options for {@link transcribe}.
 *
 * Defaults are inlined where they are read; consumers usually pass an empty object.
 */
export interface TranscriptionOptions {
  /** Maximum distance upstream of the first exon to search for promoters. Default 1000 bp. */
  maxPromoterSearchDistance?: number;

  /** Minimum strength score for a promoter to be accepted. Default 5. */
  minPromoterStrength?: number;

  /**
   * Forces the TSS to a specific gene-relative position, bypassing promoter detection.
   * `undefined` (the default) re-enables auto-detection.
   */
  forceTranscriptionStartSite?: number;
}

/**
 * Compiled at module load: pattern matching the canonical DNA polyadenylation signal
 * (`AATAAA`, which becomes `AAUAAA` in RNA). Hoisted out of the per-call hot path so the
 * regex is not rebuilt on every transcription.
 */
const CANONICAL_POLYA_PATTERN: NucleotidePattern = parseNucleotidePattern(
  CANONICAL_POLYA_SIGNAL_DNA,
).unwrap();

/**
 * Transcribes a {@link Gene} into a {@link PreMRNA}.
 *
 * Steps:
 * 1. Determine the transcription start site (gene-relative). If `options.forceTranscriptionStartSite`
 *    is set, that position is used directly; otherwise {@link findPromoters} + {@link identifyTSS}
 *    locate the strongest promoter upstream of the first exon and predict the TSS.
 * 2. Validate that the TSS is in-bounds and does not lie downstream of any exon start (which
 *    would produce negative transcript coordinates after translation).
 * 3. Search for the canonical polyadenylation signal downstream of the TSS to bracket the
 *    transcript; if no signal is found, the transcript extends to the gene end.
 * 4. Convert the gene-DNA slice into RNA (replacing T with U) and construct the
 *    {@link PreMRNA} (which
 *    eagerly computes transcript-coordinate exon and intron regions).
 *
 * @param gene - The gene to transcribe
 * @param options - Optional transcription configuration
 * @returns `Result<PreMRNA, TranscriptionError>`
 *
 * @example
 * ```typescript
 * const gene = parseGene(dnaSequence, exons).unwrap();
 * const result = transcribe(gene);
 * if (result.success) {
 *   const preMRNA = result.data;
 *   console.log(`Transcribed ${preMRNA.sequence.sequence.length}nt pre-mRNA`);
 *   console.log(`Has ${preMRNA.intronRegions.length} introns to splice`);
 * }
 * ```
 */
export function transcribe(
  gene: Gene,
  options: TranscriptionOptions = {},
): Result<PreMRNA, TranscriptionError> {
  if (gene.exons.length === 0) {
    return failure({ kind: 'gene-has-no-exons' });
  }

  const maxPromoterSearchDistance =
    options.maxPromoterSearchDistance ?? DEFAULT_MAX_PROMOTER_SEARCH_DISTANCE;
  const minPromoterStrength = options.minPromoterStrength ?? DEFAULT_MIN_PROMOTER_STRENGTH;
  const geneSequence = gene.sequence.sequence;

  let tssValue: number;
  if (options.forceTranscriptionStartSite !== undefined) {
    tssValue = options.forceTranscriptionStartSite;
  } else {
    const tssResult = findTranscriptionStartSite(
      gene,
      maxPromoterSearchDistance,
      minPromoterStrength,
    );
    if (isFailure(tssResult)) {
      return failure(tssResult.error);
    }
    tssValue = tssResult.data;
  }

  if (tssValue < 0 || tssValue >= geneSequence.length) {
    return failure({
      kind: 'tss-out-of-bounds',
      tss: tssValue,
      sequenceLength: geneSequence.length,
    });
  }

  const tss = geneCoord(tssValue);
  const conflictingExons = gene.exons.reduce<number[]>((acc, exon, index) => {
    if (exon.start < tss) {
      acc.push(index);
    }
    return acc;
  }, []);
  if (conflictingExons.length > 0) {
    return failure({ kind: 'tss-conflicts-with-exons', tss, conflictingExons });
  }

  const polyAGeneSite = findPolyadenylationSite(geneSequence, tssValue);
  const transcriptEnd = polyAGeneSite ?? geneSequence.length;

  const transcriptDNAString = geneSequence.substring(tssValue, transcriptEnd);
  const transcriptRNA = unsafeRNA(transcriptDNAString.replaceAll('T', 'U'));

  const polyA: TranscriptCoord | undefined =
    polyAGeneSite === undefined ? undefined : transcriptCoord(polyAGeneSite - tssValue);

  return success(unsafePreMRNA(transcriptRNA, gene, tss, polyA));
}

/**
 * Promoter-driven TSS detection. Builds a DNA window spanning the configured upstream search
 * distance plus a fixed downstream stretch, locates the strongest promoter via
 * {@link findPromoters}, and resolves its TSS via {@link identifyTSS}.
 *
 * @param gene - The gene whose first exon anchors the search window
 * @param maxPromoterSearchDistance - Upstream search radius in base pairs
 * @param minPromoterStrength - Strength threshold a promoter must clear to qualify
 * @returns `Result` with the gene-relative TSS or a {@link TranscriptionError} on failure
 */
function findTranscriptionStartSite(
  gene: Gene,
  maxPromoterSearchDistance: number,
  minPromoterStrength: number,
): Result<number, TranscriptionError> {
  const firstExon = gene.exons[0];
  const searchStart = Math.max(0, firstExon.start - maxPromoterSearchDistance);
  const searchEnd = Math.min(
    gene.sequence.sequence.length,
    firstExon.start + DEFAULT_DOWNSTREAM_SEARCH_DISTANCE,
  );
  const searchRegion: GenomicRegion<GeneCoord> = {
    start: geneCoord(searchStart),
    end: geneCoord(searchEnd),
  };

  const searchDNA = unsafeDNA(gene.sequence.sequence.substring(searchStart, searchEnd));

  const promoterOptions: PromoterSearchOptions = {
    maxUpstreamDistance: maxPromoterSearchDistance,
    maxDownstreamDistance: DEFAULT_DOWNSTREAM_SEARCH_DISTANCE,
    minStrengthScore: minPromoterStrength,
    minElements: 1,
  };

  const promoters = findPromoters(searchDNA, promoterOptions);
  if (promoters.length === 0) {
    return failure({
      kind: 'no-promoter-found',
      searchedRegion: searchRegion,
      minStrength: minPromoterStrength,
    });
  }

  const bestPromoter = promoters[0];
  const tssPositions = identifyTSS(bestPromoter, searchDNA);
  if (tssPositions.length === 0) {
    return failure({ kind: 'tss-not-identifiable' });
  }

  return success(searchStart + tssPositions[0]);
}

/**
 * Locates the closest canonical polyadenylation signal downstream of the TSS.
 *
 * @param geneSequence - The full gene DNA sequence
 * @param tss - Gene-relative TSS position
 * @returns Gene-relative cleavage site (signal start + {@link POLYA_SIGNAL_OFFSET}), or
 * `undefined` when no signal was found
 */
function findPolyadenylationSite(geneSequence: string, tss: number): number | undefined {
  const searchRegion = unsafeDNA(geneSequence.substring(tss));
  const matches = CANONICAL_POLYA_PATTERN.findAll(searchRegion);
  if (matches.length === 0) {
    return undefined;
  }
  return tss + matches[0].start + POLYA_SIGNAL_OFFSET;
}
